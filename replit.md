# Regagen API

## Overview
Regagen API is a content generation platform powered by Google's Gemini AI. It helps create AI-powered content for multiple platforms including web articles, social media posts, and video scripts. This is a pure backend API service.

**Current State**: ✅ Fully functional JavaScript API
- API running on port 3001
- Gemini AI integration configured
- Firebase optional (currently running in mock mode with in-memory storage)

## Recent Changes
- ✅ Converted the entire project from TypeScript to pure JavaScript (ES Modules).
- ✅ Removed the frontend proxy server and all related dependencies.
- ✅ Simplified the project structure to be API-only.
- ✅ Updated startup scripts and documentation for a JS workflow.

## Project Architecture

### Technology Stack
- **Runtime**: Node.js 20
- **Language**: JavaScript (ES Modules)
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
│   │   └── firebase.js          # Firebase configuration (optional)
│   ├── controllers/
│   │   ├── contentController.js # Content generation endpoints
│   │   └── dataController.js    # Project/campaign/topic management
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routers/
│   │   └── api.js               # API route definitions
│   ├── services/
│   │   └── geminiService.js     # Gemini AI service layer
│   ├── types.js                 # TypeScript type definitions
│   └── index.js                 # Main application entry point
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
The app automatically starts via the configured workflow. The backend runs on port 3001:
```bash
bash start.sh
```

This script:
1. Starts the backend API on port 3001 (localhost)
2. Frontend proxies all API requests to backend

### Development Mode
Backend uses `node --watch` for hot reload on file changes.

### Building for Production
```bash
npm run build  # Compiles JavaScript to dist/
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
- Backend must run on localhost for Replit preview to work
