import { Router } from 'express';
import { db } from '../db/database';
import { authenticate, AuthenticatedRequest } from './middleware';
import { WorkflowService } from '../services/workflowService';
import { runComplianceScrutiny } from '../rules/complianceRules';
import { DeadlineService } from '../services/deadlineService';

export const applicationsRouter = Router();

// List applications with filters and deadline intelligence
applicationsRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const { stage, applicationType, search, overdueOnly, assignedToMe } = req.query;
    const user = req.user!;

    let institutionId: string | undefined = undefined;
    let assignedOfficerId: string | undefined = undefined;

    if (user.role === 'INSTITUTION') {
      institutionId = user.institutionId;
    } else if (user.role === 'SCRUTINY_OFFICER' && assignedToMe === 'true') {
      assignedOfficerId = user.id;
    }

    const apps = db.getApplications({
      stage: stage as string,
      applicationType: applicationType as string,
      search: search as string,
      overdueOnly: overdueOnly === 'true',
      institutionId,
      assignedOfficerId
    });

    const enriched = apps.map(app => {
      const inst = db.getInstitutionById(app.institutionId);
      const metrics = DeadlineService.calculateApplicationMetrics(app);
      return {
        ...app,
        institutionName: inst ? inst.name : 'Unknown Institution',
        permanentInstituteId: inst ? inst.permanentInstituteId : '',
        state: inst ? inst.state : '',
        region: inst ? inst.region : '',
        category: inst ? inst.category : '',
        deadlineMetrics: metrics
      };
    });

    res.json({ applications: enriched, count: enriched.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list applications' });
  }
});

// Get single application full dossier
applicationsRouter.get('/:id', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const app = db.getApplicationById(id);
    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const user = req.user!;
    if (user.role === 'INSTITUTION' && app.institutionId !== user.institutionId) {
      return res.status(403).json({ error: 'Access denied: You can only view your own institution applications' });
    }

    const institution = db.getInstitutionById(app.institutionId);
    const programmes = db.getProgrammes(id);
    const documents = db.getDocuments(id);
    const extractedFields = db.getExtractedFields(id);
    const findings = db.getComplianceFindings(id);
    const stageHistory = db.getStageHistory(id);
    const reviewComments = db.getReviewComments(id);
    const clarifications = db.getClarifications(id);
    const deadlineMetrics = DeadlineService.calculateApplicationMetrics(app);

    res.json({
      application: app,
      institution,
      programmes,
      documents,
      extractedFields,
      findings,
      stageHistory,
      reviewComments,
      clarifications,
      deadlineMetrics
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve application dossier' });
  }
});

// Create application draft
applicationsRouter.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    let targetInstId = req.body.institutionId;

    if (user.role === 'INSTITUTION') {
      targetInstId = user.institutionId;
    }

    if (!targetInstId) {
      return res.status(400).json({ error: 'Institution ID is required' });
    }

    const { applicationType, academicYear, programmes } = req.body;

    const newApp = db.createApplication({
      institutionId: targetInstId,
      applicationType: applicationType || 'EXTENSION_OF_APPROVAL',
      academicYear: academicYear || '2025-26'
    });

    // Add initial programmes if supplied
    if (Array.isArray(programmes)) {
      programmes.forEach(p => {
        db.addProgramme({
          applicationId: newApp.id,
          programmeType: p.programmeType || 'ENGINEERING_AND_TECHNOLOGY',
          courseName: p.courseName || 'Computer Science and Engineering',
          level: p.level || 'UG',
          durationYears: p.durationYears || 4,
          existingIntake: p.existingIntake || 60,
          proposedIntake: p.proposedIntake || 60,
          nbaAccredited: !!p.nbaAccredited,
          facultyCount: p.facultyCount || 4
        });
      });
    }

    // Add stage history
    db.addStageHistory({
      applicationId: newApp.id,
      fromStage: 'DRAFT',
      toStage: 'DRAFT',
      action: 'Application Draft Created',
      performedByUserId: user.id,
      performedByName: user.name,
      performedByRole: user.role,
      comments: `Created application draft for academic year ${newApp.academicYear}`
    });

    // Audit log
    db.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'APPLICATION_DRAFT_CREATED',
      entityType: 'APPLICATION',
      entityId: newApp.id,
      details: `Created draft application ${newApp.applicationNumber} (${newApp.applicationType})`
    });

    res.status(201).json({ application: newApp });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create application draft' });
  }
});

// Update draft application (blocked if already submitted)
applicationsRouter.put('/:id', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const app = db.getApplicationById(id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    if (app.currentStage !== 'DRAFT') {
      return res.status(400).json({
        error: `Edit restriction active: Application ${app.applicationNumber} is in stage '${app.currentStage}'. Changes to submitted applications require formal clarification or revision approval.`
      });
    }

    const { applicationType, academicYear, holdReason } = req.body;
    const updated = db.updateApplication(id, {
      applicationType: applicationType || app.applicationType,
      academicYear: academicYear || app.academicYear,
      holdReason: holdReason !== undefined ? holdReason : app.holdReason
    });

    res.json({ application: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update application' });
  }
});

// Submit formal application
applicationsRouter.post('/:id/submit', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const submitted = WorkflowService.submitApplication(id, user);
    res.json({
      message: 'Application formally submitted for AICTE Preliminary Scrutiny',
      application: submitted
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to submit application' });
  }
});

// Run AI-assisted preliminary scrutiny on demand
applicationsRouter.post('/:id/run-scrutiny', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const result = runComplianceScrutiny(id);

    // Record audit
    db.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'RUN_PRELIMINARY_SCRUTINY',
      entityType: 'COMPLIANCE_FINDING',
      entityId: id,
      details: `Preliminary scrutiny executed. Score: ${result.complianceScore}%, Critical Deficiencies: ${result.criticalDeficiencyCount}.`
    });

    res.json({ result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to execute preliminary scrutiny' });
  }
});
