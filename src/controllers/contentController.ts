import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { db, storage } from '../config/firebase.js';
import { generateContentFlow, analyzePerformance } from '../services/geminiService.js';
import { FieldValue } from 'firebase-admin/firestore';
import { GeneratedContent } from '../types.js';
import { Buffer } from 'buffer';

const bucket = storage.bucket();

export const generateContent = async (req: AuthenticatedRequest, res: Response) => {
    const { topic, language, shouldGenerateImage, selectedPlatforms, context } = req.body;
    const userId = req.user!.uid;

    try {
        // 1. Generate Content via Gemini
        // We enrich the context with user info server-side for security
        const fullContext = {
            ...context,
            user: { displayName: req.user!.displayName, uid: userId }
        };

        const content = await generateContentFlow(
            topic,
            language,
            shouldGenerateImage,
            selectedPlatforms,
            fullContext
        );

        // 2. Prepare for DB Save
        const docRef = db.collection("generations").doc();
        const contentId = docRef.id;
        
        const uploadedImages = [];

        // 3. Upload Base64 Images to Firebase Storage
        if (content.images && content.images.length > 0) {
            for (let i = 0; i < content.images.length; i++) {
                const imgData = content.images[i];
                if (imgData.url.startsWith('data:image/')) {
                    const base64Data = imgData.url.split(';base64,').pop();
                    const fileName = `images/${userId}/${contentId}/${Date.now()}_${i}.png`;
                    const file = bucket.file(fileName);
                    
                    await file.save(Buffer.from(base64Data!, 'base64'), {
                        metadata: { contentType: 'image/png' }
                    });
                    await file.makePublic(); 
                    
                    uploadedImages.push({
                        url: file.publicUrl(),
                        prompt: imgData.prompt
                    });
                } else {
                    // Keep external URLs (e.g. placeholders)
                    uploadedImages.push(imgData);
                }
            }
        }

        // 4. Save to Firestore
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
            createdAt: FieldValue.serverTimestamp()
        };

        await docRef.set(dataToSave);
        
        // Update Topic Status
        if (context.topicId) {
            await db.collection("topics").doc(context.topicId).update({ 
                status: 'Generated', 
                contentId: contentId 
            });
        }

        res.json({ contentId, content: { ...content, images: uploadedImages } });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to generate or save content" });
    }
};

export const getUserContent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.uid;
        const snapshot = await db.collection("generations")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();
        
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch content" });
    }
};

export const regenerateAnalysis = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { contentId, platforms } = req.body;
        const docRef = db.collection("generations").doc(contentId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
             res.status(404).json({ error: "Content not found" });
             return;
        }

        const content = docSnap.data() as GeneratedContent;
        const analysis = await analyzePerformance(content, platforms);

        await docRef.update({ analysis });
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: "Analysis failed" });
    }
};