import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { protect, adminOnly } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Define the target directory where images should be saved: client/public/images
const targetDir = path.join(__dirname, '../../client/public/images');

// Ensure directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Set up multer storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, targetDir);
  },
  filename(req, file, cb) {
    // Generate unique filename: timestamp-originalname
    const cleanName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${cleanName}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

// POST /api/upload -> Admin only
router.post('/', protect, adminOnly, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // Return the public URL path for the frontend
  res.json({
    message: 'Image uploaded successfully',
    imageUrl: `/images/${req.file.filename}`
  });
});

export default router;
