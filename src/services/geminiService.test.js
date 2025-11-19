import { generateContentFlow, analyzePerformance, generateCalendarSuggestions } from './geminiService.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// This is the mock for the innermost function, which we need to control and inspect.
const mockGenerateContent = jest.fn();

// The mock factory is hoisted. All mocks must be self-contained or reference vars from a higher scope.
jest.mock('@google/generative-ai', () => {
    // We create the mock for getGenerativeModel inside the factory to avoid hoisting issues.
    const mockGetGenerativeModel = jest.fn(() => ({
        generateContent: mockGenerateContent,
    }));

    return {
        GoogleGenerativeAI: jest.fn(() => ({
            getGenerativeModel: mockGetGenerativeModel,
        })),
        HarmCategory: {
            HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
            HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
            HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        },
        HarmBlockThreshold: {
            BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        SchemaType: {
            OBJECT: 'OBJECT',
            STRING: 'STRING',
            ARRAY: 'ARRAY',
            NUMBER: 'NUMBER'
        }
    };
});

// After the mock is established, we can get a handle to the inner mock function
// to make assertions on it.
const mockGetGenerativeModel = new GoogleGenerativeAI().getGenerativeModel;

describe('geminiService', () => {

    beforeEach(() => {
        // Clear mock history before each test
        mockGenerateContent.mockClear();
        mockGetGenerativeModel.mockClear();
        GoogleGenerativeAI.mockClear();
    });

    describe('generateContentFlow', () => {
        it('should generate content without images', async () => {
            const mockResponse = {
                mainArticle: { title: 'Test Title', body: 'Test Body' },
                web: { metaTitle: 'Web Title', metaDescription: 'Web Desc', body: 'Web Body' }
            };
            mockGenerateContent.mockResolvedValue({
                response: { text: () => JSON.stringify(mockResponse) }
            });

            const result = await generateContentFlow('Test Topic', 'English', false, ['web']);

            expect(mockGetGenerativeModel).toHaveBeenCalledWith(expect.objectContaining({
                model: "gemini-1.5-flash",
            }));
            expect(result.mainArticle.title).toBe('Test Title');
            expect(result.web.metaTitle).toBe('Web Title');
            expect(result.images.length).toBe(0);
        });

        it('should generate content with image prompts', async () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            const mockResponse = {
                mainArticle: { title: 'Image Title', body: 'Image Body' },
                imagePrompts: ['a cat sitting on a mat', 'a dog playing fetch']
            };
            mockGenerateContent.mockResolvedValue({
                response: { text: () => JSON.stringify(mockResponse) }
            });

            const result = await generateContentFlow('Images', 'English', true, []);
            
            expect(result.mainArticle.title).toBe('Image Title');
            expect(result.images.length).toBe(2);
            expect(result.images[0].prompt).toBe('a cat sitting on a mat');
            expect(result.images[0].url).toContain('cat%20sitting');
            expect(result.images[1].prompt).toBe('a dog playing fetch');
            
            consoleLogSpy.mockRestore();
        });
         it('should throw an error if Gemini API fails', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            mockGenerateContent.mockRejectedValue(new Error('API Error'));

            await expect(generateContentFlow('Test Topic', 'English', false, ['web'])).rejects.toThrow('Gemini generation failed');
            
            consoleErrorSpy.mockRestore();
        });
    });

    describe('analyzePerformance', () => {
        it('should call Gemini with the correct content for web analysis', async () => {
            const mockContent = {
                web: { metaTitle: 'SEO Title', body: 'This is the body for SEO.' }
            };
             mockGenerateContent.mockResolvedValue({
                response: { text: () => JSON.stringify({ web: { score: 90 } }) }
            });

            const result = await analyzePerformance(mockContent, ['web']);

            expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('--- WEB CONTENT ---\nTitle: SEO Title\nBody: This is the body for SEO.'));
            expect(result.web.score).toBe(90);
        });

        it('should return an empty object if no matching content is found', async () => {
            const result = await analyzePerformance({ web: null }, ['web']);
            expect(result).toEqual({});
            expect(mockGenerateContent).not.toHaveBeenCalled();
        });
    });

    describe('generateCalendarSuggestions', () => {
        it('should generate suggestions based on settings', async () => {
            const mockSuggestions = [{ title: 'New Suggestion', date: '2025-01-01' }];
            mockGenerateContent.mockResolvedValue({
                response: { text: () => JSON.stringify({ suggestions: mockSuggestions }) }
            });

            const settings = {
                mainTopics: 'AI in Tech',
                targetAudience: 'Developers'
            };

            const result = await generateCalendarSuggestions(settings, '2024-12-25');

            expect(mockGetGenerativeModel).toHaveBeenCalledWith(expect.objectContaining({
                systemInstruction: expect.stringContaining('Generate 5 strategic content ideas (JSON) for AI in Tech')
            }));
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('Target Audience: Developers'));
            expect(result).toEqual(mockSuggestions);
        });
    });
});
