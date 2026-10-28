export type UserRole = 'INSTITUTION' | 'SCRUTINY_OFFICER' | 'ADMIN' | 'AUDITOR';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  designation: string;
  institutionId?: string; // If INSTITUTION role
  department?: string;
  region?: string;
  createdAt: string;
}

export interface Institution {
  id: string;
  permanentInstituteId: string; // e.g. "1-10974531201"
  name: string;
  trustName: string;
  category: 'GOVERNMENT' | 'GOVERNMENT_AIDED' | 'SELF_FINANCING' | 'DEEMED_UNIVERSITY';
  establishmentYear: number;
  state: string;
  district: string;
  region: 'NORTHERN' | 'WESTERN' | 'SOUTHERN' | 'EASTERN' | 'CENTRAL' | 'SOUTH_WESTERN' | 'NORTH_WESTERN';
  address: string;
  pincode: string;
  principalName: string;
  principalEmail: string;
  principalPhone: string;
  landAreaAcres: number;
  totalBuiltUpAreaSqM: number;
  naacGrade?: string;
  nbaAccredited: boolean;
  createdAt: string;
}

export type ApplicationType = 
  | 'EXTENSION_OF_APPROVAL' 
  | 'NEW_INSTITUTION' 
  | 'INCREASE_IN_INTAKE' 
  | 'NEW_PROGRAMME_COURSE' 
  | 'NRI_OCI_SUPERNUMERARY';

export type ApplicationStage = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PRELIMINARY_SCRUTINY'
  | 'SCRUTINY_ASSIGNED'
  | 'UNDER_SCRUTINY'
  | 'CLARIFICATION_REQUESTED'
  | 'CLARIFICATION_SUBMITTED'
  | 'TECHNICAL_REVIEW'
  | 'RECOMMENDED_FOR_APPROVAL'
  | 'RECOMMENDED_FOR_REJECTION'
  | 'APPROVED'
  | 'REJECTED'
  | 'ON_HOLD';

export interface Programme {
  id: string;
  applicationId: string;
  programmeType: 'ENGINEERING_AND_TECHNOLOGY' | 'MANAGEMENT' | 'PHARMACY' | 'APPLIED_ARTS' | 'ARCHITECTURE';
  courseName: string; // e.g. "Computer Science & Engineering"
  level: 'UG' | 'PG' | 'DIPLOMA';
  durationYears: number;
  existingIntake: number;
  proposedIntake: number;
  nbaAccredited: boolean;
  facultyCount: number;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentCategory: 
    | 'LAND_TITLE_DEED'
    | 'BUILDING_PLAN_APPROVAL'
    | 'BUILDING_OCCUPANCY_CERTIFICATE'
    | 'FIRE_SAFETY_NOC'
    | 'STRUCTURAL_STABILITY_CERTIFICATE'
    | 'FACULTY_CADRE_DECLARATION'
    | 'AUDITED_FINANCIAL_STATEMENT'
    | 'ANTI_RAGGING_AFFIDAVIT'
    | 'BARRIER_FREE_ACCESSIBILITY_CERT';
  title: string;
  originalFilename: string;
  storagePath: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadDate: string;
  uploadedByUserId: string;
  validityExpiryDate?: string;
  status: 'PENDING_EXTRACTION' | 'EXTRACTED' | 'NEEDS_REVIEW' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  verificationNotes?: string;
  version: number;
}

export interface ExtractedField {
  id: string;
  documentId: string;
  applicationId: string;
  fieldName: string;
  extractedValue: string;
  expectedValue?: string;
  confidenceScore: number; // 0.0 to 1.0
  pageNumber: number;
  isMatch: boolean;
  extractedAt: string;
}

export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type FindingStatus = 'AUTOMATED_FAIL' | 'AUTOMATED_PASS' | 'WARNING' | 'OVERRIDDEN' | 'CLARIFICATION_PENDING' | 'RESOLVED';

export interface ComplianceRule {
  id: string;
  ruleCode: string; // e.g. "CR-LAND-01"
  name: string;
  description: string;
  aphClauseRef: string; // e.g. "APH 2024-27 Clause 7.1.1"
  category: 'INFRASTRUCTURE' | 'FACULTY_RATIO' | 'REGULATORY_NOC' | 'ACADEMIC_ACCREDITATION' | 'STATUTORY_DECLARATION';
  severity: FindingSeverity;
  requiredEvidenceDoc: string;
  isActive: boolean;
}

export interface ComplianceFinding {
  id: string;
  applicationId: string;
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  aphClauseRef: string;
  severity: FindingSeverity;
  status: FindingStatus;
  explanation: string;
  evidenceSource: string; // e.g. "Fire Safety NOC (Page 1, Paragraph 3)"
  evidenceDocId?: string;
  confidenceScore: number;
  recommendedAction: string;
  reviewerDisposition?: 'PENDING' | 'ACCEPTED_WITH_EXCEPTION' | 'CONFIRMED_DEFICIENCY' | 'RECTIFIED';
  reviewerOverrideReason?: string;
  overriddenByOfficerId?: string;
  overriddenAt?: string;
  createdAt: string;
}

export interface Application {
  id: string;
  applicationNumber: string; // e.g. "AICTE/2025-26/APP-84920"
  institutionId: string;
  academicYear: string; // e.g. "2025-26"
  applicationType: ApplicationType;
  currentStage: ApplicationStage;
  submittedAt?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  assignedDate?: string;
  targetCompletionDate?: string;
  actualCompletionDate?: string;
  complianceScore: number; // 0 to 100
  criticalDeficiencyCount: number;
  holdReason?: string;
  finalDecision?: 'APPROVED' | 'REJECTED';
  finalDecisionDate?: string;
  finalDecisionOfficerId?: string;
  finalDecisionRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationStageHistory {
  id: string;
  applicationId: string;
  fromStage: ApplicationStage;
  toStage: ApplicationStage;
  action: string;
  performedByUserId: string;
  performedByName: string;
  performedByRole: UserRole;
  comments?: string;
  timestamp: string;
}

export interface ReviewComment {
  id: string;
  applicationId: string;
  officerId: string;
  officerName: string;
  category: 'GENERAL' | 'INFRASTRUCTURE' | 'DOCUMENT' | 'COMPLIANCE' | 'RECOMMENDATION';
  comment: string;
  timestamp: string;
}

export interface Clarification {
  id: string;
  applicationId: string;
  officerId: string;
  officerName: string;
  requestedFields: string[];
  requestQuery: string;
  deadlineDate: string;
  responseRemarks?: string;
  responseDocumentId?: string;
  status: 'PENDING_INSTITUTION' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
  requestedAt: string;
  respondedAt?: string;
}

export interface Notification {
  id: string;
  userId?: string; // If targeting specific user, or null if broadcast/role-based
  roleTarget?: UserRole;
  applicationId?: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  isRead: boolean;
  linkUrl: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  index: number;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'APPLICATION' | 'DOCUMENT' | 'COMPLIANCE_FINDING' | 'WORKFLOW' | 'SYSTEM_CONFIG' | 'AUTH';
  entityId: string;
  details: string;
  justification?: string;
  previousHash: string;
  hash: string;
}

export interface SystemConfiguration {
  id: string;
  key: string;
  value: string;
  description: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DatabaseSchema {
  users: User[];
  institutions: Institution[];
  applications: Application[];
  programmes: Programme[];
  documents: ApplicationDocument[];
  extractedFields: ExtractedField[];
  complianceRules: ComplianceRule[];
  complianceFindings: ComplianceFinding[];
  stageHistory: ApplicationStageHistory[];
  reviewComments: ReviewComment[];
  clarifications: Clarification[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  systemConfigurations: SystemConfiguration[];
}
