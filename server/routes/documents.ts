import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db/database';
import { authenticate, AuthenticatedRequest } from './middleware';
import { extractDocumentFields } from '../rules/documentExtractor';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error(`Unsupported file format '${ext}'. Permitted document formats are: [${allowed.join(', ')}]`));
    }
    cb(null, true);
  }
});

export const documentsRouter = Router();

// Upload document
documentsRouter.post('/upload', authenticate, (req: AuthenticatedRequest, res) => {
  upload.single('file')(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload rejected' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file received in upload payload' });
      }

      const { applicationId, documentCategory, title, validityExpiryDate } = req.body;
      if (!applicationId || !documentCategory) {
        return res.status(400).json({ error: 'applicationId and documentCategory are required' });
      }

      const app = db.getApplicationById(applicationId);
      if (!app) return res.status(404).json({ error: 'Application not found' });

      const institution = db.getInstitutionById(app.institutionId);
      if (!institution) return res.status(404).json({ error: 'Institution not found' });

      const user = req.user!;

      // Add document to database
      const newDoc = db.addDocument({
        applicationId,
        documentCategory,
        title: title || req.file.originalname,
        originalFilename: req.file.originalname,
        storagePath: req.file.path,
        fileSizeBytes: req.file.size,
        mimeType: req.file.mimetype,
        uploadedByUserId: user.id,
        validityExpiryDate: validityExpiryDate || undefined,
        status: 'PENDING_EXTRACTION'
      });

      // Extract fields automatically
      let extracted: any[] = [];
      try {
        extracted = await extractDocumentFields(newDoc, institution);
      } catch (extractErr) {
        console.warn('Field extraction warning:', extractErr);
      }

      // Add audit log
      db.addAuditLog({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'DOCUMENT_UPLOADED',
        entityType: 'DOCUMENT',
        entityId: newDoc.id,
        details: `Uploaded ${newDoc.documentCategory} (${newDoc.originalFilename}, ${Math.round(newDoc.fileSizeBytes / 1024)} KB) for ${app.applicationNumber}.`
      });

      res.status(201).json({
        message: 'Document successfully uploaded and parsed',
        document: db.getDocumentById(newDoc.id),
        extractedFields: extracted
      });
    } catch (processErr: any) {
      res.status(500).json({ error: processErr.message || 'Document processing error' });
    }
  });
});

// Manual re-extraction
documentsRouter.post('/:id/extract', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const doc = db.getDocumentById(id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const app = db.getApplicationById(doc.applicationId);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const inst = db.getInstitutionById(app.institutionId);
    if (!inst) return res.status(404).json({ error: 'Institution not found' });

    const extracted = await extractDocumentFields(doc, inst);
    res.json({ document: db.getDocumentById(id), extractedFields: extracted });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to extract document' });
  }
});

// Reviewer verification of document
documentsRouter.put('/:id/verify', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, notes, rejectionReason } = req.body;
    const user = req.user!;

    if (user.role !== 'SCRUTINY_OFFICER' && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized: Only Scrutiny Officers or Administrators can verify documents' });
    }

    const doc = db.getDocumentById(id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const updated = db.updateDocument(id, {
      status: status || 'VERIFIED',
      verificationNotes: notes || doc.verificationNotes,
      rejectionReason: rejectionReason || undefined
    });

    db.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: `DOCUMENT_${status || 'VERIFIED'}`,
      entityType: 'DOCUMENT',
      entityId: id,
      details: `Officer ${user.name} marked document ${doc.originalFilename} as ${status}. Notes: ${notes || 'None'}`
    });

    res.json({ document: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Verification update failed' });
  }
});
