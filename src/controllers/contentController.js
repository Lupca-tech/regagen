import { db, storage, isFirebaseEnabled } from '../config/firebase.js';
import { generateContentFlow, analyzePerformance } from '../services/geminiService.js';
import { FieldValue } from 'firebase-admin/firestore';
import { Buffer } from 'buffer';

const bucket = isFirebaseEnabled ? storage.bucket() : null;

const inMemoryStore = {};

export const generateContent = async (req, res) => {
    const { topic, language, shouldGenerateImage, selectedPlatforms } = req.body;
    const context = req.body.context ?? {};
    const userId = req.user.uid;

    try {
        // 1. Generate Content via Gemini
        // We enrich the context with user info server-side for security
        const fullContext = {
            ...context,
            user: { displayName: req.user.displayName, uid: userId }
        };

        const content = await generateContentFlow(
            topic,
            language,
            shouldGenerateImage,
            selectedPlatforms,
            fullContext
        );

        // 2. Prepare for DB Save
        const contentId = isFirebaseEnabled ? db.collection("generations").doc().id : `gen_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        const uploadedImages = [];

        // 3. Upload Base64 Images to Firebase Storage (or keep as-is if Firebase disabled)
        if (content.images && content.images.length > 0) {
            for (let i = 0; i < content.images.length; i++) {
                const imgData = content.images[i];
                if (isFirebaseEnabled && bucket && imgData.url.startsWith('data:image/')) {
                    const base64Data = imgData.url.split(';base64,').pop();
                    const fileName = `images/${userId}/${contentId}/${Date.now()}_${i}.png`;
                    const file = bucket.file(fileName);
                    
                    await file.save(Buffer.from(base64Data, 'base64'), {
                        metadata: { contentType: 'image/png' }
                    });
                    await file.makePublic(); 
                    
                    uploadedImages.push({
                        url: file.publicUrl(),
                        prompt: imgData.prompt
                    });
                } else {
                    uploadedImages.push(imgData);
                }
            }
        }

        // 4. Save to Firestore or in-memory store
        const dataToSave = {
            mainArticle: content.mainArticle || {},
            images: uploadedImages,
            web: content.web || null,
            facebook: content.facebook || null,
            linkedin: content.linkedin || null,
            x: content.x || null,
            tiktok: content.tiktok || null,
            youtube: content.youtube || null,
            analysis: content.analysis || null,
            id: contentId,
            userId,
            topic,
            language,
            projectId: context.projectId,
            campaignId: context.campaignId,
            topicId: context.topicId,
            createdAt: isFirebaseEnabled ? FieldValue.serverTimestamp() : new Date().toISOString()
        };

        if (isFirebaseEnabled) {
            const docRef = db.collection("generations").doc(contentId);
            await docRef.set(dataToSave);
            
            if (context.topicId) {
                await db.collection("topics").doc(context.topicId).update({ 
                    status: 'Generated', 
                    contentId: contentId 
                });
            }
        } else {
            if (!inMemoryStore[userId]) inMemoryStore[userId] = [];
            inMemoryStore[userId].unshift(dataToSave);
        }

        res.json({ contentId, content: { ...content, images: uploadedImages } });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to generate or save content" });
    }
};

export const getUserContent = async (req, res) => {
    try {
        const userId = req.user.uid;
        
        if (isFirebaseEnabled) {
            const snapshot = await db.collection("generations")
                .where("userId", "==", userId)
                .orderBy("createdAt", "desc")
                .get();
            
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            res.json(data);
        } else {
            const data = inMemoryStore[userId] || [];
            res.json(data);
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch content" });
    }
};

export const regenerateAnalysis = async (req, res) => {
    try {
        const { contentId, platforms } = req.body;
        
        let content = null;
        
        if (isFirebaseEnabled) {
            const docRef = db.collection("generations").doc(contentId);
            const docSnap = await docRef.get();

            if (!docSnap.exists) {
                res.status(404).json({ error: "Content not found" });
                return;
            }
            content = docSnap.data();
        } else {
            const userId = req.user.uid;
            const userContent = inMemoryStore[userId] || [];
            content = userContent.find((c) => c.id === contentId);
            
            if (!content) {
                res.status(404).json({ error: "Content not found" });
                return;
            }
        }

        const analysis = await analyzePerformance(content, platforms);

        if (isFirebaseEnabled) {
            const docRef = db.collection("generations").doc(contentId);
            await docRef.update({ analysis });
        } else {
            const userId = req.user.uid;
            const userContent = inMemoryStore[userId] || [];
            const index = userContent.findIndex((c) => c.id === contentId);
            if (index >= 0) {
                userContent[index].analysis = analysis;
            }
        }
        
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: "Analysis failed" });
    }
};
