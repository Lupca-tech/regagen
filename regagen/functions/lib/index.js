"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeBrandVoice = exports.regeneratePlatform = exports.generateContent = void 0;
const dotenv = __importStar(require("dotenv"));
const functions = __importStar(require("firebase-functions"));
const app_1 = require("firebase-admin/app");
const genai_1 = require("@google/genai");
// Load environment variables from .env file
dotenv.config();
// Initialize Firebase Admin SDK
(0, app_1.initializeApp)();
// Initialize Gemini AI with the secret API key from environment
let ai;
try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        functions.logger.warn("GEMINI_API_KEY environment variable is not set. Functions will fail until it's configured.");
    }
    else {
        ai = new genai_1.GoogleGenAI({ apiKey });
    }
}
catch (error) {
    functions.logger.error("Failed to initialize Gemini AI:", error);
}
// --- HELPER SCHEMAS & FUNCTIONS ---
const allPlatformProperties = {
    web: {
        type: genai_1.Type.OBJECT,
        properties: {
            metaTitle: { type: genai_1.Type.STRING, description: "An SEO-optimized meta title (50-60 characters)." },
            metaDescription: { type: genai_1.Type.STRING, description: "An SEO-optimized meta description (150-160 characters)." },
            body: { type: genai_1.Type.STRING, description: "The main article body, optimized for web reading with clear headings and structure, formatted as plain text with markdown-style line breaks." },
            htmlBody: { type: genai_1.Type.STRING, description: "A clean, semantic HTML version of the article body. Use tags like <h2>, <h3>, <p>, <strong>, <em>, <ul>, and <li>." },
        },
        required: ["metaTitle", "metaDescription", "body", "htmlBody"],
    },
    facebook: {
        type: genai_1.Type.OBJECT,
        properties: { postText: { type: genai_1.Type.STRING, description: "A short, engaging Facebook post with emojis and a call to action." } },
        required: ["postText"],
    },
    linkedin: {
        type: genai_1.Type.OBJECT,
        properties: { postText: { type: genai_1.Type.STRING, description: "A professional, business-oriented LinkedIn post. It should be insightful, use relevant hashtags, and encourage professional discussion." } },
        required: ["postText"],
    },
    x: {
        type: genai_1.Type.OBJECT,
        properties: { postText: { type: genai_1.Type.STRING, description: "A concise, impactful post for X (formerly Twitter), under 280 characters, with relevant hashtags." } },
        required: ["postText"],
    },
    tiktok: {
        type: genai_1.Type.OBJECT,
        properties: { script: { type: genai_1.Type.STRING, description: "A script for a 30-60 second TikTok/YT Shorts video, including visual cues and spoken lines." } },
        required: ["script"],
    },
    youtube: {
        type: genai_1.Type.OBJECT,
        properties: {
            title: { type: genai_1.Type.STRING, description: "A catchy, keyword-rich title for a YouTube video." },
            description: { type: genai_1.Type.STRING, description: "A detailed YouTube video description with timestamps, links, and hashtags." },
        },
        required: ["title", "description"],
    },
};
async function generateImage(prompt) {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [genai_1.Modality.IMAGE],
            },
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData?.data) {
                const base64ImageBytes = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        throw new Error("No image data found in response.");
    }
    catch (error) {
        functions.logger.error("Error generating image:", error);
        return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/1024/768`;
    }
}
// --- CALLABLE CLOUD FUNCTIONS ---
/**
 * Generates the full content package based on a topic.
 */
exports.generateContent = functions.https.onCall(async (data, context) => {
    // Check for authentication
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { topic, language, shouldGenerateImage, selectedPlatforms, brandVoiceProfile } = data;
    try {
        const properties = {
            mainArticle: {
                type: genai_1.Type.OBJECT,
                properties: {
                    title: { type: genai_1.Type.STRING, description: "A compelling headline for the main article." },
                    body: { type: genai_1.Type.STRING, description: "The full text of the article, formatted in Markdown." },
                },
                required: ["title", "body"],
            },
        };
        if (shouldGenerateImage) {
            properties.imagePrompt = {
                type: genai_1.Type.STRING,
                description: "A detailed, visually descriptive prompt for an image generation AI, based on the article's content.",
            };
        }
        const required = ["mainArticle"];
        if (shouldGenerateImage) {
            required.push("imagePrompt");
        }
        for (const platform of selectedPlatforms) {
            if (allPlatformProperties[platform]) {
                properties[platform] = allPlatformProperties[platform];
                required.push(platform);
            }
        }
        const dynamicContentGenerationSchema = {
            type: genai_1.Type.OBJECT,
            properties,
            required,
        };
        let brandVoiceInstruction = "";
        if (brandVoiceProfile) {
            brandVoiceInstruction = `
        **CRITICAL: ADHERE TO THE BRAND VOICE PROFILE**
        - **Tone & Manner:** ${brandVoiceProfile.toneAndManner}
        - **Vocabulary Level:** ${brandVoiceProfile.vocabularyLevel}
        - **Sentence Structure:** ${brandVoiceProfile.sentenceStructure}
        - **Rules to Follow (Do's):**
          ${brandVoiceProfile.dos.map((rule) => `- ${rule}`).join("\n")}
        - **Things to Avoid (Don'ts):**
          ${brandVoiceProfile.donts.map((rule) => `- ${rule}`).join("\n")}
        `;
        }
        const systemInstruction = `You are a world-class content strategist...
    ${brandVoiceInstruction}
    ...All generated content MUST be in this language: ${language}.
    ...Return all of this information in a single, structured JSON object.`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `Generate a full content package for the topic: "${topic}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: dynamicContentGenerationSchema,
                temperature: 0.8,
            },
        });
        const textContent = JSON.parse(response.text?.trim() || "{}");
        let imageUrl = "";
        let imagePrompt = "Image generation was disabled.";
        if (shouldGenerateImage && textContent.imagePrompt) {
            imagePrompt = textContent.imagePrompt;
            imageUrl = await generateImage(imagePrompt);
        }
        const result = {
            mainArticle: textContent.mainArticle,
            image: {
                url: imageUrl,
                prompt: imagePrompt,
            },
        };
        for (const platform of selectedPlatforms) {
            if (textContent[platform]) {
                result[platform] = textContent[platform];
            }
        }
        return result;
    }
    catch (error) {
        functions.logger.error("Error in generateContent function:", error);
        throw new functions.https.HttpsError("internal", "Failed to generate content.", error);
    }
});
/**
 * Regenerates content for a specific platform based on user feedback.
 */
exports.regeneratePlatform = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { platform, topic, currentContent, userPrompt, language } = data;
    try {
        const systemInstruction = `You are an expert content editor...`;
        const prompt = `Here is the current content: \`\`\`json\n${JSON.stringify(currentContent, null, 2)}\n\`\`\`\nHere is the user's request for changes: "${userPrompt}"\n\nPlease provide the rewritten content in the required JSON format.`;
        let responseSchema;
        switch (platform) {
            case "facebook":
            case "linkedin":
            case "x":
                responseSchema = { type: genai_1.Type.OBJECT, properties: { postText: { type: genai_1.Type.STRING } }, required: ["postText"] };
                break;
            // ... (add other cases for tiktok, youtube, web)
            default:
                throw new functions.https.HttpsError("invalid-argument", `Unsupported platform for regeneration: ${platform}`);
        }
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
            },
        });
        return JSON.parse(response.text?.trim() || "{}");
    }
    catch (error) {
        functions.logger.error(`Error regenerating content for ${platform}:`, error);
        throw new functions.https.HttpsError("internal", "Failed to regenerate content.", error);
    }
});
/**
 * Analyzes text samples to create a brand voice profile.
 */
exports.analyzeBrandVoice = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { samples } = data;
    try {
        const schema = {
            type: genai_1.Type.OBJECT,
            properties: {
                toneAndManner: { type: genai_1.Type.STRING, description: "A concise description of the overall tone and manner." },
                vocabularyLevel: { type: genai_1.Type.STRING, description: "The level of vocabulary used." },
                sentenceStructure: { type: genai_1.Type.STRING, description: "Describe the typical sentence structure." },
                dos: {
                    type: genai_1.Type.ARRAY,
                    items: { type: genai_1.Type.STRING },
                    description: "A list of 3-5 specific, actionable rules to follow.",
                },
                donts: {
                    type: genai_1.Type.ARRAY,
                    items: { type: genai_1.Type.STRING },
                    description: "A list of 3-5 things to avoid.",
                },
            },
            required: ["toneAndManner", "vocabularyLevel", "sentenceStructure", "dos", "donts"],
        };
        const systemInstruction = "You are an expert brand strategist and linguistic analyst...";
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `Analyze the following text samples and generate a style profile:\n\n---\n\n${samples}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        return JSON.parse(response.text?.trim() || "{}");
    }
    catch (error) {
        functions.logger.error("Error analyzing brand voice:", error);
        throw new functions.https.HttpsError("internal", "Failed to analyze brand voice.", error);
    }
});
//# sourceMappingURL=index.js.map