# Regagen API

## Overview
Regagen API is a content generation platform powered by Google's Gemini AI. It helps create AI-powered content for multiple platforms including web articles, social media posts (Facebook, LinkedIn, X/Twitter), and video scripts (YouTube, TikTok).

**Current State**: ✅ Fully functional and running in Replit
- Backend API running on port 3001
- Frontend proxy running on port 5000
- Gemini AI integration configured
- Firebase optional (currently running in mock mode with in-memory storage)

## Recent Changes (November 19, 2025)
- ✅ Migrated from AI Studio's `@google/genai` to standard `@google/generative-ai` package
- ✅ Updated all Gemini API calls to use correct SDK
- ✅ Made Firebase optional with in-memory fallback storage
- ✅ Created frontend proxy to serve backend on port 5000
- ✅ Configured workflow to run both frontend and backend
- ✅ Added .gitignore for Node.js project
- ✅ Fixed helmet configuration to allow iframe/proxy access
- ✅ Configured deployment settings for Replit

## Project Architecture

### Technology Stack
- **Runtime**: Node.js 20
- **Language**: TypeScript
- **Framework**: Express.js
- **AI**: Google Gemini (via @google/generative-ai)
- **Database**: Firebase Firestore (optional, with in-memory fallback)
- **Storage**: Firebase Storage (optional)
- **Authentication**: Firebase Auth (optional, with guest user fallback)
- **Documentation**: Swagger/OpenAPI

### Directory Structure
```
.
├── src/
│   ├── config/
│   │   └── firebase.ts          # Firebase configuration (optional)
│   ├── controllers/
│   │   ├── contentController.ts # Content generation endpoints
│   │   └── dataController.ts    # Project/campaign/topic management
│   ├── middleware/
│   │   └── auth.ts              # Authentication middleware
│   ├── routers/
│   │   └── api.ts               # API route definitions
│   ├── services/
│   │   └── geminiService.ts     # Gemini AI service layer
│   ├── types.ts                 # TypeScript type definitions
│   └── index.ts                 # Main application entry point
├── frontend/
│   ├── server.js                # Frontend proxy server (port 5000)
│   └── index.html               # Landing page redirect
├── start.sh                     # Startup script for both servers
└── package.json                 # Node.js dependencies
```

### API Endpoints

#### Content Generation
- `POST /api/generate-content` - Generate AI content for multiple platforms
- `GET /api/content` - Get user's content history
- `POST /api/content/analyze` - Analyze content performance

#### Project Management
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/campaigns` - List campaigns (optionally filtered by project)
- `POST /api/campaigns` - Create new campaign
- `GET /api/topics` - List topics (optionally filtered by campaign)
- `POST /api/topics` - Create new topic

#### Calendar
- `GET /api/calendar/events` - Get calendar events in date range
- `POST /api/calendar/suggestions` - Generate AI calendar suggestions

#### System
- `GET /` - Landing page
- `GET /docs` - Swagger API documentation
- `GET /swagger.json` - OpenAPI spec
- `GET /health` - Health check endpoint

## Environment Variables

### Required
- `GEMINI_API_KEY` - Google Gemini API key (get from https://aistudio.google.com/app/apikey)

### Optional (Firebase)
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON (as string)
- `FIREBASE_STORAGE_BUCKET` - Firebase storage bucket name

### System
- `PORT` - Backend port (default: 3001)
- `API_KEY` - Alternative name for GEMINI_API_KEY

## User Preferences
None configured yet. Update this section when user expresses preferences about:
- Coding style
- Workflow preferences
- Tool preferences
- Testing approach

## Development

### Running Locally
The app automatically starts via the configured workflow. Both backend and frontend run together:
```bash
bash start.sh
```

This script:
1. Starts the backend API on port 3001 (localhost)
2. Starts the frontend proxy on port 5000 (0.0.0.0)
3. Frontend proxies all API requests to backend

### Development Mode
Backend uses `tsx --watch` for hot reload on file changes.

### Building for Production
```bash
npm run build  # Compiles TypeScript to dist/
npm start      # Runs compiled code
```

## Deployment
Configured for Replit Autoscale deployment:
- **Type**: autoscale (stateless web service)
- **Command**: `bash start.sh`
- **Port**: 5000 (frontend proxy)

The deployment will:
- Run the startup script automatically
- Scale based on traffic
- Maintain environment variables (including GEMINI_API_KEY)

## Firebase Setup (Optional)
Currently running in mock mode with in-memory storage. To enable Firebase:

1. Get Firebase service account JSON from Firebase Console
2. Set `FIREBASE_SERVICE_ACCOUNT` environment variable with the JSON content
3. Set `FIREBASE_STORAGE_BUCKET` to your bucket name (e.g., "regagen.appspot.com")
4. Restart the application

Firebase provides:
- Persistent data storage (Firestore)
- Image storage (Cloud Storage)
- User authentication (Firebase Auth)

## API Documentation
Access Swagger UI at: `/docs`
- Interactive API testing
- Complete endpoint documentation
- Request/response schemas

## Notes
- Image generation currently returns placeholder images (Picsum) as the standard Gemini SDK doesn't yet support image generation
- Authentication defaults to guest user when no token provided
- All data is stored in-memory when Firebase is not configured
- Backend must run on localhost, frontend on 0.0.0.0:5000 for Replit preview to work
