import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { authRouter } from './routes/auth';
import { applicationsRouter } from './routes/applications';
import { documentsRouter } from './routes/documents';
import { complianceRouter } from './routes/compliance';
import { workflowRouter } from './routes/workflow';
import { analyticsRouter } from './routes/analytics';
import { auditRouter } from './routes/audit';
import { notificationsRouter } from './routes/notifications';
import { db } from './db/database';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure upload directory exists
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOAD_DIR));

// Serve public directory
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
}

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/compliance', complianceRouter);
app.use('/api/workflow', workflowRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/notifications', notificationsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'AICTE Approval Workflow Automation & Compliance System',
    timestamp: new Date().toISOString(),
    auditChainValid: db.verifyAuditChain().isValid
  });
});

// Serve frontend if built (dist directory)
const DIST_DIR = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`
========================================================================
★ AICTE INSTITUTIONAL APPROVAL WORKFLOW AUTOMATION PORTAL ★
========================================================================
Status: Active & Listening on http://localhost:${PORT}
Architecture: Unified Single-Stack (API + Compliance Engine + Web UI)
API Base: http://localhost:${PORT}/api/
Audit Chain Status: Cryptographically Linked (SHA-256)

Stakeholder Accounts (Password: 'password123'):
1. Scrutiny Officer:      officer_sharma
2. Administrator:         aicte_admin
3. CVC Auditor:           cvc_auditor
========================================================================
`);
});
