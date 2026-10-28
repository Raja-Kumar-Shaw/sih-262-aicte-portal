import { Router } from 'express';
import { db } from '../db/database';
import { authenticate } from './middleware';
import { DeadlineService } from '../services/deadlineService';

export const analyticsRouter = Router();

analyticsRouter.get('/overview', authenticate, (req, res) => {
  try {
    const apps = db.getApplications();
    const institutions = db.getInstitutions();
    const findings = db.getApplications().flatMap(a => db.getComplianceFindings(a.id));
    const pendency = DeadlineService.getPendencyOverview();
    const bottlenecks = DeadlineService.getBottleneckAnalysis();

    // 1. Applications by Stage
    const stageCounts: Record<string, number> = {};
    apps.forEach(a => {
      stageCounts[a.currentStage] = (stageCounts[a.currentStage] || 0) + 1;
    });

    const byStage = Object.entries(stageCounts).map(([stage, count]) => ({
      stage,
      label: stage.replace(/_/g, ' '),
      count
    }));

    // 2. Applications by Type
    const typeCounts: Record<string, number> = {};
    apps.forEach(a => {
      typeCounts[a.applicationType] = (typeCounts[a.applicationType] || 0) + 1;
    });

    const byType = Object.entries(typeCounts).map(([type, count]) => ({
      type,
      label: type.replace(/_/g, ' '),
      count
    }));

    // 3. Applications by Region
    const regionCounts: Record<string, number> = {};
    apps.forEach(a => {
      const inst = institutions.find(i => i.id === a.institutionId);
      const reg = inst ? inst.region : 'UNKNOWN';
      regionCounts[reg] = (regionCounts[reg] || 0) + 1;
    });

    const byRegion = Object.entries(regionCounts).map(([region, count]) => ({
      region,
      count
    }));

    // 4. Compliance Findings by Severity
    const severityCounts = {
      CRITICAL: findings.filter(f => f.severity === 'CRITICAL').length,
      HIGH: findings.filter(f => f.severity === 'HIGH').length,
      MEDIUM: findings.filter(f => f.severity === 'MEDIUM').length,
      LOW: findings.filter(f => f.severity === 'LOW').length
    };

    // 5. Findings Status
    const findingStatusCounts = {
      PASS: findings.filter(f => f.status === 'AUTOMATED_PASS').length,
      FAIL: findings.filter(f => f.status === 'AUTOMATED_FAIL').length,
      WARNING: findings.filter(f => f.status === 'WARNING').length,
      OVERRIDDEN: findings.filter(f => f.status === 'OVERRIDDEN').length
    };

    // 6. Reviewer Workload
    const officers = db.getUsers().filter(u => u.role === 'SCRUTINY_OFFICER');
    const reviewerWorkload = officers.map(off => {
      const assigned = apps.filter(a => a.assignedOfficerId === off.id);
      const pending = assigned.filter(a => a.currentStage !== 'APPROVED' && a.currentStage !== 'REJECTED');
      const overdue = pending.filter(a => {
        if (!a.targetCompletionDate) return false;
        return new Date(a.targetCompletionDate).getTime() < Date.now();
      });

      return {
        officerId: off.id,
        officerName: off.name,
        designation: off.designation,
        totalAssigned: assigned.length,
        activePending: pending.length,
        overdueCount: overdue.length
      };
    });

    res.json({
      summary: {
        totalApplications: apps.length,
        underReviewCount: pendency.underReviewCount,
        overdueCount: pendency.overdueCount,
        approvedCount: apps.filter(a => a.currentStage === 'APPROVED').length,
        rejectedCount: apps.filter(a => a.currentStage === 'REJECTED').length,
        draftCount: apps.filter(a => a.currentStage === 'DRAFT').length
      },
      byStage,
      byType,
      byRegion,
      severityCounts,
      findingStatusCounts,
      reviewerWorkload,
      bottlenecks,
      overdueList: pendency.overdueList
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate analytics' });
  }
});
