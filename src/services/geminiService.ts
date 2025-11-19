import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import dotenv from 'dotenv';
import type { 
    GeneratedContent, 
    EditablePlatform, 
    BrandVoiceProfile, 
    Project, 
    Campaign, 
    PerformanceAnalysis, 
    CalendarSettings,
    FullGenerationContext
} from '../types.js';

dotenv.config();

if (!process.env.API_KEY && !process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(process.env.API_KEY || process.env.GEMINI_API_KEY || '');

const allPlatformProperties = {
  web: {
    type: SchemaType.OBJECT,
    properties: {
      metaTitle: { type: SchemaType.STRING, description: "An SEO-optimized meta title (50-60 characters)." },
      metaDescription: { type: SchemaType.STRING, description: "An SEO-optimized meta description (150-160 characters)." },
      body: { type: SchemaType.STRING, description: "The main article body, optimized for web reading with clear headings and structure, formatted as plain text with markdown-style line breaks." },
      htmlBody: { type: SchemaType.STRING, description: "A clean, semantic HTML version of the article body. Use tags like <h2>, <h3>, <p>, <strong>, <em>, <ul>, and <li>." },
      focusKeyword: { type: SchemaType.STRING, description: "The single most important keyword or phrase (2-4 words) that the content should rank for." }
    },
    required: ["metaTitle", "metaDescription", "body", "htmlBody", "focusKeyword"],
  },
  facebook: {
    type: SchemaType.OBJECT,
    properties: {
      postText: { type: SchemaType.STRING, description: "A short, engaging Facebook post with emojis and a call to action." },
    },
    required: ["postText"],
  },
  linkedin: {
    type: SchemaType.OBJECT,
    properties: {
      postText: { type: SchemaType.STRING, description: "A professional, business-oriented LinkedIn post. It should be insightful, use relevant hashtags, and encourage professional discussion." },
    },
    required: ["postText"],
  },
  x: {
    type: SchemaType.OBJECT,
    properties: {
      postText: { type: SchemaType.STRING, description: "A concise, impactful post for X (formerly Twitter), under 280 characters, with relevant hashtags." },
    },
    required: ["postText"],
  },
  tiktok: {
    type: SchemaType.OBJECT,
    properties: {
      script: { type: SchemaType.STRING, description: "A script for a 30-60 second TikTok/YT Shorts video, including visual cues and spoken lines." },
    },
    required: ["script"],
  },
  youtube: {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING, description: "A catchy, keyword-rich title for a YouTube video." },
      description: { type: SchemaType.STRING, description: "A detailed YouTube video description with timestamps, links, and hashtags." },
    },
    required: ["title", "description"],
  },
};

async function generateImage(prompt: string): Promise<string> {
    try {
        console.log("Image generation not yet supported in standard Gemini SDK, using placeholder.");
        return `https://picsum.photos/seed/${encodeURIComponent(prompt.substring(0, 20))}/1024/768`;
    } catch (error) {
        console.error("Error generating image:", error);
        return `https://picsum.photos/seed/${encodeURIComponent(prompt.substring(0, 20))}/1024/768`;
    }
}

export const analyzePerformance = async (
  content: GeneratedContent,
  platforms: ('web' | 'tiktok' | 'facebook')[]
): Promise<PerformanceAnalysis> => {
    const analysisProperties: any = {};
    const requiredProperties: string[] = [];
    let contentToAnalyze = "Here is the content to analyze:\n\n";

    const seoAnalysisSchema = {
        type: SchemaType.OBJECT,
        properties: {
            score: { type: SchemaType.NUMBER },
            headlineStrength: { 
                type: SchemaType.OBJECT, 
                properties: { 
                    score: { type: SchemaType.NUMBER }, 
                    feedback: { type: SchemaType.STRING }, 
                    suggestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } } 
                } 
            },
            keywordAnalysis: { 
                type: SchemaType.OBJECT, 
                properties: { 
                    density: { type: SchemaType.NUMBER }, 
                    feedback: { type: SchemaType.STRING } 
                } 
            },
            readability: { 
                type: SchemaType.OBJECT, 
                properties: { 
                    score: { type: SchemaType.NUMBER }, 
                    feedback: { type: SchemaType.STRING } 
                } 
            }
        }
    };

    if (platforms.includes('web') && content.web) {
        analysisProperties.web = seoAnalysisSchema; 
        requiredProperties.push('web');
        contentToAnalyze += `--- WEB CONTENT ---\nTitle: ${content.web.metaTitle}\nBody: ${content.web.body}\n\n`;
    }

    if (requiredProperties.length === 0) return {};

    const systemInstruction = `You are a world-class performance marketing analyst. Analyze the provided content. Output JSON only.`;

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction,
            generationConfig: {
                responseMimeType: "application/json",
            }
        });
        
        const result = await model.generateContent(contentToAnalyze);
        const response = result.response;
        return JSON.parse(response.text().trim());
    } catch (error) {
        console.error("Error analyzing content:", error);
        return {};
    }
};

export const generateContentFlow = async (
  topic: string, 
  language: string, 
  shouldGenerateImage: boolean, 
  selectedPlatforms: EditablePlatform[],
  generationContext?: FullGenerationContext
): Promise<GeneratedContent> => {
  try {
    const properties: any = {
       mainArticle: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          body: { type: SchemaType.STRING },
        },
        required: ["title", "body"],
      },
    };
    
    if (shouldGenerateImage) {
      properties.imagePrompts = {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      };
    }

    const required = ['mainArticle'];
    if (shouldGenerateImage) required.push('imagePrompts');

    for (const platform of selectedPlatforms) {
        if (allPlatformProperties[platform]) {
            properties[platform] = allPlatformProperties[platform];
            required.push(platform);
        }
    }
    
    const dynamicContentGenerationSchema = {
      type: SchemaType.OBJECT,
      properties,
      required,
    };

    let ragContext = '';
    if (generationContext) {
        ragContext = `User: "${generationContext.user?.displayName}". Brand Context: ${generationContext.brandVoiceProfile?.name || 'None'}.`;
    }

    const systemInstruction = `You are a world-class content strategist. Topic: "${topic}". Language: ${language}. ${ragContext}. Return JSON only.`;
    
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: dynamicContentGenerationSchema,
            temperature: 0.8,
        }
    });

    const result = await model.generateContent(`Generate a full content package for: "${topic}"`);
    const response = result.response;
    const textContent = JSON.parse(response.text().trim());
    
    const resultContent: GeneratedContent = {
      mainArticle: textContent.mainArticle,
      images: [],
      ...textContent
    };
    
    if (shouldGenerateImage && textContent.imagePrompts && textContent.imagePrompts.length > 0) {
        const imagePrompts: string[] = textContent.imagePrompts;
        const imageUrls = await Promise.all(
            imagePrompts.map(prompt => generateImage(prompt))
        );

        resultContent.images = imageUrls.map((url, index) => ({
            url: url,
            prompt: imagePrompts[index]
        }));
    }

    return resultContent;

  } catch (error) {
    console.error("Error in content generation flow:", error);
    throw new Error("Gemini generation failed");
  }
};

export const generateCalendarSuggestions = async (
  settings: CalendarSettings,
  currentDate: string
): Promise<any[]> => {
    const systemInstruction = `Generate 5 strategic content ideas (JSON) for ${settings.mainTopics}. Output schema: { suggestions: [{ title, date (YYYY-MM-DD), type (trend/event), insight, suggestedAngles: [{title, predictionScore}] }] }`;
    
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction,
        generationConfig: {
            responseMimeType: "application/json",
        }
    });

    const result = await model.generateContent(`Date context: ${currentDate}. Target Audience: ${settings.targetAudience}.`);
    const response = result.response;
    const json = JSON.parse(response.text().trim());
    return json.suggestions || [];
};
