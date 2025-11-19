import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as dataController from '../controllers/dataController.js';
import * as contentController from '../controllers/contentController.js';

const router = Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   - name: Projects
 *     description: Manage user projects
 *   - name: Campaigns
 *     description: Manage marketing campaigns
 *   - name: Topics
 *     description: Manage content topics
 *   - name: Content
 *     description: Generate and retrieve AI content
 *   - name: Calendar
 *     description: Manage content calendar and events
 */

// --- Project Management ---

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get all projects for the authenticated user
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: List of projects
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project created
 */
router.get('/projects', dataController.getProjects);
router.post('/projects', dataController.createProject);

/**
 * @swagger
 * /campaigns:
 *   get:
 *     summary: Get campaigns, optionally filtered by project
 *     tags: [Campaigns]
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by Project ID
 *     responses:
 *       200:
 *         description: List of campaigns
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaigns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - projectId
 *             properties:
 *               name:
 *                 type: string
 *               goal:
 *                 type: string
 *               projectId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Campaign created
 */
router.get('/campaigns', dataController.getCampaigns);
router.post('/campaigns', dataController.createCampaign);

/**
 * @swagger
 * /topics:
 *   get:
 *     summary: Get topics, optionally filtered by campaign
 *     tags: [Topics]
 *     parameters:
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: string
 *         description: Filter by Campaign ID
 *     responses:
 *       200:
 *         description: List of topics
 *   post:
 *     summary: Create a new topic
 *     tags: [Topics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - campaignId
 *               - projectId
 *             properties:
 *               name:
 *                 type: string
 *               campaignId:
 *                 type: string
 *               projectId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Topic created
 */
router.get('/topics', dataController.getTopics);
router.post('/topics', dataController.createTopic);

// --- Content Generation ---

/**
 * @swagger
 * /generate-content:
 *   post:
 *     summary: Generate AI content using Gemini
 *     tags: [Content]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *               language:
 *                 type: string
 *               shouldGenerateImage:
 *                 type: boolean
 *               selectedPlatforms:
 *                 type: array
 *                 items:
 *                   type: string
 *               context:
 *                 type: object
 *     responses:
 *       200:
 *         description: Content generated successfully
 */
router.post('/generate-content', contentController.generateContent);

/**
 * @swagger
 * /content:
 *   get:
 *     summary: Get user's generated content history
 *     tags: [Content]
 *     responses:
 *       200:
 *         description: History of generated content
 */
router.get('/content', contentController.getUserContent);

/**
 * @swagger
 * /content/analyze:
 *   post:
 *     summary: Regenerate content performance analysis
 *     tags: [Content]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contentId:
 *                 type: string
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Analysis result
 */
router.post('/content/analyze', contentController.regenerateAnalysis);

// --- Calendar ---

/**
 * @swagger
 * /calendar/events:
 *   get:
 *     summary: Get calendar events within a date range
 *     tags: [Calendar]
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *     responses:
 *       200:
 *         description: List of calendar events
 */
router.get('/calendar/events', dataController.getCalendarEvents);

/**
 * @swagger
 * /calendar/suggestions:
 *   post:
 *     summary: Generate and save calendar suggestions
 *     tags: [Calendar]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentDate:
 *                 type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   mainTopics:
 *                     type: string
 *                   targetAudience:
 *                     type: string
 *     responses:
 *       200:
 *         description: Suggestions generated and saved
 */
router.post('/calendar/suggestions', dataController.generateAndSaveSuggestions);

export default router;
