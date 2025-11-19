import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;
const BACKEND_URL = 'http://localhost:3001';

app.use('/api-home', createProxyMiddleware({ 
    target: BACKEND_URL,
    changeOrigin: true,
    pathRewrite: { '^/api-home': '' }
}));

app.use('/api', createProxyMiddleware({ 
    target: BACKEND_URL,
    changeOrigin: true
}));

app.use('/docs', createProxyMiddleware({ 
    target: BACKEND_URL,
    changeOrigin: true
}));

app.use('/swagger.json', createProxyMiddleware({ 
    target: BACKEND_URL,
    changeOrigin: true
}));

app.use('/health', createProxyMiddleware({ 
    target: BACKEND_URL,
    changeOrigin: true
}));

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Frontend server running on http://0.0.0.0:${PORT}`);
    console.log(`Proxying backend from ${BACKEND_URL}`);
});
