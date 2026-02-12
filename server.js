const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Serve static files from public directory
app.use(express.static('public'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// API Routes

// Get all blocks
app.get('/api/blocks', async (req, res) => {
    try {
        const blocks = await db.getAllBlocks();
        res.json(blocks);
    } catch (error) {
        console.error('Error fetching blocks:', error);
        res.status(500).json({ error: 'Failed to fetch blocks' });
    }
});

// Get a single block by ID
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

// Search blocks
app.get('/api/blocks/search/:query', async (req, res) => {
    try {
        const blocks = await db.searchBlocks(req.params.query);
        res.json(blocks);
    } catch (error) {
        console.error('Error searching blocks:', error);
        res.status(500).json({ error: 'Failed to search blocks' });
    }
});

// Create a new block
app.post('/api/blocks', upload.fields([
    { name: 'photo_front', maxCount: 1 },
    { name: 'photo_back', maxCount: 1 },
    { name: 'photo_left', maxCount: 1 },
    { name: 'photo_right', maxCount: 1 }
]), async (req, res) => {
    try {
        const { code, material, height, width, length } = req.body;

        // Validate required fields
        if (!code || !material || !height || !width || !length) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get uploaded file paths
        const blockData = {
            code,
            material,
            height: parseFloat(height),
            width: parseFloat(width),
            length: parseFloat(length),
            photo_front: req.files['photo_front'] ? req.files['photo_front'][0].filename : null,
            photo_back: req.files['photo_back'] ? req.files['photo_back'][0].filename : null,
            photo_left: req.files['photo_left'] ? req.files['photo_left'][0].filename : null,
            photo_right: req.files['photo_right'] ? req.files['photo_right'][0].filename : null
        };

        const newBlock = await db.createBlock(blockData);
        res.status(201).json(newBlock);
    } catch (error) {
        console.error('Error creating block:', error);
        if (error.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: 'Block code already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create block' });
        }
    }
});

// Update a block
app.put('/api/blocks/:id', upload.fields([
    { name: 'photo_front', maxCount: 1 },
    { name: 'photo_back', maxCount: 1 },
    { name: 'photo_left', maxCount: 1 },
    { name: 'photo_right', maxCount: 1 }
]), async (req, res) => {
    try {
        const { code, material, height, width, length } = req.body;

        // Get existing block to preserve photos if not updated
        const existingBlock = await db.getBlockById(req.params.id);
        if (!existingBlock) {
            return res.status(404).json({ error: 'Block not found' });
        }

        const blockData = {
            code: code || existingBlock.code,
            material: material || existingBlock.material,
            height: height ? parseFloat(height) : existingBlock.height,
            width: width ? parseFloat(width) : existingBlock.width,
            length: length ? parseFloat(length) : existingBlock.length,
            photo_front: req.files['photo_front'] ? req.files['photo_front'][0].filename : existingBlock.photo_front,
            photo_back: req.files['photo_back'] ? req.files['photo_back'][0].filename : existingBlock.photo_back,
            photo_left: req.files['photo_left'] ? req.files['photo_left'][0].filename : existingBlock.photo_left,
            photo_right: req.files['photo_right'] ? req.files['photo_right'][0].filename : existingBlock.photo_right
        };

        const result = await db.updateBlock(req.params.id, blockData);
        res.json({ message: 'Block updated successfully', ...result });
    } catch (error) {
        console.error('Error updating block:', error);
        res.status(500).json({ error: 'Failed to update block' });
    }
});

// Delete a block
app.delete('/api/blocks/:id', async (req, res) => {
    try {
        // Get block to delete associated photos
        const block = await db.getBlockById(req.params.id);
        if (!block) {
            return res.status(404).json({ error: 'Block not found' });
        }

        // Delete photos from filesystem
        const photos = [block.photo_front, block.photo_back, block.photo_left, block.photo_right];
        photos.forEach(photo => {
            if (photo) {
                const photoPath = path.join(uploadsDir, photo);
                if (fs.existsSync(photoPath)) {
                    fs.unlinkSync(photoPath);
                }
            }
        });

        // Delete block from database
        await db.deleteBlock(req.params.id);
        res.json({ message: 'Block deleted successfully' });
    } catch (error) {
        console.error('Error deleting block:', error);
        res.status(500).json({ error: 'Failed to delete block' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
});
