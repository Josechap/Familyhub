const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db/database');

// Import sharp for HEIC conversion
let sharp;
try {
    sharp = require('sharp');
} catch (err) {
    console.warn('Sharp not available, HEIC conversion disabled:', err.message);
}

// Supported image extensions (includes HEIC for Apple photos)
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
const HEIC_EXTENSIONS = ['.heic', '.heif'];

// Helper to check if a file is an image
const isImageFile = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext);
};

// Helper to check if file is HEIC
const isHeicFile = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    return HEIC_EXTENSIONS.includes(ext);
};

// GET /config - Get current photos directory configuration
router.get('/config', (req, res) => {
    try {
        const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('localPhotosPath');
        const photosPath = setting?.value || null;

        let photoCount = 0;
        let isValid = false;

        if (photosPath) {
            try {
                if (fs.existsSync(photosPath)) {
                    const files = fs.readdirSync(photosPath);
                    photoCount = files.filter(isImageFile).length;
                    isValid = true;
                }
            } catch (err) {
                console.error('Error reading photos directory:', err);
            }
        }

        res.json({
            path: photosPath,
            photoCount,
            isValid,
            heicSupported: !!sharp,
        });
    } catch (error) {
        console.error('Error getting photos config:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /config - Set photos directory path
router.put('/config', (req, res) => {
    try {
        const { path: photosPath } = req.body;

        if (!photosPath) {
            // Clear the setting
            db.prepare('DELETE FROM settings WHERE key = ?').run('localPhotosPath');
            return res.json({ path: null, photoCount: 0, isValid: false });
        }

        // Validate the path exists and is a directory
        if (!fs.existsSync(photosPath)) {
            return res.status(400).json({ error: 'Directory does not exist' });
        }

        const stats = fs.statSync(photosPath);
        if (!stats.isDirectory()) {
            return res.status(400).json({ error: 'Path is not a directory' });
        }

        // Count photos
        const files = fs.readdirSync(photosPath);
        const photoCount = files.filter(isImageFile).length;

        // Save to database
        db.prepare(`
            INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
        `).run('localPhotosPath', photosPath);

        res.json({
            path: photosPath,
            photoCount,
            isValid: true,
            heicSupported: !!sharp,
        });
    } catch (error) {
        console.error('Error setting photos config:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET / - List all photos in the configured directory
router.get('/', (req, res) => {
    try {
        const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('localPhotosPath');
        const photosPath = setting?.value;

        if (!photosPath) {
            return res.json([]);
        }

        if (!fs.existsSync(photosPath)) {
            return res.json([]);
        }

        const files = fs.readdirSync(photosPath);
        const photos = files
            .filter(isImageFile)
            .map((filename, index) => ({
                id: `local-${index}`,
                filename,
                url: `/api/photos/file/${encodeURIComponent(filename)}`,
            }));

        res.json(photos);
    } catch (error) {
        console.error('Error listing photos:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /file/:filename - Serve a specific photo file (with HEIC conversion)
router.get('/file/:filename', async (req, res) => {
    try {
        const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('localPhotosPath');
        const photosPath = setting?.value;

        if (!photosPath) {
            return res.status(404).json({ error: 'Photos directory not configured' });
        }

        const filename = decodeURIComponent(req.params.filename);

        // Security: Prevent directory traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const filePath = path.join(photosPath, filename);

        // Verify file exists and is within the photos directory
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        // Verify it's an image file
        if (!isImageFile(filename)) {
            return res.status(400).json({ error: 'Not an image file' });
        }

        // Check if it's a HEIC file that needs conversion
        if (isHeicFile(filename) && sharp) {
            try {
                // Convert HEIC to JPEG on-the-fly
                const imageBuffer = await sharp(filePath)
                    .jpeg({ quality: 85 })
                    .toBuffer();

                res.set('Content-Type', 'image/jpeg');
                res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
                return res.send(imageBuffer);
            } catch (convErr) {
                console.error('HEIC conversion error:', convErr);
                // Fall through to send original file if conversion fails
            }
        }

        // Send the file as-is for non-HEIC or if conversion failed
        res.sendFile(filePath);
    } catch (error) {
        console.error('Error serving photo:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

