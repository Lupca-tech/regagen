import { generateContent, getUserContent, regenerateAnalysis, __get__ } from './contentController.js'; // Import __get__ directly
import * as geminiService from '../services/geminiService.js';

// Mock dependencies
jest.mock('../services/geminiService.js');
jest.mock('../config/firebase.js', () => ({
    isFirebaseEnabled: false, // Force in-memory store for tests
    db: {}, // Mock db object
    storage: {}, // Mock storage object
}));

// Mock express req/res objects
const mockRequest = (body = {}, user = { uid: 'test-user', displayName: 'Test User' }, query = {}) => ({
    body,
    user,
    query,
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('contentController (in-memory)', () => {

    let inMemoryStore;

    beforeEach(() => {
        jest.clearAllMocks();
        // Access and clear the actual in-memory store before each test
        inMemoryStore = __get__('inMemoryStore'); // Get inMemoryStore via __get__
        for (const userId in inMemoryStore) {
            delete inMemoryStore[userId];
        }
    });

    describe('generateContent', () => {
        it('should generate content and return contentId', async () => {
            const req = mockRequest({
                topic: 'Test Topic',
                language: 'English',
                shouldGenerateImage: false,
                selectedPlatforms: ['web'],
                context: { projectId: 'p1', campaignId: 'c1', topicId: 't1' }
            });
            const res = mockResponse();

            const mockGeneratedContent = {
                mainArticle: { title: 'Generated Title', body: 'Generated Body' },
                images: [],
                web: { metaTitle: 'Web Title' },
                // Include all expected properties that contentController saves
                analysis: null,
                facebook: null, linkedin: null, x: null, tiktok: null, youtube: null
            };
            geminiService.generateContentFlow.mockResolvedValue(mockGeneratedContent);

            await generateContent(req, res);

            expect(geminiService.generateContentFlow).toHaveBeenCalledWith(
                'Test Topic',
                'English',
                false,
                ['web'],
                expect.objectContaining({ user: req.user, projectId: 'p1' })
            );
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                contentId: expect.any(String),
                content: mockGeneratedContent,
            }));

            // Verify content is stored in-memory
            const userId = req.user.uid;
            expect(inMemoryStore[userId]).toBeInstanceOf(Array);
            expect(inMemoryStore[userId].length).toBe(1);
            expect(inMemoryStore[userId][0].topic).toBe('Test Topic');
            expect(inMemoryStore[userId][0].id).toBe(res.json.mock.calls[0][0].contentId);
        });

        it('should handle errors during generation', async () => {
            // Suppress console.error for this specific test to keep output clean
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const req = mockRequest({ topic: 'Fail Topic' });
            const res = mockResponse();

            geminiService.generateContentFlow.mockRejectedValue(new Error('Generation failed'));

            await generateContent(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to generate or save content' });
            
            // Restore original console.error function
            consoleErrorSpy.mockRestore();
        });

        it('should handle image generation and upload placeholder URLs', async () => {
            const req = mockRequest({
                topic: 'Image Topic',
                language: 'English',
                shouldGenerateImage: true,
                selectedPlatforms: [],
            });
            const res = mockResponse();

            const mockGeneratedContent = {
                mainArticle: { title: 'Image Article', body: 'Image body' },
                // The mock should return a populated `images` array, as the real service would.
                images: [
                    { url: 'https://via.placeholder.com/placeholder?text=prompt1', prompt: 'prompt1' },
                    { url: 'https://via.placeholder.com/placeholder?text=prompt2', prompt: 'prompt2' }
                ],
            };
            geminiService.generateContentFlow.mockResolvedValue(mockGeneratedContent);

            await generateContent(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                content: expect.objectContaining({
                    images: [
                        { url: expect.stringContaining('prompt1'), prompt: 'prompt1' },
                        { url: expect.stringContaining('prompt2'), prompt: 'prompt2' },
                    ]
                })
            }));
            const userId = req.user.uid;
            expect(inMemoryStore[userId][0].images.length).toBe(2);
        });
    });

    describe('getUserContent', () => {
        it('should return user content from in-memory store', async () => {
            const req = mockRequest();
            const res = mockResponse();

            // First, generate some content to populate the store
            const generationReq = mockRequest({ topic: 'History Topic', language: 'en', selectedPlatforms: [] });
            geminiService.generateContentFlow.mockResolvedValue({ mainArticle: {}, images: [] });
            await generateContent(generationReq, mockResponse());

            // Now, get the content
            await getUserContent(req, res);

            const responseData = res.json.mock.calls[0][0];
            expect(responseData).toBeInstanceOf(Array);
            expect(responseData.length).toBe(1);
            expect(responseData[0].topic).toBe('History Topic');
            expect(responseData[0].userId).toBe(req.user.uid);
        });

        it('should return empty array if no content exists for user', async () => {
            const req = mockRequest();
            const res = mockResponse();

            await getUserContent(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });
    });

    describe('regenerateAnalysis', () => {
         it('should call analyzePerformance and return the analysis', async () => {
            // Pre-populate content
            const generationReq = mockRequest({ topic: 'Analysis Topic', language: 'en', selectedPlatforms: ['web'] });
            const generationRes = mockResponse();
            geminiService.generateContentFlow.mockResolvedValue({ mainArticle: {}, images: [], web: { metaTitle: 'Web Content', body: '...' } });
            await generateContent(generationReq, generationRes);
            const generatedContentId = generationRes.json.mock.calls[0][0].contentId;

            // Test regenerateAnalysis
            const req = mockRequest({ contentId: generatedContentId, platforms: ['web'] });
            const res = mockResponse();
            const mockAnalysis = { web: { score: 95 } };
            geminiService.analyzePerformance.mockResolvedValue(mockAnalysis);

            await regenerateAnalysis(req, res);

            expect(geminiService.analyzePerformance).toHaveBeenCalledWith(expect.objectContaining({ id: generatedContentId }), ['web']);
            expect(res.json).toHaveBeenCalledWith(mockAnalysis);

            // Verify analysis is updated in-memory
            const userId = req.user.uid;
            expect(inMemoryStore[userId][0].analysis).toEqual(mockAnalysis);
        });

        it('should return 404 if content is not found', async () => {
            const req = mockRequest({ contentId: 'non-existent-id', platforms: ['web'] });
            const res = mockResponse();

            await regenerateAnalysis(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Content not found' });
        });

        it('should handle errors during analysis', async () => {
            // Pre-populate content
            const generationReq = mockRequest({ topic: 'Analysis Topic', language: 'en', selectedPlatforms: ['web'] });
            const generationRes = mockResponse();
            geminiService.generateContentFlow.mockResolvedValue({ mainArticle: {}, images: [], web: { metaTitle: 'Web Content', body: '...' } });
            await generateContent(generationReq, generationRes);
            const generatedContentId = generationRes.json.mock.calls[0][0].contentId;

            const req = mockRequest({ contentId: generatedContentId, platforms: ['web'] });
            const res = mockResponse();
            geminiService.analyzePerformance.mockRejectedValue(new Error('Analysis service error'));

            await regenerateAnalysis(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Analysis failed' });
        });
    });
});
