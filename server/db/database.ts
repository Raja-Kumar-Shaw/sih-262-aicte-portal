import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSchema, AuditLog, User, Institution, Application, ApplicationDocument, ComplianceFinding, ComplianceRule, Programme, ApplicationStageHistory, ReviewComment, Clarification, Notification, SystemConfiguration } from './schema';
import { generateSeedData } from './seedData';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'aicte_portal.json');

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all arrays exist
        return {
          users: parsed.users || [],
          institutions: parsed.institutions || [],
          applications: parsed.applications || [],
          programmes: parsed.programmes || [],
          documents: parsed.documents || [],
          extractedFields: parsed.extractedFields || [],
          complianceRules: parsed.complianceRules || [],
          complianceFindings: parsed.complianceFindings || [],
          stageHistory: parsed.stageHistory || [],
          reviewComments: parsed.reviewComments || [],
          clarifications: parsed.clarifications || [],
          notifications: parsed.notifications || [],
          auditLogs: parsed.auditLogs || [],
          systemConfigurations: parsed.systemConfigurations || []
        };
      } catch (err) {
        console.error('Failed to parse aicte_portal.json, seeding fresh data...', err);
        return this.initAndSeed();
      }
    } else {
      return this.initAndSeed();
    }
  }

  private initAndSeed(): DatabaseSchema {
    const fresh = generateSeedData();
    this.persist(fresh);
    return fresh;
  }

  private persist(data: DatabaseSchema = this.data) {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public resetDatabase() {
    this.data = generateSeedData();
    this.persist();
    return { success: true, message: 'Database reset to default AICTE demonstration seed data' };
  }

  // --- Users ---
  public getUsers() {
    return this.data.users;
  }

  public getUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByUsername(username: string) {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  // --- Institutions ---
  public getInstitutions() {
    return this.data.institutions;
  }

  public getInstitutionById(id: string) {
    return this.data.institutions.find(i => i.id === id);
  }

  // --- Applications ---
  public getApplications(filters?: {
    stage?: string;
    institutionId?: string;
    assignedOfficerId?: string;
    applicationType?: string;
    search?: string;
    overdueOnly?: boolean;
  }) {
    let list = [...this.data.applications];

    if (filters) {
      if (filters.stage && filters.stage !== 'ALL') {
        list = list.filter(a => a.currentStage === filters.stage);
      }
      if (filters.institutionId) {
        list = list.filter(a => a.institutionId === filters.institutionId);
      }
      if (filters.assignedOfficerId) {
        list = list.filter(a => a.assignedOfficerId === filters.assignedOfficerId);
      }
      if (filters.applicationType && filters.applicationType !== 'ALL') {
        list = list.filter(a => a.applicationType === filters.applicationType);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(a => {
          const inst = this.getInstitutionById(a.institutionId);
          return (
            a.applicationNumber.toLowerCase().includes(q) ||
            (inst && inst.name.toLowerCase().includes(q)) ||
            (inst && inst.permanentInstituteId.toLowerCase().includes(q))
          );
        });
      }
      if (filters.overdueOnly) {
        const now = new Date().getTime();
        list = list.filter(a => {
          if (!a.targetCompletionDate || a.currentStage === 'APPROVED' || a.currentStage === 'REJECTED') return false;
          return new Date(a.targetCompletionDate).getTime() < now;
        });
      }
    }

    // Sort by latest updated
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getApplicationById(id: string) {
    return this.data.applications.find(a => a.id === id);
  }

  public createApplication(app: Partial<Application> & { institutionId: string }) {
    const id = `app_${Date.now()}`;
    const year = app.academicYear || '2025-26';
    const num = `AICTE/${year}/APP-${Math.floor(10000 + Math.random() * 90000)}`;

    const newApp: Application = {
      id,
      applicationNumber: num,
      institutionId: app.institutionId,
      academicYear: year,
      applicationType: app.applicationType || 'EXTENSION_OF_APPROVAL',
      currentStage: 'DRAFT',
      complianceScore: 0,
      criticalDeficiencyCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.applications.push(newApp);
    this.persist();
    return newApp;
  }

  public updateApplication(id: string, partial: Partial<Application>) {
    const index = this.data.applications.findIndex(a => a.id === id);
    if (index === -1) return null;

    this.data.applications[index] = {
      ...this.data.applications[index],
      ...partial,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return this.data.applications[index];
  }

  // --- Programmes ---
  public getProgrammes(applicationId: string) {
    return this.data.programmes.filter(p => p.applicationId === applicationId);
  }

  public addProgramme(prog: Omit<Programme, 'id'>) {
    const newProg: Programme = {
      id: `prog_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      ...prog
    };
    this.data.programmes.push(newProg);
    this.persist();
    return newProg;
  }

  // --- Documents ---
  public getDocuments(applicationId: string) {
    return this.data.documents.filter(d => d.applicationId === applicationId);
  }

  public getDocumentById(id: string) {
    return this.data.documents.find(d => d.id === id);
  }

  public addDocument(doc: Omit<ApplicationDocument, 'id' | 'uploadDate' | 'version'>) {
    const existing = this.data.documents.filter(d => d.applicationId === doc.applicationId && d.documentCategory === doc.documentCategory);
    const version = existing.length + 1;

    const newDoc: ApplicationDocument = {
      id: `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      uploadDate: new Date().toISOString(),
      version,
      ...doc
    };

    this.data.documents.push(newDoc);
    this.persist();
    return newDoc;
  }

  public updateDocument(id: string, partial: Partial<ApplicationDocument>) {
    const index = this.data.documents.findIndex(d => d.id === id);
    if (index === -1) return null;

    this.data.documents[index] = {
      ...this.data.documents[index],
      ...partial
    };
    this.persist();
    return this.data.documents[index];
  }

  // --- Extracted Fields ---
  public getExtractedFields(applicationId: string) {
    return this.data.extractedFields.filter(f => f.applicationId === applicationId);
  }

  public saveExtractedFields(fields: ExtractedField[]) {
    // Remove existing for those documents
    const docIds = new Set(fields.map(f => f.documentId));
    this.data.extractedFields = this.data.extractedFields.filter(f => !docIds.has(f.documentId));
    this.data.extractedFields.push(...fields);
    this.persist();
  }

  // --- Compliance Rules & Findings ---
  public getComplianceRules() {
    return this.data.complianceRules;
  }

  public updateComplianceRule(id: string, partial: Partial<ComplianceRule>) {
    const idx = this.data.complianceRules.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.data.complianceRules[idx] = { ...this.data.complianceRules[idx], ...partial };
    this.persist();
    return this.data.complianceRules[idx];
  }

  public getComplianceFindings(applicationId: string) {
    return this.data.complianceFindings.filter(f => f.applicationId === applicationId);
  }

  public saveComplianceFindings(applicationId: string, findings: ComplianceFinding[]) {
    // Replace findings for this application
    this.data.complianceFindings = this.data.complianceFindings.filter(f => f.applicationId !== applicationId);
    this.data.complianceFindings.push(...findings);

    // Update application score and deficiencies
    const criticalCount = findings.filter(f => f.severity === 'CRITICAL' && f.status === 'AUTOMATED_FAIL').length;
    const passedCount = findings.filter(f => f.status === 'AUTOMATED_PASS' || f.status === 'OVERRIDDEN' || f.status === 'RESOLVED').length;
    const totalCount = findings.length || 1;
    const score = Math.round((passedCount / totalCount) * 100);

    this.updateApplication(applicationId, {
      complianceScore: score,
      criticalDeficiencyCount: criticalCount
    });

    this.persist();
  }

  public overrideComplianceFinding(findingId: string, disposition: 'ACCEPTED_WITH_EXCEPTION' | 'CONFIRMED_DEFICIENCY', reason: string, officerId: string) {
    const idx = this.data.complianceFindings.findIndex(f => f.id === findingId);
    if (idx === -1) return null;

    const finding = this.data.complianceFindings[idx];
    const prevStatus = finding.status;

    finding.reviewerDisposition = disposition;
    finding.reviewerOverrideReason = reason;
    finding.overriddenByOfficerId = officerId;
    finding.overriddenAt = new Date().toISOString();
    if (disposition === 'ACCEPTED_WITH_EXCEPTION') {
      finding.status = 'OVERRIDDEN';
    } else {
      finding.status = 'AUTOMATED_FAIL';
    }

    // Recalculate score
    const all = this.getComplianceFindings(finding.applicationId);
    const criticalCount = all.filter(f => f.severity === 'CRITICAL' && f.status === 'AUTOMATED_FAIL').length;
    const passedCount = all.filter(f => f.status === 'AUTOMATED_PASS' || f.status === 'OVERRIDDEN' || f.status === 'RESOLVED').length;
    const score = Math.round((passedCount / (all.length || 1)) * 100);

    this.updateApplication(finding.applicationId, {
      complianceScore: score,
      criticalDeficiencyCount: criticalCount
    });

    this.persist();
    return finding;
  }

  // --- Stage History ---
  public getStageHistory(applicationId: string) {
    return this.data.stageHistory
      .filter(h => h.applicationId === applicationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public addStageHistory(history: Omit<ApplicationStageHistory, 'id' | 'timestamp'>) {
    const newHistory: ApplicationStageHistory = {
      id: `sh_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...history
    };
    this.data.stageHistory.push(newHistory);
    this.persist();
    return newHistory;
  }

  // --- Review Comments ---
  public getReviewComments(applicationId: string) {
    return this.data.reviewComments
      .filter(c => c.applicationId === applicationId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addReviewComment(comment: Omit<ReviewComment, 'id' | 'timestamp'>) {
    const newComment: ReviewComment = {
      id: `rc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...comment
    };
    this.data.reviewComments.push(newComment);
    this.persist();
    return newComment;
  }

  // --- Clarifications ---
  public getClarifications(applicationId: string) {
    return this.data.clarifications
      .filter(c => c.applicationId === applicationId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  public createClarification(clarification: Omit<Clarification, 'id' | 'status' | 'requestedAt'>) {
    const newClr: Clarification = {
      id: `clr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'PENDING_INSTITUTION',
      requestedAt: new Date().toISOString(),
      ...clarification
    };
    this.data.clarifications.push(newClr);
    this.persist();
    return newClr;
  }

  public respondToClarification(id: string, remarks: string, documentId?: string) {
    const idx = this.data.clarifications.findIndex(c => c.id === id);
    if (idx === -1) return null;

    this.data.clarifications[idx] = {
      ...this.data.clarifications[idx],
      responseRemarks: remarks,
      responseDocumentId: documentId,
      status: 'SUBMITTED',
      respondedAt: new Date().toISOString()
    };
    this.persist();
    return this.data.clarifications[idx];
  }

  // --- Notifications ---
  public getNotifications(userId?: string, role?: string) {
    let list = [...this.data.notifications];
    if (userId) {
      list = list.filter(n => n.userId === userId || !n.userId || (role && n.roleTarget === role));
    } else if (role) {
      list = list.filter(n => !n.roleTarget || n.roleTarget === role);
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public markNotificationRead(id: string) {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.persist();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(userId?: string, role?: string) {
    this.data.notifications.forEach(n => {
      if (!userId || n.userId === userId || (role && n.roleTarget === role)) {
        n.isRead = true;
      }
    });
    this.persist();
    return true;
  }

  public addNotification(notif: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) {
    const newNotif: Notification = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      isRead: false,
      timestamp: new Date().toISOString(),
      ...notif
    };
    this.data.notifications.unshift(newNotif);
    this.persist();
    return newNotif;
  }

  // --- Audit Logs (Cryptographic Hash Chaining) ---
  public getAuditLogs() {
    return [...this.data.auditLogs].sort((a, b) => b.index - a.index);
  }

  public addAuditLog(entry: {
    actorId: string;
    actorName: string;
    actorRole: any;
    action: string;
    entityType: any;
    entityId: string;
    details: string;
    justification?: string;
  }) {
    const prevHash = this.data.auditLogs.length === 0
      ? '0000000000000000000000000000000000000000000000000000000000000000'
      : this.data.auditLogs[this.data.auditLogs.length - 1].hash;

    const index = this.data.auditLogs.length + 1;
    const timestamp = new Date().toISOString();
    const payload = `${index}|${timestamp}|${entry.actorId}|${entry.action}|${entry.entityType}|${entry.entityId}|${entry.details}|${entry.justification || ''}|${prevHash}`;
    const hash = crypto.createHash('sha256').update(payload).digest('hex');

    const log: AuditLog = {
      id: `aud_${index}_${Date.now()}`,
      index,
      timestamp,
      actorId: entry.actorId,
      actorName: entry.actorName,
      actorRole: entry.actorRole,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
      justification: entry.justification,
      previousHash: prevHash,
      hash
    };

    this.data.auditLogs.push(log);
    this.persist();
    return log;
  }

  public verifyAuditChain() {
    if (this.data.auditLogs.length === 0) {
      return { isValid: true, checkedBlocks: 0, message: 'Audit chain is empty' };
    }

    let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < this.data.auditLogs.length; i++) {
      const block = this.data.auditLogs[i];

      // 1. Verify previous hash link
      if (block.previousHash !== previousHash) {
        return {
          isValid: false,
          checkedBlocks: i,
          corruptedBlockIndex: block.index,
          message: `Hash link mismatch at block #${block.index}: expected previous hash ${previousHash}, found ${block.previousHash}`
        };
      }

      // 2. Recalculate block hash
      const payload = `${block.index}|${block.timestamp}|${block.actorId}|${block.action}|${block.entityType}|${block.entityId}|${block.details}|${block.justification || ''}|${block.previousHash}`;
      const expectedHash = crypto.createHash('sha256').update(payload).digest('hex');

      if (block.hash !== expectedHash) {
        return {
          isValid: false,
          checkedBlocks: i,
          corruptedBlockIndex: block.index,
          message: `Digest checksum failed at block #${block.index}: computed ${expectedHash}, stored ${block.hash}`
        };
      }

      previousHash = block.hash;
    }

    return {
      isValid: true,
      checkedBlocks: this.data.auditLogs.length,
      genesisHash: this.data.auditLogs[0].hash.substring(0, 16) + '...',
      latestBlockHash: previousHash.substring(0, 16) + '...',
      message: `Audit chain cryptographically verified across all ${this.data.auditLogs.length} blocks with zero tampering.`
    };
  }

  // --- System Configurations ---
  public getSystemConfigurations() {
    return this.data.systemConfigurations;
  }

  public updateSystemConfiguration(key: string, value: string, userId: string) {
    const cfg = this.data.systemConfigurations.find(c => c.key === key);
    if (!cfg) return null;

    cfg.value = value;
    cfg.updatedAt = new Date().toISOString();
    cfg.updatedBy = userId;
    this.persist();
    return cfg;
  }
}

export const db = new Database();
