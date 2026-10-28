import { Application, ApplicationStage, UserRole } from '../db/schema';
import { db } from '../db/database';
import { runComplianceScrutiny } from '../rules/complianceRules';

const LEGAL_TRANSITIONS: Record<ApplicationStage, ApplicationStage[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['PRELIMINARY_SCRUTINY', 'SCRUTINY_ASSIGNED'],
  PRELIMINARY_SCRUTINY: ['SCRUTINY_ASSIGNED', 'UNDER_SCRUTINY'],
  SCRUTINY_ASSIGNED: ['UNDER_SCRUTINY', 'SCRUTINY_ASSIGNED'], // Can reassign
  UNDER_SCRUTINY: [
    'CLARIFICATION_REQUESTED',
    'TECHNICAL_REVIEW',
    'RECOMMENDED_FOR_APPROVAL',
    'RECOMMENDED_FOR_REJECTION',
    'ON_HOLD'
  ],
  CLARIFICATION_REQUESTED: ['CLARIFICATION_SUBMITTED', 'ON_HOLD'],
  CLARIFICATION_SUBMITTED: ['UNDER_SCRUTINY'],
  ON_HOLD: ['UNDER_SCRUTINY', 'CLARIFICATION_REQUESTED'],
  TECHNICAL_REVIEW: [
    'RECOMMENDED_FOR_APPROVAL',
    'RECOMMENDED_FOR_REJECTION',
    'CLARIFICATION_REQUESTED'
  ],
  RECOMMENDED_FOR_APPROVAL: ['APPROVED', 'REJECTED', 'TECHNICAL_REVIEW'],
  RECOMMENDED_FOR_REJECTION: ['REJECTED', 'APPROVED', 'TECHNICAL_REVIEW'],
  APPROVED: [],
  REJECTED: ['UNDER_SCRUTINY'] // On appeal
};

export class WorkflowService {
  public static canTransition(from: ApplicationStage, to: ApplicationStage): boolean {
    const allowed = LEGAL_TRANSITIONS[from] || [];
    return allowed.includes(to);
  }

  public static transitionStage(
    applicationId: string,
    targetStage: ApplicationStage,
    actor: { id: string; name: string; role: UserRole },
    actionName: string,
    comments?: string
  ): Application {
    const app = db.getApplicationById(applicationId);
    if (!app) throw new Error(`Application ${applicationId} not found`);

    const currentStage = app.currentStage;

    // Check transition validity
    if (!this.canTransition(currentStage, targetStage)) {
      throw new Error(
        `Illegal workflow transition: Cannot move application from '${currentStage}' to '${targetStage}'. Valid transitions from '${currentStage}' are: [${(LEGAL_TRANSITIONS[currentStage] || []).join(', ')}]`
      );
    }

    // Role authorization check
    if (actor.role === 'AUDITOR') {
      throw new Error('Unauthorized: Auditors have read-only access and cannot modify application stages or decisions.');
    }

    if (targetStage === 'APPROVED' || targetStage === 'REJECTED') {
      if (actor.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only an Administrator (Approval Bureau Director) can record a final statutory decision.');
      }
    }

    // Update application
    const updated = db.updateApplication(applicationId, {
      currentStage: targetStage,
      updatedAt: new Date().toISOString()
    });

    if (!updated) throw new Error('Failed to update application');

    // Add stage history
    db.addStageHistory({
      applicationId,
      fromStage: currentStage,
      toStage: targetStage,
      action: actionName,
      performedByUserId: actor.id,
      performedByName: actor.name,
      performedByRole: actor.role,
      comments
    });

    // Add audit log
    db.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: `STAGE_TRANSITION_${targetStage}`,
      entityType: 'APPLICATION',
      entityId: applicationId,
      details: `Transitioned application ${app.applicationNumber} from ${currentStage} to ${targetStage}. Action: ${actionName}. ${comments ? `Remarks: ${comments}` : ''}`
    });

    // Notify institution
    db.addNotification({
      roleTarget: 'INSTITUTION',
      applicationId,
      title: `Application Status Updated: ${targetStage.replace(/_/g, ' ')}`,
      message: `Application ${app.applicationNumber} has advanced to stage: ${targetStage.replace(/_/g, ' ')}. Action performed: ${actionName}.`,
      severity: targetStage === 'APPROVED' ? 'SUCCESS' : targetStage === 'REJECTED' ? 'CRITICAL' : 'INFO',
      linkUrl: `/applications/${applicationId}`
    });

    return updated;
  }

  public static submitApplication(
    applicationId: string,
    actor: { id: string; name: string; role: UserRole }
  ): Application {
    const app = db.getApplicationById(applicationId);
    if (!app) throw new Error(`Application ${applicationId} not found`);

    if (app.currentStage !== 'DRAFT') {
      throw new Error(`Application is in '${app.currentStage}' stage and has already been submitted.`);
    }

    const docs = db.getDocuments(applicationId);
    const mandatoryCategories = [
      'LAND_TITLE_DEED',
      'BUILDING_OCCUPANCY_CERTIFICATE',
      'FIRE_SAFETY_NOC',
      'FACULTY_CADRE_DECLARATION',
      'ANTI_RAGGING_AFFIDAVIT'
    ];
    const uploaded = new Set(docs.map(d => d.documentCategory));
    const missing = mandatoryCategories.filter(c => !uploaded.has(c as any));

    if (missing.length > 0) {
      throw new Error(
        `Cannot submit application: Mandatory documents missing (${missing.length}): ${missing.join(', ')}. Please upload all required certificates before submission.`
      );
    }

    // Set submitted timestamps & target date (7 days default)
    const now = new Date();
    const targetDate = new Date(now.getTime() + 7 * 86400000).toISOString();

    db.updateApplication(applicationId, {
      currentStage: 'SUBMITTED',
      submittedAt: now.toISOString(),
      targetCompletionDate: targetDate
    });

    // Add stage history
    db.addStageHistory({
      applicationId,
      fromStage: 'DRAFT',
      toStage: 'SUBMITTED',
      action: 'Institution Application Submission',
      performedByUserId: actor.id,
      performedByName: actor.name,
      performedByRole: actor.role,
      comments: 'Application formal submission completed by institution authorized representative.'
    });

    // Add audit log
    db.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'APPLICATION_SUBMITTED',
      entityType: 'APPLICATION',
      entityId: applicationId,
      details: `Application ${app.applicationNumber} formally submitted with ${docs.length} uploaded certificates.`
    });

    // Auto-run preliminary scrutiny
    try {
      runComplianceScrutiny(applicationId);
      // Advance to PRELIMINARY_SCRUTINY
      this.transitionStage(
        applicationId,
        'PRELIMINARY_SCRUTINY',
        { id: 'sys_engine', name: 'AICTE Automated Scrutiny Engine', role: 'ADMIN' },
        'Automated Preliminary Checks Executed',
        'Deterministic rule engine completed checks. Findings and compliance score computed.'
      );
    } catch (err) {
      console.warn('Auto preliminary scrutiny error:', err);
    }

    return db.getApplicationById(applicationId)!;
  }

  public static assignReviewer(
    applicationId: string,
    officerId: string,
    adminActor: { id: string; name: string; role: UserRole }
  ): Application {
    if (adminActor.role !== 'ADMIN') {
      throw new Error('Unauthorized: Only Administrators can allocate or reassign Scrutiny Officers.');
    }

    const officer = db.getUserById(officerId);
    if (!officer || officer.role !== 'SCRUTINY_OFFICER') {
      throw new Error('Invalid officer ID: User is not an active Scrutiny Officer.');
    }

    const app = db.getApplicationById(applicationId);
    if (!app) throw new Error('Application not found');

    const prevOfficerName = app.assignedOfficerName;
    const now = new Date();
    const target = new Date(now.getTime() + 7 * 86400000).toISOString();

    db.updateApplication(applicationId, {
      assignedOfficerId: officer.id,
      assignedOfficerName: officer.name,
      assignedDate: now.toISOString(),
      targetCompletionDate: target,
      currentStage: 'SCRUTINY_ASSIGNED'
    });

    // Record stage history
    db.addStageHistory({
      applicationId,
      fromStage: app.currentStage,
      toStage: 'SCRUTINY_ASSIGNED',
      action: prevOfficerName ? 'Reviewer Reassigned' : 'Reviewer Allocated',
      performedByUserId: adminActor.id,
      performedByName: adminActor.name,
      performedByRole: adminActor.role,
      comments: `Assigned to ${officer.name} (${officer.designation}). SLA Target: 7 days.`
    });

    // Audit log
    db.addAuditLog({
      actorId: adminActor.id,
      actorName: adminActor.name,
      actorRole: adminActor.role,
      action: 'REVIEWER_ASSIGNED',
      entityType: 'WORKFLOW',
      entityId: applicationId,
      details: `Assigned application ${app.applicationNumber} to ${officer.name} (${officer.email}). Target completion: ${target}`
    });

    // Notify officer
    db.addNotification({
      userId: officer.id,
      roleTarget: 'SCRUTINY_OFFICER',
      applicationId,
      title: 'New Scrutiny Case Assigned',
      message: `You have been allocated application ${app.applicationNumber} for Committee Scrutiny. Target SLA: 7 days.`,
      severity: 'INFO',
      linkUrl: `/applications/${applicationId}`
    });

    return db.getApplicationById(applicationId)!;
  }

  public static recordFinalDecision(
    applicationId: string,
    decision: 'APPROVED' | 'REJECTED',
    remarks: string,
    adminActor: { id: string; name: string; role: UserRole }
  ): Application {
    if (adminActor.role !== 'ADMIN') {
      throw new Error('Unauthorized: Final statutory decisions can only be authorized by an Administrator.');
    }

    if (!remarks || remarks.trim().length < 10) {
      throw new Error('Statutory decision requires substantive remarks (minimum 10 characters).');
    }

    const app = db.getApplicationById(applicationId);
    if (!app) throw new Error('Application not found');

    const targetStage: ApplicationStage = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';

    db.updateApplication(applicationId, {
      currentStage: targetStage,
      finalDecision: decision,
      finalDecisionDate: new Date().toISOString(),
      finalDecisionOfficerId: adminActor.id,
      finalDecisionRemarks: remarks,
      actualCompletionDate: new Date().toISOString()
    });

    db.addStageHistory({
      applicationId,
      fromStage: app.currentStage,
      toStage: targetStage,
      action: `Final Decision Recorded: ${decision}`,
      performedByUserId: adminActor.id,
      performedByName: adminActor.name,
      performedByRole: adminActor.role,
      comments: remarks
    });

    db.addAuditLog({
      actorId: adminActor.id,
      actorName: adminActor.name,
      actorRole: adminActor.role,
      action: `DECISION_${decision}`,
      entityType: 'APPLICATION',
      entityId: applicationId,
      details: `Recorded official decision: ${decision} for ${app.applicationNumber}. Remarks: ${remarks}`,
      justification: remarks
    });

    db.addNotification({
      roleTarget: 'INSTITUTION',
      applicationId,
      title: `Final AICTE Approval Decision: ${decision}`,
      message: `Application ${app.applicationNumber} has been ${decision} by the Approval Bureau. Remarks: ${remarks}`,
      severity: decision === 'APPROVED' ? 'SUCCESS' : 'CRITICAL',
      linkUrl: `/applications/${applicationId}`
    });

    return db.getApplicationById(applicationId)!;
  }
}
