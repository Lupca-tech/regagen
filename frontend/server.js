import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;
const BACKEND_URL = 'http://localhost:3001';

app.use('/docs', createProxyMiddleware({ 
    target: `${BACKEND_URL}/docs`,
    changeOrigin: true,
    pathRewrite: { '^/docs': '' },
    ws: true
}));

app.use('/swagger.json', createProxyMiddleware({ 
    target: `${BACKEND_URL}/swagger.json`,
    changeOrigin: true,
    pathRewrite: { '^/swagger.json': '' }
}));

app.use('/api', createProxyMiddleware({ 
    target: `${BACKEND_URL}/api`,
    changeOrigin: true,
    pathRewrite: { '^/api': '' }
}));

app.use('/health', createProxyMiddleware({ 
    target: `${BACKEND_URL}/health`,
    changeOrigin: true,
    pathRewrite: { '^/health': '' }
}));

app.get('/', (req, res) => {
    res.redirect(301, '/api-home');
});

app.use('/api-home', createProxyMiddleware({ 
    target: BACKEND_URL,
    changeOrigin: true,
    pathRewrite: { '^/api-home': '' }
}));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Frontend server running on http://0.0.0.0:${PORT}`);
    console.log(`Proxying backend from ${BACKEND_URL}`);
});
