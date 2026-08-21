import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import config from '../config/index.js';
import { recordAudit } from '../utils/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed extensions map to canonical extension
const EXT_MAP = {
  '.jpg': '.jpg',
  '.jpeg': '.jpg',
  '.png': '.png',
  '.webp': '.webp',
  '.gif': '.gif',
  '.ico': '.ico'
};

// Storage configuration with cryptographic UUID filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = EXT_MAP[rawExt] || '.png';
    const uniqueId = crypto.randomUUID();
    cb(null, `upload-${uniqueId}${safeExt}`);
  }
});

// File filter checking MIME & extension
const fileFilter = (req, file, cb) => {
  const allowedMime = /^(image\/jpeg|image\/png|image\/gif|image\/webp|image\/x-icon|image\/vnd\.microsoft\.icon)$/i;
  const rawExt = path.extname(file.originalname).toLowerCase();
  
  const isMimeValid = allowedMime.test(file.mimetype);
  const isExtValid = Boolean(EXT_MAP[rawExt]);
  
  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    cb(new Error('Dozwolone są wyłącznie bezpieczne pliki graficzne (PNG, JPG, WEBP, GIF, ICO)'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: (config.UPLOAD_MAX_SIZE_MB || 10) * 1024 * 1024,
    files: 1
  },
  fileFilter
});

// Magic byte / File Signature validator
function validateMagicBytes(filePath) {
  const buffer = Buffer.alloc(16);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 16, 0);
  fs.closeSync(fd);

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }
  // WEBP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'image/webp';
  }
  // ICO: 00 00 01 00
  if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) {
    return 'image/x-icon';
  }

  return null;
}

function validateImageDimensionsAndStructure(filePath, mimeType) {
  const MAX_DIMENSION = 4096;
  const buffer = Buffer.alloc(128);
  const fd = fs.openSync(filePath, 'r');
  const bytesRead = fs.readSync(fd, buffer, 0, 128, 0);
  fs.closeSync(fd);

  if (mimeType === 'image/png' && bytesRead >= 24) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (width === 0 || height === 0 || width > MAX_DIMENSION || height > MAX_DIMENSION) {
      throw new Error(`Wymiary obrazu PNG (${width}x${height}) przekraczają dozwolony limit (max ${MAX_DIMENSION}x${MAX_DIMENSION})`);
    }
  } else if (mimeType === 'image/gif' && bytesRead >= 10) {
    const width = buffer.readUInt16LE(6);
    const height = buffer.readUInt16LE(8);
    if (width === 0 || height === 0 || width > MAX_DIMENSION || height > MAX_DIMENSION) {
      throw new Error(`Wymiary obrazu GIF (${width}x${height}) przekraczają dozwolony limit (max ${MAX_DIMENSION}x${MAX_DIMENSION})`);
    }
  }
  return true;
}

const router = express.Router();

router.post('/image', uploadLimiter, authenticateToken, requireAdmin, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload error' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nie przesłano żadnego pliku' });
    }

    const uploadedPath = req.file.path;

    // Verify magic bytes & dimensions
    try {
      const detectedMime = validateMagicBytes(uploadedPath);
      if (!detectedMime) {
        fs.unlinkSync(uploadedPath);
        return res.status(400).json({ error: 'Nieprawidłowa zawartość pliku graficznego (niezgodny podpis binarny)' });
      }

      validateImageDimensionsAndStructure(uploadedPath, detectedMime);
    } catch (readErr) {
      try { fs.unlinkSync(uploadedPath); } catch (e) {}
      return res.status(400).json({ error: readErr.message || 'Błąd weryfikacji pliku' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    recordAudit({
      event: 'IMAGE_UPLOADED',
      userId: req.user.id,
      username: req.user.username,
      ip: req.ip,
      details: { filename: req.file.filename, size: req.file.size }
    });

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  });
});

export default router;
