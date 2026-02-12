const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const path = require('path');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Supabase Admin for token verification
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_KEY || '');

// Authentication Middleware
const authenticate = async (req, res, next) => {
    console.log(`[AUTH] Verificando acesso: ${req.method} ${req.path}`);
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.warn('[AUTH] Cabeçalho de autorização ausente');
            return res.status(401).json({ error: 'Não autenticado' });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            console.warn('[AUTH] Sessão inválida ou o usuário não existe:', error?.message);
            return res.status(401).json({ error: 'Sessão inválida ou expirada' });
        }

        console.log(`[AUTH] Acesso permitido para: ${user.email}`);
        req.user = user;
        next();
    } catch (err) {
        console.error('[AUTH] Erro interno no Middleware:', err);
        res.status(500).json({ error: 'Erro interno de autenticação' });
    }
};

// Protect all /api/blocks routes
app.use('/api/blocks', authenticate);

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'block-inventory',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
        public_id: (req, file) => Date.now() + '-' + Math.round(Math.random() * 1E9)
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (Simple monitoring)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// Health check with DB status
app.get('/health', async (req, res) => {
    const dbStatus = await db.testConnection();
    const status = {
        server: 'OK',
        database: dbStatus.connected ? 'OK' : 'ERROR',
        db_error: dbStatus.error,
        timestamp: new Date()
    };

    const statusCode = dbStatus.connected ? 200 : 503;
    res.status(statusCode).json(status);
});

// Serve static files from public directory
app.use(express.static('public'));

// Config endpoint for frontend
app.get('/api/config', (req, res) => {
    res.json({
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_KEY
    });
});

// API Routes
app.get('/api/blocks', async (req, res) => {
    try {
        const blocks = await db.getAllBlocks();
        res.json(blocks);
    } catch (error) {
        console.error('Error fetching blocks:', error);
        res.status(500).json({ error: 'Failed to fetch blocks' });
    }
});

app.get('/api/blocks/:id', async (req, res) => {
    try {
        const block = await db.getBlockById(req.params.id);
        if (block) {
            res.json(block);
        } else {
            res.status(404).json({ error: 'Block not found' });
        }
    } catch (error) {
        console.error('Error fetching block:', error);
        res.status(500).json({ error: 'Failed to fetch block' });
    }
});

app.get('/api/blocks/search/:query', async (req, res) => {
    try {
        const blocks = await db.searchBlocks(req.params.query);
        res.json(blocks);
    } catch (error) {
        console.error('Error searching blocks:', error);
        res.status(500).json({ error: 'Failed to search blocks' });
    }
});

app.post('/api/blocks', upload.fields([
    { name: 'photo_front', maxCount: 1 },
    { name: 'photo_back', maxCount: 1 },
    { name: 'photo_left', maxCount: 1 },
    { name: 'photo_right', maxCount: 1 }
]), async (req, res) => {
    try {
        const { code, material, height, width, length, classification } = req.body;

        if (!code || !material || !height || !width || !length || !classification) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const blockData = {
            code,
            material,
            classification,
            height: parseFloat(height),
            width: parseFloat(width),
            length: parseFloat(length),
            photo_front: req.files['photo_front'] ? req.files['photo_front'][0].path : null,
            photo_back: req.files['photo_back'] ? req.files['photo_back'][0].path : null,
            photo_left: req.files['photo_left'] ? req.files['photo_left'][0].path : null,
            photo_right: req.files['photo_right'] ? req.files['photo_right'][0].path : null
        };

        const newBlock = await db.createBlock(blockData);
        res.status(201).json(newBlock);
    } catch (error) {
        console.error('Error creating block:', error);
        res.status(500).json({ error: 'Failed to create block' });
    }
});

app.put('/api/blocks/:id', upload.fields([
    { name: 'photo_front', maxCount: 1 },
    { name: 'photo_back', maxCount: 1 },
    { name: 'photo_left', maxCount: 1 },
    { name: 'photo_right', maxCount: 1 }
]), async (req, res) => {
    try {
        const { code, material, height, width, length, classification } = req.body;
        const existingBlock = await db.getBlockById(req.params.id);

        if (!existingBlock) {
            return res.status(404).json({ error: 'Block not found' });
        }

        const blockData = {
            code: code || existingBlock.code,
            material: material || existingBlock.material,
            classification: classification || existingBlock.classification,
            height: height ? parseFloat(height) : existingBlock.height,
            width: width ? parseFloat(width) : existingBlock.width,
            length: length ? parseFloat(length) : existingBlock.length,
            photo_front: req.files['photo_front'] ? req.files['photo_front'][0].path : existingBlock.photo_front,
            photo_back: req.files['photo_back'] ? req.files['photo_back'][0].path : existingBlock.photo_back,
            photo_left: req.files['photo_left'] ? req.files['photo_left'][0].path : existingBlock.photo_left,
            photo_right: req.files['photo_right'] ? req.files['photo_right'][0].path : existingBlock.photo_right
        };

        const result = await db.updateBlock(req.params.id, blockData);
        res.json({ message: 'Block updated successfully', ...result });
    } catch (error) {
        console.error('Error updating block:', error);
        res.status(500).json({ error: 'Failed to update block' });
    }
});

app.delete('/api/blocks/:id', async (req, res) => {
    try {
        await db.deleteBlock(req.params.id);
        res.json({ message: 'Block deleted successfully' });
    } catch (error) {
        console.error('Error deleting block:', error);
        res.status(500).json({ error: 'Failed to delete block' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
