import { Router } from 'express';
import { db } from '../db/database';
import { authenticate, AuthenticatedRequest } from './middleware';

export const complianceRouter = Router();

// List all compliance rules
complianceRouter.get('/rules', authenticate, (req, res) => {
  const rules = db.getComplianceRules();
  res.json({ rules });
});

// Admin update rule (e.g. toggle active, change severity)
complianceRouter.put('/rules/:id', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized: Only Administrators can configure compliance rules.' });
    }

    const { id } = req.params;
    const { isActive, severity, description } = req.body;

    const updated = db.updateComplianceRule(id, {
      isActive: isActive !== undefined ? !!isActive : undefined,
      severity: severity || undefined,
      description: description || undefined
    });

    if (!updated) return res.status(404).json({ error: 'Rule not found' });

    db.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'COMPLIANCE_RULE_CONFIGURED',
      entityType: 'SYSTEM_CONFIG',
      entityId: id,
      details: `Administrator updated compliance rule ${updated.ruleCode} (${updated.name}). Active: ${updated.isActive}, Severity: ${updated.severity}`
    });

    res.json({ rule: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update rule' });
  }
});

// Get findings for an application
complianceRouter.get('/findings/:applicationId', authenticate, (req, res) => {
  const { applicationId } = req.params;
  const findings = db.getComplianceFindings(applicationId);
  res.json({ findings });
});

// Reviewer Override Finding with Mandatory Justification
complianceRouter.post('/findings/:id/override', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    if (user.role !== 'SCRUTINY_OFFICER' && user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Unauthorized: Only Scrutiny Officers or Administrators can override automated compliance findings.'
      });
    }

    const { id } = req.params;
    const { disposition, justification } = req.body;

    if (!disposition || (disposition !== 'ACCEPTED_WITH_EXCEPTION' && disposition !== 'CONFIRMED_DEFICIENCY')) {
      return res.status(400).json({
        error: "Invalid disposition: Must be 'ACCEPTED_WITH_EXCEPTION' or 'CONFIRMED_DEFICIENCY'"
      });
    }

    if (!justification || justification.trim().length < 15) {
      return res.status(400).json({
        error: 'Mandatory justification required: Please provide a detailed official justification (minimum 15 characters) explaining the rationale for this override.'
      });
    }

    const overridden = db.overrideComplianceFinding(id, disposition, justification.trim(), user.id);
    if (!overridden) return res.status(404).json({ error: 'Compliance finding not found' });

    // Cryptographic audit entry
    db.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'REVIEWER_OVERRIDE_RECORDED',
      entityType: 'COMPLIANCE_FINDING',
      entityId: id,
      details: `Officer ${user.name} overrode finding '${overridden.ruleName}' [${overridden.ruleCode}] to disposition: ${disposition}.`,
      justification: justification.trim()
    });

    res.json({
      message: 'Reviewer override recorded and cryptographically logged in audit chain',
      finding: overridden
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to record override' });
  }
});
