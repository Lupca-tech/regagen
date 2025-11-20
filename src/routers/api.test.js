import request from 'supertest';
import express from 'express';
import apiRoutes from './api';
import * as dataController from '../controllers/dataController';
import * as contentController from '../controllers/contentController';
import { verifyToken } from '../middleware/auth';

// Mock middleware and controllers
jest.mock('../middleware/auth');

jest.mock('../controllers/dataController', () => ({
  getProjects: jest.fn((req, res) => res.status(200).json([])),
  createProject: jest.fn((req, res) => res.status(201).json({ id: 'new-project' })),
  getCampaigns: jest.fn((req, res) => res.status(200).json([])),
  createCampaign: jest.fn((req, res) => res.status(201).json({ id: 'new-campaign' })),
  getTopics: jest.fn((req, res) => res.status(200).json([])),
  createTopic: jest.fn((req, res) => res.status(201).json({ id: 'new-topic' })),
  getCalendarEvents: jest.fn((req, res) => res.status(200).json([])),
  generateAndSaveSuggestions: jest.fn((req, res) => res.status(201).json([])),
}));

jest.mock('../controllers/contentController', () => ({
  generateContent: jest.fn((req, res) => res.status(201).json({ contentId: 'new-content' })),
  getUserContent: jest.fn((req, res) => res.status(200).json([])),
  regenerateAnalysis: jest.fn((req, res) => res.status(200).json({})),
}));


const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('API Routes', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      verifyToken.mockImplementation((req, res, next) => {
        req.user = { uid: 'test-user' };
        next();
      });
    });

    describe('Project Routes', () => {
      test('GET /api/projects should call dataController.getProjects', async () => {
        await request(app).get('/api/projects');
        expect(dataController.getProjects).toHaveBeenCalledTimes(1);
      });

      test('POST /api/projects should call dataController.createProject', async () => {
        const projectData = { name: 'New Project', description: 'A test project' };
        await request(app)
          .post('/api/projects')
          .send(projectData);
        expect(dataController.createProject).toHaveBeenCalledTimes(1);
      });
    });

    describe('Campaign Routes', () => {
      test('GET /api/campaigns should call dataController.getCampaigns', async () => {
        await request(app).get('/api/campaigns');
        expect(dataController.getCampaigns).toHaveBeenCalledTimes(1);
      });

      test('POST /api/campaigns should call dataController.createCampaign', async () => {
        const campaignData = { name: 'New Campaign', projectId: '1' };
        await request(app).post('/api/campaigns').send(campaignData);
        expect(dataController.createCampaign).toHaveBeenCalledTimes(1);
      });
    });

    describe('Topic Routes', () => {
      test('GET /api/topics should call dataController.getTopics', async () => {
        await request(app).get('/api/topics');
        expect(dataController.getTopics).toHaveBeenCalledTimes(1);
      });

      test('POST /api/topics should call dataController.createTopic', async () => {
        const topicData = { name: 'New Topic', campaignId: '1', projectId: '1' };
        await request(app).post('/api/topics').send(topicData);
        expect(dataController.createTopic).toHaveBeenCalledTimes(1);
      });
    });

    describe('Content Routes', () => {
      test('POST /api/generate-content should call contentController.generateContent', async () => {
        const contentData = {
          topic: 'Test Topic',
          language: 'English',
          selectedPlatforms: ['web'],
        };
        await request(app).post('/api/generate-content').send(contentData);
        expect(contentController.generateContent).toHaveBeenCalledTimes(1);
      });

      test('GET /api/content should call contentController.getUserContent', async () => {
        await request(app).get('/api/content');
        expect(contentController.getUserContent).toHaveBeenCalledTimes(1);
      });

      test('POST /api/content/analyze should call contentController.regenerateAnalysis', async () => {
          const analysisData = { contentId: '1', platforms: ['web'] };
        await request(app).post('/api/content/analyze').send(analysisData);
        expect(contentController.regenerateAnalysis).toHaveBeenCalledTimes(1);
      });
    });

    describe('Calendar Routes', () => {
      test('GET /api/calendar/events should call dataController.getCalendarEvents', async () => {
          await request(app).get('/api/calendar/events?start=2024-01-01&end=2024-01-31');
          expect(dataController.getCalendarEvents).toHaveBeenCalledTimes(1);
      });

      test('POST /api/calendar/suggestions should call dataController.generateAndSaveSuggestions', async () => {
          const suggestionData = {
              currentDate: '2024-07-20',
              settings: {
                mainTopics: 'AI in software development',
                targetAudience: 'Early-stage startup founders',
              },
            };
          await request(app).post('/api/calendar/suggestions').send(suggestionData);
          expect(dataController.generateAndSaveSuggestions).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('when unauthenticated (as guest)', () => {
    beforeEach(() => {
      verifyToken.mockImplementation((req, res, next) => {
        // This simulates the middleware assigning a guest user
        req.user = { uid: 'public_guest_user' };
        next();
      });
    });

    test('GET /api/projects should still be accessible for guest users', async () => {
      await request(app).get('/api/projects');
      expect(dataController.getProjects).toHaveBeenCalledTimes(1);
    });

    test('POST /api/projects should still be accessible for guest users', async () => {
      const projectData = { name: 'Guest Project' };
      await request(app).post('/api/projects').send(projectData);
      expect(dataController.createProject).toHaveBeenCalledTimes(1);
    });
  });
});
