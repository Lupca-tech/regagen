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
 *     description: Manage marketing campaigns associated with projects
 *   - name: Topics
 *     description: Manage content topics for campaigns
 *   - name: Content
 *     description: Generate and retrieve AI-powered content
 *   - name: Calendar
 *     description: Manage content calendar events and generate suggestions
 */

// --- Project Management ---

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get all projects for the authenticated user
 *     description: Retrieves a list of all projects associated with the authenticated user. Projects are sorted by creation date in descending order.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of projects.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *             examples:
 *               success:
 *                 value:
 *                   - id: "proj_1678886400000_abcdef"
 *                     name: "Q2 Marketing Launch"
 *                     description: "Campaigns for the new product launch in Q2."
 *                     userId: "public_guest_user"
 *                     createdAt: { "_seconds": 1678886400, "_nanoseconds": 0 }
 *       '401':
 *         description: Unauthorized if a valid token is provided but invalid. Falls back to guest user if no token or invalid token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new project
 *     description: Creates a new project with a specified name and an optional description. The new project is automatically associated with the authenticated user.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Project details for creation.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name for the new project.
 *                 example: "New Website SEO"
 *               description:
 *                 type: string
 *                 description: An optional description for the project.
 *                 example: "All content and campaigns for the new website launch."
 *     responses:
 *       '200':
 *         description: Project created successfully. Returns the ID of the new project.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The unique identifier of the newly created project.
 *                   example: "proj_1678886400000_abcdef"
 *       '400':
 *         description: Bad request. Missing required 'name' field in the request body.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/projects', dataController.getProjects);
router.post('/projects', dataController.createProject);

/**
 * @swagger
 * /campaigns:
 *   get:
 *     summary: Get campaigns for the authenticated user
 *     description: Retrieves a list of campaigns for the authenticated user. Results can be filtered by a specific `projectId`. Campaigns are sorted by creation date in descending order.
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           description: The ID of the project to filter campaigns by.
 *           example: "proj_1678886400000_abcdef"
 *     responses:
 *       '200':
 *         description: A list of campaigns.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Campaign'
 *             examples:
 *               success:
 *                 value:
 *                   - id: "camp_1678886400000_bcdefg"
 *                     name: "New Product Awareness"
 *                     goal: "Increase sign-ups by 20%"
 *                     projectId: "proj_1678886400000_abcdef"
 *                     userId: "public_guest_user"
 *                     createdAt: { "_seconds": 1678886400, "_nanoseconds": 0 }
 *       '401':
 *         description: Unauthorized.
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new campaign
 *     description: Creates a new campaign within a specified project. The campaign is associated with the authenticated user.
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Campaign details for creation.
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
 *                 description: The name for the new campaign.
 *                 example: "Social Media Push Q2"
 *               goal:
 *                 type: string
 *                 description: The objective or goal of the campaign.
 *                 example: "Drive traffic to new landing page"
 *               projectId:
 *                 type: string
 *                 description: The ID of the project this campaign belongs to.
 *                 example: "proj_1678886400000_abcdef"
 *     responses:
 *       '200':
 *         description: Campaign created successfully. Returns the ID of the new campaign.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The unique identifier of the newly created campaign.
 *                   example: "camp_1678886400000_bcdefg"
 *       '400':
 *         description: Bad request. Missing required fields (name, projectId).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/campaigns', dataController.getCampaigns);
router.post('/campaigns', dataController.createCampaign);

/**
 * @swagger
 * /topics:
 *   get:
 *     summary: Get topics for the authenticated user
 *     description: Retrieves a list of content topics for the authenticated user. Results can be filtered by a specific `campaignId`. Topics are sorted by creation date in descending order.
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: string
 *           description: The ID of the campaign to filter topics by.
 *           example: "camp_1678886400000_bcdefg"
 *     responses:
 *       '200':
 *         description: A list of topics.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Topic'
 *             examples:
 *               success:
 *                 value:
 *                   - id: "topic_1678886400000_cdefgh"
 *                     name: "The Future of AI in Marketing"
 *                     status: "Generated"
 *                     campaignId: "camp_1678886400000_bcdefg"
 *                     projectId: "proj_1678886400000_abcdef"
 *                     userId: "public_guest_user"
 *                     contentId: "gen_1678886400000_defghi"
 *                     createdAt: { "_seconds": 1678886400, "_nanoseconds": 0 }
 *       '401':
 *         description: Unauthorized.
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new topic
 *     description: Creates a new content topic within a specified campaign and project. The topic's initial status is 'Draft'.
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Topic details for creation.
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
 *                 description: The name or subject of the new topic.
 *                 example: "Exploring the new Gemini 1.5 Pro"
 *               campaignId:
 *                 type: string
 *                 description: The ID of the campaign this topic belongs to.
 *                 example: "camp_1678886400000_bcdefg"
 *               projectId:
 *                 type: string
 *                 description: The ID of the project this topic belongs to.
 *                 example: "proj_1678886400000_abcdef"
 *     responses:
 *       '200':
 *         description: Topic created successfully. Returns the ID of the new topic.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The unique identifier of the newly created topic.
 *                   example: "topic_1678886400000_cdefgh"
 *       '400':
 *         description: Bad request. Missing required fields (name, campaignId, projectId).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/topics', dataController.getTopics);
router.post('/topics', dataController.createTopic);

// --- Content Generation ---

/**
 * @swagger
 * /generate-content:
 *   post:
 *     summary: Generate multi-platform AI content
 *     description: This is the core endpoint for content generation. It takes a topic, target language, and a selection of platforms. Using Google's Gemini AI, it generates a comprehensive set of content tailored for each selected platform (e.g., web article, Facebook post, YouTube script). It can optionally generate placeholder images based on prompts. The generated content is then saved and its ID returned.
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Parameters for content generation.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *               - language
 *               - selectedPlatforms
 *             properties:
 *               topic:
 *                 type: string
 *                 description: The main subject or theme for the content generation.
 *                 example: "Benefits of server-side rendering for modern web applications"
 *               language:
 *                 type: string
 *                 description: The target language for the generated content (e.g., "English", "Vietnamese").
 *                 example: "English"
 *               shouldGenerateImage:
 *                 type: boolean
 *                 description: If `true`, the AI will also generate image prompts and placeholder image URLs.
 *                 example: true
 *               selectedPlatforms:
 *                 type: array
 *                 description: A list of platforms for which to generate tailored content.
 *                 items:
 *                   type: string
 *                   enum: [web, facebook, linkedin, x, tiktok, youtube]
 *                 example: ["web", "linkedin", "x"]
 *               context:
 *                 type: object
 *                 description: Optional context to guide the generation or link the content, such as project, campaign, or topic IDs.
 *                 properties:
 *                   projectId:
 *                     type: string
 *                     description: The ID of the project to associate the content with.
 *                     example: "proj_1678886400000_abcdef"
 *                   campaignId:
 *                     type: string
 *                     description: The ID of the campaign to associate the content with.
 *                     example: "camp_1678886400000_bcdefg"
 *                   topicId:
 *                     type: string
 *                     description: The ID of the topic this content is generated for.
 *                     example: "topic_1678886400000_cdefgh"
 *     responses:
 *       '200':
 *         description: Content generated and saved successfully. Returns the content ID and the generated content object.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contentId:
 *                   type: string
 *                   description: The unique identifier of the newly saved content.
 *                   example: "gen_1678886400000_defghi"
 *                 content:
 *                   $ref: '#/components/schemas/GeneratedContent'
 *       '400':
 *         description: Bad request. Missing required fields (topic, language, selectedPlatforms).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Failed to generate or save content due to an internal server or AI error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/generate-content', contentController.generateContent);

/**
 * @swagger
 * /content:
 *   get:
 *     summary: Get user's generated content history
 *     description: Retrieves a list of all previously generated content for the authenticated user, sorted by creation date in descending order.
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of saved content objects.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SavedContent'
 *             examples:
 *               success:
 *                 value:
 *                   - id: "gen_1678886400000_defghi"
 *                     userId: "public_guest_user"
 *                     topic: "Benefits of server-side rendering"
 *                     language: "English"
 *                     projectId: "proj_1678886400000_abcdef"
 *                     campaignId: "camp_1678886400000_bcdefg"
 *                     topicId: "topic_1678886400000_cdefgh"
 *                     createdAt: { "_seconds": 1678886400, "_nanoseconds": 0 }
 *                     mainArticle: { "title": "...", "body": "..." }
 *                     images: [{ "url": "https://via.placeholder.com/...", "prompt": "..." }]
 *                     web: { "metaTitle": "...", "metaDescription": "...", "body": "..." }
 *       '401':
 *         description: Unauthorized.
 *       '500':
 *         description: Failed to fetch content history.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/content', contentController.getUserContent);

/**
 * @swagger
 * /content/analyze:
 *   post:
 *     summary: Regenerate performance analysis for content
 *     description: Takes an existing `contentId` and runs a new performance analysis on its generated content for specified platforms. The updated analysis result is saved back to the content object and returned. This is useful for re-evaluating content against current metrics or new analysis criteria.
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Content ID and platforms for analysis.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentId
 *               - platforms
 *             properties:
 *               contentId:
 *                 type: string
 *                 description: The unique identifier of the content to analyze.
 *                 example: "gen_1678886400000_defghi"
 *               platforms:
 *                 type: array
 *                 description: A list of platforms for which to perform the analysis. Currently supports 'web', 'tiktok', 'facebook'.
 *                 items:
 *                   type: string
 *                   enum: [web, tiktok, facebook]
 *                 example: ["web", "facebook"]
 *     responses:
 *       '200':
 *         description: Analysis completed and saved successfully. Returns the new analysis object.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 web:
 *                   type: object
 *                   properties:
 *                     score: { type: 'number', example: 85 }
 *                     headlineStrength: { type: 'object' }
 *                     keywordAnalysis: { type: 'object' }
 *                     readability: { type: 'object' }
 *                 facebook:
 *                   type: object
 *                   properties:
 *                     engagementScore: { type: 'number', example: 70 }
 *                     ctaPresence: { type: 'object' }
 *                     sentiment: { type: 'object' }
 *                     lengthAnalysis: { type: 'object' }
 *       '401':
 *         description: Unauthorized.
 *       '404':
 *         description: Content with the given ID was not found for the authenticated user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Analysis failed due to an internal server or AI error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/content/analyze', contentController.regenerateAnalysis);

// --- Calendar ---

/**
 * @swagger
 * /calendar/events:
 *   get:
 *     summary: Get calendar events within a date range
 *     description: Retrieves a list of calendar events (e.g., content drafts, publishing dates, suggested trends) for the authenticated user within a specified start and end date.
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: The start date for the range to retrieve events (YYYY-MM-DD).
 *         example: "2024-07-01"
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: The end date for the range to retrieve events (YYYY-MM-DD).
 *         example: "2024-07-31"
 *     responses:
 *       '200':
 *         description: A list of calendar events.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: 'string', example: 'evt_1678886400000_ijklm' }
 *                   userId: { type: 'string', example: 'public_guest_user' }
 *                   title: { type: 'string', example: 'Summer Marketing Campaign Launch' }
 *                   start: { type: 'string', format: 'date', example: '2024-07-15' }
 *                   status: { type: 'string', enum: ['suggested_trend', 'suggested_event', 'draft', 'published'], example: 'draft' }
 *                   type: { type: 'string', enum: ['trend', 'event', 'manual'], example: 'event' }
 *                   contentId: { type: 'string', example: 'gen_1678886400000_defghi' }
 *                   insight: { type: 'string', example: 'High engagement expected around this period.' }
 *                   suggestedAngles:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         title: { type: 'string' }
 *                         predictionScore: { type: 'number' }
 *       '400':
 *         description: Bad request. Missing required `start` or `end` query parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '401':
 *         description: Unauthorized.
 *       '500':
 *         description: Failed to fetch calendar events.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/calendar/events', dataController.getCalendarEvents);

/**
 * @swagger
 * /calendar/suggestions:
 *   post:
 *     summary: Generate and save calendar content suggestions
 *     description: Based on user settings (main topics, target audience) and a current date context, this endpoint uses AI to generate a set of strategic content ideas. These suggestions are then saved as new calendar events for the authenticated user.
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Current date and user settings for generating suggestions.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentDate
 *               - settings
 *             properties:
 *               currentDate:
 *                 type: string
 *                 format: date
 *                 description: The date context for generating suggestions (YYYY-MM-DD).
 *                 example: "2024-07-20"
 *               settings:
 *                 type: object
 *                 required:
 *                   - mainTopics
 *                   - targetAudience
 *                 properties:
 *                   mainTopics:
 *                     type: string
 *                     description: Core themes or topics the user wants content suggestions for.
 *                     example: "AI in software development, project management tips"
 *                   targetAudience:
 *                     type: string
 *                     description: The intended audience for the suggested content.
 *                     example: "Early-stage startup founders and developers"
 *     responses:
 *       '200':
 *         description: Suggestions generated and saved successfully. Returns the list of generated suggestions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title: { type: 'string', example: 'Webinar: Mastering Async JavaScript' }
 *                   date: { type: 'string', format: 'date', example: '2024-08-05' }
 *                   type: { type: 'string', enum: ['trend', 'event'], example: 'event' }
 *                   insight: { type: 'string', example: 'August is peak season for developer upskilling courses.' }
 *                   suggestedAngles:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         title: { type: 'string', example: '5 Tips for Efficient Async Code' }
 *                         predictionScore: { type: 'number', example: 0.85 }
 *       '400':
 *         description: Bad request. Missing required fields (currentDate, settings, mainTopics, targetAudience).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '401':
 *         description: Unauthorized.
 *       '500':
 *         description: Failed to generate or save suggestions due to an internal server or AI error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/calendar/suggestions', dataController.generateAndSaveSuggestions);

export default router;
