import { Router } from 'express';
import { db } from '../db/database';
import { authenticate, AuthenticatedRequest } from './middleware';

export const auditRouter = Router();

// List audit records
auditRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const { entityType, entityId, search } = req.query;
    let logs = db.getAuditLogs();

    if (entityType) {
      logs = logs.filter(l => l.entityType === entityType);
    }
    if (entityId) {
      logs = logs.filter(l => l.entityId === entityId);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      logs = logs.filter(l => 
        l.action.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q)
      );
    }

    res.json({
      totalBlocks: logs.length,
      auditLogs: logs
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit logs' });
  }
});

// Cryptographic verification of audit chain
auditRouter.post('/verify', authenticate, (req, res) => {
  try {
    const result = db.verifyAuditChain();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Audit verification failed' });
  }
});

// System configurations
auditRouter.get('/configurations', authenticate, (req, res) => {
  res.json({ configurations: db.getSystemConfigurations() });
});

auditRouter.put('/configurations/:key', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only Administrators can update SLA configurations' });
    }

    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ error: 'value is required' });
    }

    const updated = db.updateSystemConfiguration(key, String(value), user.id);
    if (!updated) return res.status(404).json({ error: 'Configuration key not found' });

    db.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'SYSTEM_CONFIGURATION_UPDATED',
      entityType: 'SYSTEM_CONFIG',
      entityId: key,
      details: `Administrator updated SLA configuration '${key}' to '${value}'`
    });

    res.json({ configuration: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update configuration' });
  }
});
