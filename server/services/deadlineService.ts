import { db } from '../db/database';
import { Application, ApplicationStage } from '../db/schema';

export interface ApplicationDeadlineMetrics {
  applicationId: string;
  applicationNumber: string;
  institutionName: string;
  currentStage: ApplicationStage;
  submittedAt?: string;
  targetCompletionDate?: string;
  daysInCurrentStage: number;
  daysRemaining: number;
  isOverdue: boolean;
  overdueDays: number;
  urgencyLevel: 'CRITICAL_OVERDUE' | 'NEAR_DEADLINE' | 'ON_TRACK' | 'COMPLETED';
}

export interface BottleneckStageInfo {
  stage: ApplicationStage;
  stageName: string;
  pendingCount: number;
  averageDaysInStage: number;
  overdueCount: number;
  bottleneckSeverity: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
}

export class DeadlineService {
  public static calculateApplicationMetrics(app: Application): ApplicationDeadlineMetrics {
    const inst = db.getInstitutionById(app.institutionId);
    const now = new Date().getTime();

    // Calculate days in current stage
    const stageHistory = db.getStageHistory(app.id);
    const lastTransition = stageHistory.length > 0 ? stageHistory[stageHistory.length - 1] : null;
    const stageEntryTime = lastTransition ? new Date(lastTransition.timestamp).getTime() : new Date(app.updatedAt).getTime();
    const daysInCurrentStage = Math.max(0, Math.round((now - stageEntryTime) / (1000 * 60 * 60 * 24)));

    let daysRemaining = 0;
    let isOverdue = false;
    let overdueDays = 0;
    let urgencyLevel: ApplicationDeadlineMetrics['urgencyLevel'] = 'ON_TRACK';

    if (app.currentStage === 'APPROVED' || app.currentStage === 'REJECTED') {
      urgencyLevel = 'COMPLETED';
    } else if (app.targetCompletionDate) {
      const targetTime = new Date(app.targetCompletionDate).getTime();
      const diffMs = targetTime - now;
      daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffMs < 0) {
        isOverdue = true;
        overdueDays = Math.abs(daysRemaining);
        urgencyLevel = 'CRITICAL_OVERDUE';
      } else if (daysRemaining <= 2) {
        urgencyLevel = 'NEAR_DEADLINE';
      } else {
        urgencyLevel = 'ON_TRACK';
      }
    }

    return {
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      institutionName: inst ? inst.name : 'Unknown Institution',
      currentStage: app.currentStage,
      submittedAt: app.submittedAt,
      targetCompletionDate: app.targetCompletionDate,
      daysInCurrentStage,
      daysRemaining,
      isOverdue,
      overdueDays,
      urgencyLevel
    };
  }

  public static getPendencyOverview() {
    const apps = db.getApplications();
    const metrics = apps.map(a => this.calculateApplicationMetrics(a));

    const totalApplications = apps.length;
    const overdueApplications = metrics.filter(m => m.isOverdue);
    const nearDeadlineApplications = metrics.filter(m => m.urgencyLevel === 'NEAR_DEADLINE');
    const underReviewApplications = metrics.filter(m => m.currentStage !== 'APPROVED' && m.currentStage !== 'REJECTED' && m.currentStage !== 'DRAFT');

    return {
      totalApplications,
      underReviewCount: underReviewApplications.length,
      overdueCount: overdueApplications.length,
      nearDeadlineCount: nearDeadlineApplications.length,
      completedCount: apps.filter(a => a.currentStage === 'APPROVED' || a.currentStage === 'REJECTED').length,
      overdueList: overdueApplications.sort((a, b) => b.overdueDays - a.overdueDays),
      metrics
    };
  }

  public static getBottleneckAnalysis(): BottleneckStageInfo[] {
    const apps = db.getApplications();
    const stageGroups: Partial<Record<ApplicationStage, Application[]>> = {};

    apps.forEach(a => {
      if (!stageGroups[a.currentStage]) {
        stageGroups[a.currentStage] = [];
      }
      stageGroups[a.currentStage]!.push(a);
    });

    const bottlenecks: BottleneckStageInfo[] = [];

    const STAGES_TO_EVALUATE: ApplicationStage[] = [
      'PRELIMINARY_SCRUTINY',
      'SCRUTINY_ASSIGNED',
      'UNDER_SCRUTINY',
      'CLARIFICATION_REQUESTED',
      'TECHNICAL_REVIEW'
    ];

    STAGES_TO_EVALUATE.forEach(stage => {
      const list = stageGroups[stage] || [];
      const count = list.length;
      if (count === 0) return;

      const metrics = list.map(a => this.calculateApplicationMetrics(a));
      const totalDays = metrics.reduce((sum, m) => sum + m.daysInCurrentStage, 0);
      const avgDays = Math.round((totalDays / count) * 10) / 10;
      const overdue = metrics.filter(m => m.isOverdue).length;

      let severity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      let explanation = 'Turnaround times within configured demonstration SLA.';

      if (overdue > 0 || avgDays > 7) {
        severity = 'HIGH';
        explanation = `High bottleneck alert: ${overdue} application(s) overdue. Average dwell time is ${avgDays} days, exceeding the 7-day threshold.`;
      } else if (avgDays > 4 || count >= 3) {
        severity = 'MEDIUM';
        explanation = `Moderate queue buildup: ${count} applications queued with ${avgDays} days average dwell time.`;
      }

      bottlenecks.push({
        stage,
        stageName: stage.replace(/_/g, ' '),
        pendingCount: count,
        averageDaysInStage: avgDays,
        overdueCount: overdue,
        bottleneckSeverity: severity,
        explanation
      });
    });

    return bottlenecks.sort((a, b) => (b.bottleneckSeverity === 'HIGH' ? 1 : 0) - (a.bottleneckSeverity === 'HIGH' ? 1 : 0));
  }
}
