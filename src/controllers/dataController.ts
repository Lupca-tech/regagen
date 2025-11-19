import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import { generateCalendarSuggestions } from '../services/geminiService.js';

// --- PROJECTS ---
export const getProjects = async (req: AuthenticatedRequest, res: Response) => {
    const snapshot = await db.collection("projects")
        .where("userId", "==", req.user!.uid)
        .orderBy("createdAt", "desc")
        .get();
    res.json(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
};

export const createProject = async (req: AuthenticatedRequest, res: Response) => {
    const data = req.body;
    const docRef = await db.collection("projects").add({
        ...data,
        userId: req.user!.uid,
        createdAt: FieldValue.serverTimestamp()
    });
    res.json({ id: docRef.id });
};

// --- CAMPAIGNS ---
export const getCampaigns = async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.query;
    let q = db.collection("campaigns").where("userId", "==", req.user!.uid);
    if (projectId) q = q.where("projectId", "==", projectId);
    
    const snapshot = await q.orderBy("createdAt", "desc").get();
    res.json(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
};

export const createCampaign = async (req: AuthenticatedRequest, res: Response) => {
    const data = req.body;
    const docRef = await db.collection("campaigns").add({
        ...data,
        userId: req.user!.uid,
        createdAt: FieldValue.serverTimestamp()
    });
    res.json({ id: docRef.id });
};

// --- TOPICS ---
export const getTopics = async (req: AuthenticatedRequest, res: Response) => {
    const { campaignId } = req.query;
    let q = db.collection("topics").where("userId", "==", req.user!.uid);
    if (campaignId) q = q.where("campaignId", "==", campaignId);
    
    const snapshot = await q.orderBy("createdAt", "desc").get();
    res.json(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
};

export const createTopic = async (req: AuthenticatedRequest, res: Response) => {
    const data = req.body;
    const docRef = await db.collection("topics").add({
        ...data,
        status: 'Draft',
        userId: req.user!.uid,
        createdAt: FieldValue.serverTimestamp()
    });
    res.json({ id: docRef.id });
};

// --- CALENDAR ---
export const getCalendarEvents = async (req: AuthenticatedRequest, res: Response) => {
    const { start, end } = req.query;
    // Note: Simple string comparison for ISO dates often works, 
    // but constructing Dates is safer for Firestore
    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    const snapshot = await db.collection("calendarEvents")
        .where("userId", "==", req.user!.uid)
        .where("start", ">=", startDate)
        .where("start", "<=", endDate)
        .get();

    const events = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamp to ISO string for Client
        const isoStart = data.start.toDate().toISOString();
        return { id: doc.id, ...data, start: isoStart };
    });
    res.json(events);
};

export const generateAndSaveSuggestions = async (req: AuthenticatedRequest, res: Response) => {
    const { settings, currentDate } = req.body;
    try {
        const suggestions = await generateCalendarSuggestions(settings, currentDate);
        
        const batch = db.batch();
        suggestions.forEach((s: any) => {
            const ref = db.collection("calendarEvents").doc();
            batch.set(ref, {
                userId: req.user!.uid,
                title: s.title,
                start: new Date(s.date), // Convert string to Date for Firestore
                status: s.type === 'trend' ? 'suggested_trend' : 'suggested_event',
                type: s.type,
                insight: s.insight,
                suggestedAngles: s.suggestedAngles
            });
        });
        await batch.commit();
        res.json({ success: true, count: suggestions.length });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to generate suggestions" });
    }
};