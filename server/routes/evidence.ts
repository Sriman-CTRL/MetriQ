import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApplicationDocument } from '../models/ApplicationDocument';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

export const evidenceRouter = Router();

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// POST /api/evidence/upload - Upload supporting document or photo
evidenceRouter.post(
  '/upload',
  authenticate,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No file was uploaded.' },
        });
        return;
      }

      const { docType = 'OTHER', applicationId, verificationId, instrumentId } = req.body;

      const doc = await ApplicationDocument.create({
        application: applicationId && applicationId.match(/^[0-9a-fA-F]{24}$/) ? applicationId : undefined,
        verification: verificationId && verificationId.match(/^[0-9a-fA-F]{24}$/) ? verificationId : undefined,
        instrument: instrumentId && instrumentId.match(/^[0-9a-fA-F]{24}$/) ? instrumentId : undefined,
        docType,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageKey: file.path,
        url: `/uploads/${file.filename}`,
        uploadedBy: user._id,
      });

      res.status(201).json({
        success: true,
        data: {
          document: {
            id: doc._id,
            filename: doc.filename,
            originalName: doc.originalName,
            url: doc.url,
            docType: doc.docType,
            size: doc.size,
          },
        },
      });
    } catch (err) {
      console.error('Evidence upload error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to upload evidence document.' },
      });
    }
  }
);
