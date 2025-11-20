import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import apiRoutes from './routers/api.js';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, '..', 'access.log'), { flags: 'a' });

// Middleware
app.use(morgan('combined', { stream: accessLogStream }));
app.use(helmet({
  contentSecurityPolicy: false,
  frameguard: false
}));

// Remove CORS barriers: Allow all origins
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204 // Explicitly handle preflight requests with a 204 No Content
}));

app.use(express.json({ limit: '10mb' }));

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Regagen API',
      version: '1.0.0',
      description: 'Public API for the Regagen content creation platform',
    },
    servers: [
      {
        url: '/api',
        description: 'Current Server',
      },
    ],
    // Security schemes removed/optional since API is now public
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [], // No security by default
  },
  apis: ['./src/routers/*.js'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// 1. Serve Swagger JSON directly
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 2. Custom Swagger UI Page (Robust CDN version) at /docs
app.get('/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Regagen API Docs</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
      <style>
        body { margin: 0; padding: 0; }
        #swagger-ui { max-width: 1400px; margin: 0 auto; }
        .topbar { background-color: #2c3e50 !important; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/swagger.json',
            dom_id: '#swagger-ui',
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
            layout: "BaseLayout",
          });
        };
      </script>
    </body>
    </html>
  `);
});

// 3. Beautiful Landing Page at Root /
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Regagen API Backend</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                color: white;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                text-align: center;
            }
            .container {
                background: rgba(255, 255, 255, 0.05);
                padding: 3rem;
                border-radius: 20px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                max-width: 600px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
            }
            h1 {
                font-size: 3rem;
                margin-bottom: 1rem;
                background: linear-gradient(to right, #60a5fa, #a855f7);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            p {
                font-size: 1.2rem;
                color: #94a3b8;
                margin-bottom: 2.5rem;
                line-height: 1.6;
            }
            .btn {
                display: inline-block;
                background: #3b82f6;
                color: white;
                padding: 1rem 2rem;
                border-radius: 50px;
                text-decoration: none;
                font-weight: 600;
                font-size: 1.1rem;
                transition: all 0.3s ease;
                box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.5);
            }
            .btn:hover {
                background: #2563eb;
                transform: translateY(-2px);
                box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.6);
            }
            .status {
                margin-top: 2rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                font-size: 0.9rem;
                color: #4ade80;
            }
            .dot {
                width: 8px;
                height: 8px;
                background-color: #4ade80;
                border-radius: 50%;
                box-shadow: 0 0 8px #4ade80;
            }
            .badge {
                background: rgba(74, 222, 128, 0.2);
                color: #4ade80;
                padding: 0.25rem 0.75rem;
                border-radius: 1rem;
                font-size: 0.8rem;
                margin-top: 1rem;
                display: inline-block;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Regagen API</h1>
            <p>Backend Server is running successfully.<br>Powered by Node.js, Express & Gemini AI.</p>
            
            <a href="/docs" class="btn">View API Documentation</a>
            
            <div>
                <span class="badge">Public Access Enabled</span>
            </div>

            <div class="status">
                <div class="dot"></div>
                <span>System Operational</span>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Routes
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Centralized Detailed Error Logging Middleware
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  
  // Log header
  console.error(`\n[${timestamp}] ========== ERROR CAUGHT ==========`);
  
  // Log Request Context
  console.error(`Request: ${req.method} ${req.originalUrl}`);
  
  // Log Body (if present and safe)
  if (req.body && Object.keys(req.body).length > 0) {
    try {
      // Simple stringify, could add redaction here if needed for sensitive fields
      console.error('Body Payload:', JSON.stringify(req.body, null, 2));
    } catch (e) {
      console.error('Body Payload: [Unparseable]');
    }
  }

  // Log the actual error
  console.error('Error Details:', err.message || err);
  if (err.stack) {
    console.error('Stack Trace:', err.stack);
  }
  
  console.error('============================================\n');
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: message,
    timestamp: timestamp,
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});
