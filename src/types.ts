import { Timestamp } from 'firebase-admin/firestore';

// Re-export types used in logic
export type View = 'magicCreator' | 'projects' | 'brandVoice' | 'account' | 'calendar' | 'aiVisibility';
export type EditablePlatform = 'web' | 'facebook' | 'linkedin' | 'x' | 'tiktok' | 'youtube';

// Helper for API Responses where Timestamps are serialized to ISO strings or similar
export type FirestoreTimestamp = Timestamp;

export interface SEOAnalysis {
  score: number;
  headlineStrength: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  keywordAnalysis: {
    density: number;
    feedback: string;
  };
  readability: {
    score: number;
    feedback: string;
  };
}

export interface TikTokAnalysis {
  hookScore: number;
  hookFeedback: string;
  predictedRetention: number;
  retentionFeedback: string;
}

export interface FacebookAnalysis {
  engagementScore: number;
  ctaPresence: {
    detected: boolean;
    feedback: string;
  };
  sentiment: {
    score: number;
    label: string;
  };
  lengthAnalysis: {
    isOptimal: boolean;
    feedback: string;
  };
}

export interface PerformanceAnalysis {
  web?: SEOAnalysis;
  tiktok?: TikTokAnalysis;
  facebook?: FacebookAnalysis;
}

export interface GeneratedContent {
  mainArticle: {
    title: string;
    body: string;
  };
  images: {
    url: string;
    prompt: string;
  }[];
  web?: {
    metaTitle: string;
    metaDescription: string;
    body: string;
    htmlBody: string;
    focusKeyword: string;
  };
  facebook?: {
    postText: string;
  };
  linkedin?: {
    postText: string;
  };
  x?: {
    postText: string;
  };
  tiktok?: {
    script: string;
  };
  youtube?: {
    title: string;
    description: string;
  };
  analysis?: PerformanceAnalysis;
  // Internal use for flow
  imagePrompts?: string[]; 
}

export interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: FirestoreTimestamp;
}

export interface Campaign {
  id: string;
  name: string;
  goal: string;
  projectId: string;
  userId: string;
  createdAt: FirestoreTimestamp;
}

export interface Topic {
  id: string;
  name: string;
  status: 'Draft' | 'Generated';
  campaignId: string;
  projectId: string;
  userId: string;
  createdAt: FirestoreTimestamp;
  contentId?: string;
}

export type SavedContent = GeneratedContent & {
  id: string;
  userId: string;
  topic: string;
  language: string;
  createdAt: FirestoreTimestamp;
  projectId: string;
  campaignId: string;
  topicId: string;
};

export interface BrandVoiceProfile {
  id: string;
  userId: string;
  name: string;
  createdAt: FirestoreTimestamp;
  toneAndManner: string;
  vocabularyLevel: string;
  sentenceStructure: string;
  dos: string[];
  donts: string[];
}

export interface CalendarSettings {
    userId: string;
    mainTopics: string;
    targetAudience: string;
}

export interface CalendarEvent {
    id: string;
    userId: string;
    title: string;
    start: Timestamp | string; // Allow string for JSON I/O
    status: 'suggested_trend' | 'suggested_event' | 'draft' | 'published';
    type: 'trend' | 'event' | 'manual';
    contentId?: string;
    insight?: string;
    suggestedAngles?: {
        title: string;
        predictionScore: number;
    }[];
}

export interface ActionItem {
    type: 'opportunity' | 'threat';
    insight: string;
    suggested_action: string;
}

export interface AIVisibilitySettings {
    userId: string;
    brandName: string;
    domain: string;
    keywords: string[];
    competitors: string[];
    projectId?: string;
    brandVoiceProfileId?: string;
}

export interface AIVisibilityResult {
    id: string;
    userId: string;
    createdAt: FirestoreTimestamp;
    shareOfVoice: { brand: string; percentage: number }[];
    sentimentCounts: {
        positive: number;
        neutral: number;
        negative: number;
    };
    sentimentAnalysis: {
        brand: string;
        sentiment: 'positive' | 'neutral' | 'negative';
        reason: string;
    }[];
    citationTracking: {
        query: string;
        domain: string;
        cited: boolean;
        url?: string;
        snippet?: string;
    }[];
    actionItem?: ActionItem;
}

export interface FullGenerationContext {
    user?: { displayName: string; uid: string };
    projects?: Project[];
    campaigns?: Campaign[];
    brandVoiceProfile?: Omit<BrandVoiceProfile, 'id' | 'userId' | 'createdAt'>;
}