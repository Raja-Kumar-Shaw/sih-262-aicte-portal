import { Router } from 'express';
import { db } from '../db/database';
import { authenticate, AuthenticatedRequest } from './middleware';
import { WorkflowService } from '../services/workflowService';

export const workflowRouter = Router();

// Transition stage
workflowRouter.post('/transition', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const { applicationId, targetStage, actionName, comments } = req.body;
    if (!applicationId || !targetStage) {
      return res.status(400).json({ error: 'applicationId and targetStage are required' });
    }

    const user = req.user!;
    const updated = WorkflowService.transitionStage(
      applicationId,
      targetStage,
      user,
      actionName || `Stage changed to ${targetStage}`,
      comments
    );

    res.json({ message: 'Stage transitioned successfully', application: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Workflow transition failed' });
  }
});

// Assign or reassign reviewer
workflowRouter.post('/assign', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const { applicationId, officerId } = req.body;
    if (!applicationId || !officerId) {
      return res.status(400).json({ error: 'applicationId and officerId are required' });
    }

    const user = req.user!;
    const updated = WorkflowService.assignReviewer(applicationId, officerId, user);
    res.json({ message: 'Scrutiny Officer successfully assigned', application: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Reviewer allocation failed' });
  }
});

// Add review comment
workflowRouter.post('/comments', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const { applicationId, category, comment } = req.body;
    if (!applicationId || !comment) {
      return res.status(400).json({ error: 'applicationId and comment are required' });
    }

    const user = req.user!;
    if (user.role === 'AUDITOR') {
      return res.status(403).json({ error: 'Auditors have read-only access and cannot post scrutiny comments' });
    }

    const newComment = db.addReviewComment({
      applicationId,
      officerId: user.id,
      officerName: user.name,
      category: category || 'GENERAL',
      comment: comment.trim()
    });

    db.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'REVIEW_COMMENT_POSTED',
      entityType: 'APPLICATION',
      entityId: applicationId,
      details: `${user.name} added scrutiny comment [${newComment.category}]: ${comment.trim().substring(0, 100)}...`
    });

    res.status(201).json({ comment: newComment });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add comment' });
  }
});

// Issue clarification request
workflowRouter.post('/clarification', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const { applicationId, requestedFields, requestQuery, deadlineDays } = req.body;
    if (!applicationId || !requestQuery) {
      return res.status(400).json({ error: 'applicationId and requestQuery are required' });
    }

    const user = req.user!;
    if (user.role !== 'SCRUTINY_OFFICER' && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only Scrutiny Officers or Admins can issue clarification requests' });
    }

    const app = db.getApplicationById(applicationId);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const days = deadlineDays || 7;
    const deadlineDate = new Date(Date.now() + days * 86400000).toISOString();

    const clr = db.createClarification({
      applicationId,
      officerId: user.id,
      officerName: user.name,
      requestedFields: requestedFields || [],
      requestQuery: requestQuery.trim(),
      deadlineDate
    });

    // Move application to CLARIFICATION_REQUESTED
    WorkflowService.transitionStage(
      applicationId,
      'CLARIFICATION_REQUESTED',
      user,
      'Clarification Notice Issued',
      requestQuery.trim()
    );

    // Notify institution
    db.addNotification({
      roleTarget: 'INSTITUTION',
      applicationId,
      title: 'Action Required: Clarification Notice Issued',
      message: `Scrutiny Officer ${user.name} has requested clarification for ${app.applicationNumber}. Response due by: ${deadlineDate.split('T')[0]}.`,
      severity: 'WARNING',
      linkUrl: `/applications/${applicationId}`
    });

    res.status(201).json({ clarification: clr });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create clarification' });
  }
});

// Respond to clarification (Institution journey)
workflowRouter.post('/clarification/:id/respond', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { remarks, responseDocumentId } = req.body;
    const user = req.user!;

    if (!remarks || remarks.trim().length < 5) {
      return res.status(400).json({ error: 'Remarks are required for clarification submission' });
    }

    const updated = db.respondToClarification(id, remarks.trim(), responseDocumentId);
    if (!updated) return res.status(404).json({ error: 'Clarification record not found' });

    const app = db.getApplicationById(updated.applicationId);
    if (app && app.currentStage === 'CLARIFICATION_REQUESTED') {
      WorkflowService.transitionStage(
        app.id,
        'CLARIFICATION_SUBMITTED',
        user,
        'Institution Clarification Response Submitted',
        remarks.trim()
      );
    }

    // Notify officer
    if (app?.assignedOfficerId) {
      db.addNotification({
        userId: app.assignedOfficerId,
        roleTarget: 'SCRUTINY_OFFICER',
        applicationId: updated.applicationId,
        title: 'Clarification Response Received',
        message: `Institution submitted response for ${app.applicationNumber}. Ready for re-scrutiny.`,
        severity: 'INFO',
        linkUrl: `/applications/${updated.applicationId}`
      });
    }

    res.json({ message: 'Clarification response recorded', clarification: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to submit clarification response' });
  }
});

// Record final statutory decision (Approved / Rejected)
workflowRouter.post('/decision', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const { applicationId, decision, remarks } = req.body;
    if (!applicationId || !decision) {
      return res.status(400).json({ error: 'applicationId and decision (APPROVED/REJECTED) are required' });
    }

    const user = req.user!;
    const updated = WorkflowService.recordFinalDecision(applicationId, decision, remarks, user);
    res.json({ message: `Decision recorded: ${decision}`, application: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to record decision' });
  }
});
