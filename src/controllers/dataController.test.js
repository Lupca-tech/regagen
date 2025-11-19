import {
    createProject,
    getProjects,
    createCampaign,
    getCampaigns,
    createTopic,
    getTopics,
    generateAndSaveSuggestions,
    getCalendarEvents,
    __get__ // Import the exposed __get__ for testing
} from './dataController.js';
import * as geminiService from '../services/geminiService.js';

// Mock dependencies
jest.mock('../services/geminiService.js');
jest.mock('../config/firebase.js', () => ({
    isFirebaseEnabled: false, // Force in-memory store for tests
    db: {}, // Mock db object
    storage: {}, // Mock storage object
}));

// Mock express req/res objects
const mockRequest = (body = {}, query = {}, user = { uid: 'test-user', displayName: 'Test User' }) => ({
    body,
    query,
    user,
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('dataController (in-memory)', () => {

    let inMemoryData;

    beforeEach(() => {
        jest.clearAllMocks();
        // Access and reset the actual in-memory store before each test
        inMemoryData = __get__('inMemoryData'); // Get inMemoryData via __get__
        for (const key in inMemoryData) {
            inMemoryData[key] = {}; // Reset each collection for the user
        }
    });

    describe('Projects', () => {
        it('should create a project and then retrieve it', async () => {
            const createReq = mockRequest({ name: 'Test Project', description: 'A project for testing' });
            const createRes = mockResponse();
            await createProject(createReq, createRes);
            expect(createRes.json).toHaveBeenCalledWith({ id: expect.stringContaining('proj_') });

            const getReq = mockRequest();
            const getRes = mockResponse();
            await getProjects(getReq, getRes);
            
            const responseData = getRes.json.mock.calls[0][0];
            expect(responseData).toBeInstanceOf(Array);
            expect(responseData.length).toBe(1);
            expect(responseData[0].name).toBe('Test Project');
            expect(responseData[0].userId).toBe(createReq.user.uid);
        });

        it('should return empty array if no projects exist', async () => {
            const getReq = mockRequest();
            const getRes = mockResponse();
            await getProjects(getReq, getRes);
            expect(getRes.json).toHaveBeenCalledWith([]);
        });
    });

    describe('Campaigns', () => {
       it('should create a campaign and then retrieve it', async () => {
            // First, create a project to link the campaign to
            const createProjectReq = mockRequest({ name: 'Campaign Project' });
            const createProjectRes = mockResponse();
            await createProject(createProjectReq, createProjectRes);
            const projectId = createProjectRes.json.mock.calls[0][0].id;

            const createCampaignReq = mockRequest({ name: 'Test Campaign', projectId });
            const createCampaignRes = mockResponse();
            await createCampaign(createCampaignReq, createCampaignRes);
            expect(createCampaignRes.json).toHaveBeenCalledWith({ id: expect.stringContaining('camp_') });

            const getCampaignsReq = mockRequest({}, { projectId });
            const getCampaignsRes = mockResponse();
            await getCampaigns(getCampaignsReq, getCampaignsRes);
            
            const responseData = getCampaignsRes.json.mock.calls[0][0];
            expect(responseData).toBeInstanceOf(Array);
            expect(responseData.length).toBe(1);
            expect(responseData[0].name).toBe('Test Campaign');
            expect(responseData[0].projectId).toBe(projectId);
        });

        it('should filter campaigns by projectId', async () => {
            // Create two projects
            const p1Req = mockRequest({ name: 'Project 1' });
            const p1Res = mockResponse();
            await createProject(p1Req, p1Res);
            const projectId1 = p1Res.json.mock.calls[0][0].id;

            const p2Req = mockRequest({ name: 'Project 2' });
            const p2Res = mockResponse();
            await createProject(p2Req, p2Res);
            const projectId2 = p2Res.json.mock.calls[0][0].id;

            // Create campaigns for both projects
            await createCampaign(mockRequest({ name: 'Camp A', projectId: projectId1 }), mockResponse());
            await createCampaign(mockRequest({ name: 'Camp B', projectId: projectId2 }), mockResponse());
            await createCampaign(mockRequest({ name: 'Camp C', projectId: projectId1 }), mockResponse());

            const getCampaignsReq = mockRequest({}, { projectId: projectId1 });
            const getCampaignsRes = mockResponse();
            await getCampaigns(getCampaignsReq, getCampaignsRes);

            const responseData = getCampaignsRes.json.mock.calls[0][0];
            expect(responseData.length).toBe(2);
            expect(responseData.every(c => c.projectId === projectId1)).toBe(true);
        });
    });
    
     describe('Topics', () => {
        it('should create a topic and then retrieve it', async () => {
            // Create project and campaign
            const pReq = mockRequest({ name: 'Topic Project' });
            const pRes = mockResponse();
            await createProject(pReq, pRes);
            const projectId = pRes.json.mock.calls[0][0].id;

            const cReq = mockRequest({ name: 'Topic Campaign', projectId });
            const cRes = mockResponse();
            await createCampaign(cReq, cRes);
            const campaignId = cRes.json.mock.calls[0][0].id;

            const createTopicReq = mockRequest({ name: 'Test Topic', campaignId, projectId });
            const createTopicRes = mockResponse();
            await createTopic(createTopicReq, createTopicRes);
            expect(createTopicRes.json).toHaveBeenCalledWith({ id: expect.stringContaining('topic_') });
            
            const getTopicsReq = mockRequest({}, { campaignId });
            const getTopicsRes = mockResponse();
            await getTopics(getTopicsReq, getTopicsRes);
            
            const responseData = getTopicsRes.json.mock.calls[0][0];
            expect(responseData).toBeInstanceOf(Array);
            expect(responseData.length).toBe(1);
            expect(responseData[0].name).toBe('Test Topic');
            expect(responseData[0].status).toBe('Draft');
        });
    });

    describe('Calendar', () => {
        it('should generate suggestions and then retrieve them as events', async () => {
            const genReq = mockRequest({
                currentDate: '2024-01-01',
                settings: { mainTopics: 'Testing', targetAudience: 'Testers' }
            });
            const genRes = mockResponse();
            const mockSuggestions = [{ title: 'Suggestion 1', date: '2024-01-15', status: 'suggested_event', type: 'event' }];
            geminiService.generateCalendarSuggestions.mockResolvedValue(mockSuggestions);
            await generateAndSaveSuggestions(genReq, genRes);
            expect(geminiService.generateCalendarSuggestions).toHaveBeenCalledWith(genReq.body.settings, genReq.body.currentDate);
            expect(genRes.json).toHaveBeenCalledWith(mockSuggestions);

            const getReq = mockRequest({}, { start: '2024-01-01', end: '2024-01-31' });
            const getRes = mockResponse();
            await getCalendarEvents(getReq, getRes);
            
            const responseData = getRes.json.mock.calls[0][0];
            expect(responseData).toBeInstanceOf(Array);
            expect(responseData.length).toBe(1);
            expect(responseData[0].title).toBe('Suggestion 1');
            expect(responseData[0].userId).toBe(genReq.user.uid);
        });

        it('should return empty array if no calendar events match date range', async () => {
            const genReq = mockRequest({
                currentDate: '2024-01-01',
                settings: { mainTopics: 'Testing', targetAudience: 'Testers' }
            });
            const genRes = mockResponse();
            const mockSuggestions = [{ title: 'Suggestion 1', date: '2024-01-15', status: 'suggested_event', type: 'event' }];
            geminiService.generateCalendarSuggestions.mockResolvedValue(mockSuggestions);
            await generateAndSaveSuggestions(genReq, genRes);

            // Request for a different month
            const getReq = mockRequest({}, { start: '2024-02-01', end: '2024-02-29' });
            const getRes = mockResponse();
            await getCalendarEvents(getReq, getRes);
            
            expect(getRes.json).toHaveBeenCalledWith([]);
        });

        it('should handle errors during calendar event retrieval', async () => {
            const getReq = mockRequest({}, { start: '2024-01-01', end: '2024-01-31' });
            const getRes = mockResponse();
            // Simulate an error by providing corrupt data (an array with null) that will cause `e.date` to fail.
            inMemoryData.calendarEvents[getReq.user.uid] = [null];
            
            await getCalendarEvents(getReq, getRes);

            expect(getRes.status).toHaveBeenCalledWith(500);
            expect(getRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch calendar events' });
        });
    });
});
