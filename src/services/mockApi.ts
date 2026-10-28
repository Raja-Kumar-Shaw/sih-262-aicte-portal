import seedData from '../../data/aicte_portal.json';

const STORAGE_KEY = 'aicte_portal_db_v1';

function getDb(): any {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  const cloned = JSON.parse(JSON.stringify(seedData));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cloned));
  return cloned;
}

function saveDb(db: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

export function handleMockRequest<T>(endpoint: string, options: RequestInit = {}): T {
  const db = getDb();
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Clean endpoint query string
  const [path, queryString] = endpoint.split('?');
  const params = new URLSearchParams(queryString || '');

  // 1. Auth
  if (path === '/auth/login') {
    const user = db.users.find((u: any) => u.username === body.username) || db.users[0];
    return { token: 'mock_jwt_token', user } as T;
  }
  if (path === '/auth/demo-switch') {
    let user = null;
    if (body.username) {
      user = db.users.find((u: any) => u.username === body.username);
    }
    if (!user && body.role) {
      user = db.users.find((u: any) => u.role === body.role);
    }
    if (!user) user = db.users[0];
    return { token: 'mock_jwt_token', user } as T;
  }
  if (path === '/auth/demo-accounts') {
    return { accounts: db.users } as T;
  }

  // 2. Applications
  if (path === '/applications' && method === 'GET') {
    let apps = [...db.applications];
    const status = params.get('status');
    const academicYear = params.get('academicYear');
    const search = params.get('search');
    if (status) apps = apps.filter(a => a.status === status);
    if (academicYear) apps = apps.filter(a => a.academicYear === academicYear);
    if (search) {
      const q = search.toLowerCase();
      apps = apps.filter(a => a.id.toLowerCase().includes(q) || a.institutionId.toLowerCase().includes(q));
    }
    return { applications: apps, count: apps.length } as T;
  }

  const appDetailMatch = path.match(/^\/applications\/([^/]+)$/);
  if (appDetailMatch && method === 'GET') {
    const appId = appDetailMatch[1];
    const app = db.applications.find((a: any) => a.id === appId) || db.applications[0];
    const inst = db.institutions.find((i: any) => i.id === app.institutionId);
    const docs = db.documents.filter((d: any) => d.applicationId === appId);
    const stageHistory = (db.stageHistory || []).filter((s: any) => s.applicationId === appId);
    const findings = (db.complianceFindings || []).filter((f: any) => f.applicationId === appId);
    const clarifications = (db.clarifications || []).filter((c: any) => c.applicationId === appId);
    const comments = (db.reviewComments || []).filter((r: any) => r.applicationId === appId);

    return {
      application: app,
      institution: inst,
      documents: docs,
      stageHistory,
      findings,
      clarifications,
      comments
    } as T;
  }

  if (path === '/applications' && method === 'POST') {
    const newApp = {
      id: `APP-2026-${Math.floor(100 + Math.random() * 900)}`,
      institutionId: body.institutionId || 'inst_dtu',
      applicationType: body.applicationType || 'EXTENSION_OF_APPROVAL',
      academicYear: '2025-2026',
      status: 'DRAFT',
      currentStage: 'SUBMISSION',
      submittedAt: null,
      assignedOfficerId: null,
      lastUpdatedAt: new Date().toISOString(),
      deficiencyCount: 0,
      slaDeadline: null,
      isSlaBreached: false,
      overallComplianceStatus: 'NOT_EVALUATED'
    };
    db.applications.unshift(newApp);
    saveDb(db);
    return { application: newApp } as T;
  }

  const submitMatch = path.match(/^\/applications\/([^/]+)\/submit$/);
  if (submitMatch && method === 'POST') {
    const appId = submitMatch[1];
    const app = db.applications.find((a: any) => a.id === appId);
    if (app) {
      app.status = 'UNDER_SCRUTINY';
      app.currentStage = 'DOCUMENT_SCRUTINY';
      app.submittedAt = new Date().toISOString();
      saveDb(db);
    }
    return { message: 'Application submitted successfully', application: app } as T;
  }

  const scrutinyMatch = path.match(/^\/applications\/([^/]+)\/run-scrutiny$/);
  if (scrutinyMatch && method === 'POST') {
    return {
      result: {
        totalRules: 12,
        passedRules: 10,
        flaggedRules: 2,
        findingsCount: 2
      }
    } as T;
  }

  // 3. Documents
  if (path === '/documents/upload' && method === 'POST') {
    const newDoc = {
      id: `doc_${Date.now()}`,
      applicationId: 'APP-101-DTU',
      documentType: 'FIRE_SAFETY_CERTIFICATE',
      filename: 'uploaded_document.pdf',
      fileSize: 1024 * 512,
      mimeType: 'application/pdf',
      ocrExtractedText: 'Sample verified certificate content extracted via AICTE intelligence scanner.',
      ocrConfidence: 98.4,
      verificationStatus: 'AUTO_VERIFIED',
      uploadedAt: new Date().toISOString()
    };
    db.documents.unshift(newDoc);
    saveDb(db);
    return {
      message: 'Document uploaded and analyzed successfully',
      document: newDoc,
      extractedFields: [
        { fieldName: 'issuingAuthority', fieldValue: 'Delhi Fire Service', confidenceScore: 99.1, status: 'VERIFIED' }
      ]
    } as T;
  }

  const docVerifyMatch = path.match(/^\/documents\/([^/]+)\/verify$/);
  if (docVerifyMatch && method === 'PUT') {
    const docId = docVerifyMatch[1];
    const doc = db.documents.find((d: any) => d.id === docId);
    if (doc) {
      doc.verificationStatus = body.status || 'MANUALLY_VERIFIED';
      saveDb(db);
    }
    return { document: doc } as T;
  }

  // 4. Compliance
  if (path === '/compliance/rules' && method === 'GET') {
    return { rules: db.complianceRules } as T;
  }
  const findingsMatch = path.match(/^\/compliance\/findings\/([^/]+)$/);
  if (findingsMatch && method === 'GET') {
    const appId = findingsMatch[1];
    const findings = (db.complianceFindings || []).filter((f: any) => f.applicationId === appId);
    return { findings } as T;
  }
  const overrideMatch = path.match(/^\/compliance\/findings\/([^/]+)\/override$/);
  if (overrideMatch && method === 'POST') {
    const findingId = overrideMatch[1];
    const finding = (db.complianceFindings || []).find((f: any) => f.id === findingId);
    if (finding) {
      finding.disposition = body.disposition || 'OVERRIDDEN';
      finding.reviewerJustification = body.justification;
      saveDb(db);
    }
    return { message: 'Finding updated', finding } as T;
  }

  // 5. Workflow
  if (path === '/workflow/transition' && method === 'POST') {
    const app = db.applications.find((a: any) => a.id === body.applicationId);
    if (app) {
      app.currentStage = body.targetStage;
      saveDb(db);
    }
    return { message: 'Stage transitioned', application: app } as T;
  }
  if (path === '/workflow/assign' && method === 'POST') {
    const app = db.applications.find((a: any) => a.id === body.applicationId);
    if (app) {
      app.assignedOfficerId = body.officerId;
      saveDb(db);
    }
    return { message: 'Officer assigned', application: app } as T;
  }
  if (path === '/workflow/comments' && method === 'POST') {
    const newComment = {
      id: `comm_${Date.now()}`,
      applicationId: body.applicationId,
      authorName: 'Reviewer',
      authorRole: 'SCRUTINY_OFFICER',
      category: body.category || 'GENERAL',
      comment: body.comment,
      createdAt: new Date().toISOString()
    };
    (db.reviewComments = db.reviewComments || []).push(newComment);
    saveDb(db);
    return { comment: newComment } as T;
  }
  if (path === '/workflow/clarification' && method === 'POST') {
    const newClar = {
      id: `clar_${Date.now()}`,
      applicationId: body.applicationId,
      requestQuery: body.requestQuery,
      status: 'ISSUED',
      issuedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 7 * 86400000).toISOString()
    };
    (db.clarifications = db.clarifications || []).push(newClar);
    saveDb(db);
    return { clarification: newClar } as T;
  }
  const clarRespondMatch = path.match(/^\/workflow\/clarification\/([^/]+)\/respond$/);
  if (clarRespondMatch && method === 'POST') {
    const clarId = clarRespondMatch[1];
    const clar = (db.clarifications || []).find((c: any) => c.id === clarId);
    if (clar) {
      clar.status = 'RESPONDED';
      clar.applicantResponseRemarks = body.remarks;
      clar.respondedAt = new Date().toISOString();
      saveDb(db);
    }
    return { message: 'Clarification responded', clarification: clar } as T;
  }
  if (path === '/workflow/decision' && method === 'POST') {
    const app = db.applications.find((a: any) => a.id === body.applicationId);
    if (app) {
      app.status = body.decision;
      app.currentStage = 'COMPLETED';
      saveDb(db);
    }
    return { message: 'Decision recorded', application: app } as T;
  }

  // 6. Analytics Overview
  if (path === '/analytics/overview') {
    const apps = db.applications || [];
    return {
      kpis: {
        totalApplications: apps.length,
        approvedCount: apps.filter((a: any) => a.status === 'APPROVED').length,
        rejectedCount: apps.filter((a: any) => a.status === 'REJECTED').length,
        pendingScrutiny: apps.filter((a: any) => a.status === 'UNDER_SCRUTINY').length,
        clarificationsPending: (db.clarifications || []).filter((c: any) => c.status === 'ISSUED').length,
        slaBreachedCount: apps.filter((a: any) => a.isSlaBreached).length
      },
      stageDistribution: [
        { stage: 'DOCUMENT_SCRUTINY', count: 2 },
        { stage: 'HEARING_COMMITTEE', count: 1 },
        { stage: 'COMPLETED', count: 3 }
      ],
      regionalMetrics: [
        { region: 'Northern', total: 4, withinSla: 3, breached: 1, avgDays: 6.2 },
        { region: 'Western', total: 3, withinSla: 3, breached: 0, avgDays: 5.1 },
        { region: 'Southern', total: 2, withinSla: 2, breached: 0, avgDays: 4.8 }
      ],
      aiComplianceStats: {
        totalScannedDocuments: (db.documents || []).length,
        averageConfidence: 97.4,
        autoPassedRules: 34,
        flaggedDeficiencies: 6,
        humanOverrides: 2
      }
    } as T;
  }

  // 7. Audit
  if (path === '/audit' && method === 'GET') {
    return {
      totalBlocks: (db.auditLogs || []).length,
      auditLogs: db.auditLogs || []
    } as T;
  }
  if (path === '/audit/verify' && method === 'POST') {
    return {
      isValid: true,
      checkedBlocks: (db.auditLogs || []).length,
      genesisHash: '0000000000000000000000000000000000000000000000000000000000000000',
      latestBlockHash: db.auditLogs?.[db.auditLogs.length - 1]?.blockHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      message: 'Cryptographic SHA-256 chain fully verified. Zero discrepancies across all ledger blocks.'
    } as T;
  }
  if (path === '/audit/configurations') {
    return { configurations: db.systemConfigurations || [] } as T;
  }

  // 8. Notifications
  if (path === '/notifications' && method === 'GET') {
    const notifs = db.notifications || [];
    return {
      notifications: notifs,
      unreadCount: notifs.filter((n: any) => !n.isRead).length
    } as T;
  }
  const notifReadMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (notifReadMatch && method === 'PUT') {
    const nid = notifReadMatch[1];
    const n = (db.notifications || []).find((item: any) => item.id === nid);
    if (n) {
      n.isRead = true;
      saveDb(db);
    }
    return { success: true } as T;
  }
  if (path === '/notifications/read-all' && method === 'POST') {
    (db.notifications || []).forEach((item: any) => (item.isRead = true));
    saveDb(db);
    return { success: true } as T;
  }

  // Fallback generic response
  return {} as T;
}
