import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration with timestamp and sanitized filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  }
});

// File filter (images only: PNG, JPG, JPEG, WEBP, GIF, ICO) - strictly AND matched
const fileFilter = (req, file, cb) => {
  const allowedMime = /^(image\/jpeg|image\/png|image\/gif|image\/webp|image\/x-icon|image\/vnd\.microsoft\.icon)$/i;
  const allowedExt = /\.(jpg|jpeg|png|gif|webp|ico)$/i;
  
  const isMimeValid = allowedMime.test(file.mimetype);
  const isExtValid = allowedExt.test(file.originalname);
  
  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    cb(new Error('Dozwolone są wyłącznie bezpieczne pliki graficzne (PNG, JPG, WEBP, GIF, ICO)'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

const router = express.Router();

router.post('/image', authenticateToken, requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nie przesłano żadnego pliku' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

export default router;
