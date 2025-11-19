import {
    Content,
    GoogleGenerativeAI,
    HarmBlockThreshold,
    HarmCategory,
    Schema,
    SchemaType,
    Tool,
} from '@google/generative-ai';
import { GeneratedContent, PerformanceAnalysis, EditablePlatform, FullGenerationContext, CalendarSettings } from '../types.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const imageGenerationTool: Tool = {
    functionDeclarations: [
        {
            name: 'generate_image',
            description: 'Generates an image from a text prompt.',
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    prompt: { type: SchemaType.STRING, description: 'The text prompt to generate the image from.' },
                },
                required: ['prompt'],
            },
        },
    ],
};

const allPlatformProperties: { [key in EditablePlatform]?: Schema } = {
    web: { type: SchemaType.OBJECT, properties: { metaTitle: { type: SchemaType.STRING }, metaDescription: { type: SchemaType.STRING }, body: { type: SchemaType.STRING } }, required: ["metaTitle", "metaDescription", "body"] },
    facebook: { type: SchemaType.OBJECT, properties: { post: { type: SchemaType.STRING } }, required: ["post"] },
    x: { type: SchemaType.OBJECT, properties: { tweet: { type: SchemaType.STRING } }, required: ["tweet"] },
    linkedin: { type: SchemaType.OBJECT, properties: { post: { type: SchemaType.STRING } }, required: ["post"] },
    tiktok: { type: SchemaType.OBJECT, properties: { script: { type: SchemaType.STRING }, description: { type: SchemaType.STRING } }, required: ["script", "description"] },
    youtube: { type: SchemaType.OBJECT, properties: { title: { type: SchemaType.STRING }, description: { type: SchemaType.STRING }, script: { type: SchemaType.STRING } }, required: ["title", "description", "script"] },
};

// Placeholder for actual image generation API call
const generateImage = async (prompt: string): Promise<string> => {
    // In a real implementation, this would call an image generation service.
    // This is a placeholder that returns a dummy URL.
    console.log(`(Placeholder) Generating image for prompt: "${prompt}"`);
    return `https://via.placeholder.com/1024x768.png?text=${encodeURIComponent(prompt)}`;
};

const dynamicContentGenerationSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        mainArticle: {
            type: SchemaType.OBJECT,
            properties: {
                title: { type: SchemaType.STRING },
                body: { type: SchemaType.STRING },
            },
            required: ["title", "body"],
        },
    },
    required: ['mainArticle'],
};

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
    
    const dynamicContentGenerationSchema: Schema = {
      type: SchemaType.OBJECT,
      properties,
      required,
    };

    let ragContext = '';
    if (generationContext) {
        ragContext = `User: "${generationContext.user?.displayName}". Brand Context: ${generationContext.brandVoiceProfile?.name || 'None'}.`;
    }

    const systemInstruction = `You are a world-class content strategist. Topic: "${topic}". Language: ${language}. ${ragContext}. Return JSON only.`;
    
    const parts = [{ text: `Generate content for topic: ${topic}` }];

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: dynamicContentGenerationSchema,
        }
    });

    const result = await model.generateContent({
        contents: [{ role: "user", parts: parts }],
        safetySettings,
        tools: shouldGenerateImage ? [imageGenerationTool] : [],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: dynamicContentGenerationSchema,
        },
    });

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

        resultContent.images = imageUrls.map((url: string, index: number) => ({
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
