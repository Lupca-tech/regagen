import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { db, isFirebaseEnabled } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import { generateCalendarSuggestions } from '../services/geminiService.js';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

const inMemoryData: { [collection: string]: { [userId: string]: any[] } } = {
    projects: {},
    campaigns: {},
    topics: {},
    calendarEvents: {}
};

export const getProjects = async (req: AuthenticatedRequest, res: Response) => {
    if (isFirebaseEnabled) {
        const snapshot = await db.collection("projects")
            .where("userId", "==", req.user!.uid)
            .orderBy("createdAt", "desc")
            .get();
        res.json(snapshot.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() })));
    } else {
        const userId = req.user!.uid;
        const projects = (inMemoryData.projects[userId] || []).sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        res.json(projects);
    }
};

export const createProject = async (req: AuthenticatedRequest, res: Response) => {
    const data = req.body;
    const userId = req.user!.uid;
    
    if (isFirebaseEnabled) {
        const docRef = await db.collection("projects").add({
            ...data,
            userId,
            createdAt: FieldValue.serverTimestamp()
        });
        res.json({ id: docRef.id });
    } else {
        const id = `proj_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const project = {
            id,
            ...data,
            userId,
            createdAt: new Date().toISOString()
        };
        if (!inMemoryData.projects[userId]) inMemoryData.projects[userId] = [];
        inMemoryData.projects[userId].push(project);
        res.json({ id });
    }
};

export const getCampaigns = async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.query;
    const userId = req.user!.uid;
    
    if (isFirebaseEnabled) {
        let q = db.collection("campaigns").where("userId", "==", userId);
        if (projectId) q = q.where("projectId", "==", projectId);
        
        const snapshot = await q.orderBy("createdAt", "desc").get();
        res.json(snapshot.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() })));
    } else {
        let campaigns = inMemoryData.campaigns[userId] || [];
        if (projectId) {
            campaigns = campaigns.filter((c: any) => c.projectId === projectId);
        }
        campaigns = campaigns.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        res.json(campaigns);
    }
};

export const createCampaign = async (req: AuthenticatedRequest, res: Response) => {
    const data = req.body;
    const userId = req.user!.uid;
    
    if (isFirebaseEnabled) {
        const docRef = await db.collection("campaigns").add({
            ...data,
            userId,
            createdAt: FieldValue.serverTimestamp()
        });
        res.json({ id: docRef.id });
    } else {
        const id = `camp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const campaign = {
            id,
            ...data,
            userId,
            createdAt: new Date().toISOString()
        };
        if (!inMemoryData.campaigns[userId]) inMemoryData.campaigns[userId] = [];
        inMemoryData.campaigns[userId].push(campaign);
        res.json({ id });
    }
};

export const getTopics = async (req: AuthenticatedRequest, res: Response) => {
    const { campaignId } = req.query;
    const userId = req.user!.uid;
    
    if (isFirebaseEnabled) {
        let q = db.collection("topics").where("userId", "==", userId);
        if (campaignId) q = q.where("campaignId", "==", campaignId);
        
        const snapshot = await q.orderBy("createdAt", "desc").get();
        res.json(snapshot.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() })));
    } else {
        let topics = inMemoryData.topics[userId] || [];
        if (campaignId) {
            topics = topics.filter((t: any) => t.campaignId === campaignId);
        }
        topics = topics.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        res.json(topics);
    }
};

export const createTopic = async (req: AuthenticatedRequest, res: Response) => {
    const data = req.body;
    const userId = req.user!.uid;
    
    if (isFirebaseEnabled) {
        const docRef = await db.collection("topics").add({
            ...data,
            status: 'Draft',
            userId,
            createdAt: FieldValue.serverTimestamp()
        });
        res.json({ id: docRef.id });
    } else {
        const id = `topic_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const topic = {
            id,
            ...data,
            status: 'Draft',
            userId,
            createdAt: new Date().toISOString()
        };
        if (!inMemoryData.topics[userId]) inMemoryData.topics[userId] = [];
        inMemoryData.topics[userId].push(topic);
        res.json({ id });
    }
};

export const getCalendarEvents = async (req: AuthenticatedRequest, res: Response) => {
    const { start, end } = req.query;
    const userId = req.user!.uid;

    try {
        if (isFirebaseEnabled) {
            const snapshot = await db.collection("calendarEvents")
                .where("userId", "==", userId)
                .where("date", ">=", start)
                .where("date", "<=", end)
                .get();
            res.json(snapshot.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() })));
        } else {
            let events = inMemoryData.calendarEvents[userId] || [];
            if (start && end) {
                events = events.filter((e: any) => e.date >= start && e.date <= end);
            }
            res.json(events);
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch calendar events" });
    }
};

export const generateAndSaveSuggestions = async (req: AuthenticatedRequest, res: Response) => {
    const { currentDate, settings } = req.body;
    const userId = req.user!.uid;

    try {
        const suggestions = await generateCalendarSuggestions(settings, currentDate);

        if (isFirebaseEnabled) {
            const batch = db.batch();
            suggestions.forEach((sugg: any) => {
                const docRef = db.collection("calendarEvents").doc();
                batch.set(docRef, {
                    ...sugg,
                    userId,
                    createdAt: FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
        } else {
            if (!inMemoryData.calendarEvents[userId]) inMemoryData.calendarEvents[userId] = [];
            suggestions.forEach((sugg: any) => {
                inMemoryData.calendarEvents[userId].push({
                    id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    ...sugg,
                    userId,
                    createdAt: new Date().toISOString()
                });
            });
        }

        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ error: "Failed to generate suggestions" });
    }
};
