import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { DatabaseSchema, AuditLog } from './schema';

const HASHED_PW = bcrypt.hashSync('password123', 10);

export function generateSeedData(): DatabaseSchema {
  const now = new Date();
  const subDays = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
  const addDays = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();

  // 1. Users
  const users = [
    {
      id: 'usr_inst_1',
      username: 'dtu_registrar',
      passwordHash: HASHED_PW,
      name: 'Prof. Rajesh K. Pathak',
      email: 'registrar@dtu.ac.in',
      phone: '+91 9811029384',
      role: 'INSTITUTION' as const,
      designation: 'Registrar & Authorized Representative',
      institutionId: 'inst_dtu',
      region: 'NORTHERN',
      createdAt: subDays(60)
    },
    {
      id: 'usr_inst_2',
      username: 'coep_director',
      passwordHash: HASHED_PW,
      name: 'Dr. Sunita Deshmukh',
      email: 'director@coep.ac.in',
      phone: '+91 9422018273',
      role: 'INSTITUTION' as const,
      designation: 'Principal & Director',
      institutionId: 'inst_coep',
      region: 'WESTERN',
      createdAt: subDays(55)
    },
    {
      id: 'usr_officer_1',
      username: 'officer_sharma',
      passwordHash: HASHED_PW,
      name: 'Dr. Alok Sharma',
      email: 'alok.sharma@aicte-india.org',
      phone: '+91 9871122334',
      role: 'SCRUTINY_OFFICER' as const,
      designation: 'Senior Scrutiny Officer (Prof., IIT Roorkee)',
      department: 'Approval Bureau - Northern Regional Office',
      region: 'NORTHERN',
      createdAt: subDays(90)
    },
    {
      id: 'usr_officer_2',
      username: 'officer_iyer',
      passwordHash: HASHED_PW,
      name: 'Dr. Meenakshi Iyer',
      email: 'meenakshi.iyer@aicte-india.org',
      phone: '+91 9740011223',
      role: 'SCRUTINY_OFFICER' as const,
      designation: 'Scrutiny Officer (Prof., NIT Trichy)',
      department: 'Approval Bureau - Southern Regional Office',
      region: 'SOUTHERN',
      createdAt: subDays(80)
    },
    {
      id: 'usr_admin',
      username: 'aicte_admin',
      passwordHash: HASHED_PW,
      name: 'Er. Vivek Rastogi',
      email: 'director.approval@aicte-india.org',
      phone: '+91 9910088776',
      role: 'ADMIN' as const,
      designation: 'Director (Approval Bureau & Regulation)',
      department: 'AICTE Headquarters, Nelson Mandela Marg, New Delhi',
      createdAt: subDays(120)
    },
    {
      id: 'usr_auditor',
      username: 'cvc_auditor',
      passwordHash: HASHED_PW,
      name: 'Smt. Vandana Saxena',
      email: 'auditor.compliance@moe.gov.in',
      phone: '+91 9810992211',
      role: 'AUDITOR' as const,
      designation: 'Chief Compliance & Oversight Auditor',
      department: 'Ministry of Education / CVC Oversight Cell',
      createdAt: subDays(100)
    }
  ];

  // 2. Institutions
  const institutions = [
    {
      id: 'inst_dtu',
      permanentInstituteId: '1-10974531201',
      name: 'Delhi Technological University (DTU)',
      trustName: 'Delhi Technological University Trust',
      category: 'GOVERNMENT' as const,
      establishmentYear: 1941,
      state: 'Delhi',
      district: 'North West Delhi',
      region: 'NORTHERN' as const,
      address: 'Shahbad Daulatpur, Bawana Road',
      pincode: '110042',
      principalName: 'Prof. Rajesh K. Pathak',
      principalEmail: 'registrar@dtu.ac.in',
      principalPhone: '+91 9811029384',
      landAreaAcres: 164.0,
      totalBuiltUpAreaSqM: 145000,
      naacGrade: 'A+',
      nbaAccredited: true,
      createdAt: subDays(60)
    },
    {
      id: 'inst_coep',
      permanentInstituteId: '1-4567891234',
      name: 'COEP Technological University',
      trustName: 'COEP Autonomous Institute Society',
      category: 'GOVERNMENT_AIDED' as const,
      establishmentYear: 1854,
      state: 'Maharashtra',
      district: 'Pune',
      region: 'WESTERN' as const,
      address: 'Wellesley Road, Shivajinagar',
      pincode: '411005',
      principalName: 'Dr. Sunita Deshmukh',
      principalEmail: 'director@coep.ac.in',
      principalPhone: '+91 9422018273',
      landAreaAcres: 36.5,
      totalBuiltUpAreaSqM: 78000,
      naacGrade: 'A++',
      nbaAccredited: true,
      createdAt: subDays(55)
    },
    {
      id: 'inst_rvce',
      permanentInstituteId: '1-9876543210',
      name: 'RV College of Engineering',
      trustName: 'Rashtreeya Sikshana Samithi Trust',
      category: 'SELF_FINANCING' as const,
      establishmentYear: 1963,
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      region: 'SOUTHERN' as const,
      address: 'Mysore Road, RV Vidyaniketan Post',
      pincode: '560059',
      principalName: 'Dr. K. N. Subramanya',
      principalEmail: 'principal@rvce.edu.in',
      principalPhone: '+91 9845012345',
      landAreaAcres: 51.4,
      totalBuiltUpAreaSqM: 89000,
      naacGrade: 'A+',
      nbaAccredited: true,
      createdAt: subDays(50)
    },
    {
      id: 'inst_ju',
      permanentInstituteId: '1-5544332211',
      name: 'Jadavpur University Faculty of Engineering & Technology',
      trustName: 'Jadavpur University Statutory Body',
      category: 'GOVERNMENT' as const,
      establishmentYear: 1955,
      state: 'West Bengal',
      district: 'Kolkata',
      region: 'EASTERN' as const,
      address: '188, Raja S.C. Mallick Road',
      pincode: '700032',
      principalName: 'Prof. Amitava Dutta',
      principalEmail: 'dean.fet@jadavpuruniversity.in',
      principalPhone: '+91 9830012345',
      landAreaAcres: 58.0,
      totalBuiltUpAreaSqM: 92000,
      naacGrade: 'A',
      nbaAccredited: true,
      createdAt: subDays(45)
    },
    {
      id: 'inst_vjti',
      permanentInstituteId: '1-7788990011',
      name: 'Veermata Jijabai Technological Institute (VJTI)',
      trustName: 'VJTI Board of Governors',
      category: 'GOVERNMENT_AIDED' as const,
      establishmentYear: 1887,
      state: 'Maharashtra',
      district: 'Mumbai',
      region: 'WESTERN' as const,
      address: 'H R Mahajani Marg, Matunga',
      pincode: '400019',
      principalName: 'Dr. Sachin Patel',
      principalEmail: 'director@vjti.ac.in',
      principalPhone: '+91 9820011223',
      landAreaAcres: 16.0,
      totalBuiltUpAreaSqM: 42000,
      naacGrade: 'A+',
      nbaAccredited: true,
      createdAt: subDays(40)
    }
  ];

  // 3. Statutory Compliance Rules
  const complianceRules = [
    {
      id: 'cr_1',
      ruleCode: 'CR-DOC-PRESENCE',
      name: 'Mandatory Statutory Document Checklist',
      description: 'All 8 mandatory documents (Land Title, Building Plan, Occupancy, Fire NOC, Structure, Faculty, Accounts, Anti-ragging) must be uploaded.',
      aphClauseRef: 'APH 2024-27 Clause 2.4.1 & Annexure-7',
      category: 'REGULATORY_NOC' as const,
      severity: 'CRITICAL' as const,
      requiredEvidenceDoc: 'All Statutory Documents',
      isActive: true
    },
    {
      id: 'cr_2',
      ruleCode: 'CR-FIRE-NOC',
      name: 'Fire & Life Safety Certificate Validity',
      description: 'Fire Safety NOC issued by State Fire & Emergency Services must have an expiry date beyond the current academic year cycle (31-Aug-2025).',
      aphClauseRef: 'APH 2024-27 Clause 7.1.3 & National Building Code Part 4',
      category: 'REGULATORY_NOC' as const,
      severity: 'CRITICAL' as const,
      requiredEvidenceDoc: 'FIRE_SAFETY_NOC',
      isActive: true
    },
    {
      id: 'cr_3',
      ruleCode: 'CR-LAND-REQ',
      name: 'Contiguous Land Area Requirement',
      description: 'Minimum contiguous land required: Metro/Urban >= 2.5 Acres; Rural >= 7.5 Acres, free from mortgage or encumbrances.',
      aphClauseRef: 'APH 2024-27 Clause 7.1.1 (Land Norms)',
      category: 'INFRASTRUCTURE' as const,
      severity: 'CRITICAL' as const,
      requiredEvidenceDoc: 'LAND_TITLE_DEED',
      isActive: true
    },
    {
      id: 'cr_4',
      ruleCode: 'CR-FAC-RATIO',
      name: 'Cadre Ratio & Teacher-Student Norm (1:15 / 1:20)',
      description: 'Undergraduate Engineering programs must maintain minimum 1:20 student-faculty ratio with cadre ratio of 1 Professor : 2 Associate Prof : 6 Assistant Prof, verified by Aadhaar.',
      aphClauseRef: 'APH 2024-27 Clause 7.2.1 & Pay Regulations',
      category: 'FACULTY_RATIO' as const,
      severity: 'HIGH' as const,
      requiredEvidenceDoc: 'FACULTY_CADRE_DECLARATION',
      isActive: true
    },
    {
      id: 'cr_5',
      ruleCode: 'CR-BLDG-OCC',
      name: 'Building Occupancy & Structural Stability',
      description: 'Permanent Building Occupancy / Completion Certificate from Competent Municipal Town Planning Authority along with Structural Stability Certificate.',
      aphClauseRef: 'APH 2024-27 Clause 7.1.2 & Annexure-8',
      category: 'INFRASTRUCTURE' as const,
      severity: 'CRITICAL' as const,
      requiredEvidenceDoc: 'BUILDING_OCCUPANCY_CERTIFICATE',
      isActive: true
    },
    {
      id: 'cr_6',
      ruleCode: 'CR-DIVYANGJAN',
      name: 'Barrier-Free Environment & Divyangjan Amenities',
      description: 'Ramps with handrails, operational lift access, tactile warning tiles, and disabled-friendly accessible toilets on ground and upper floors.',
      aphClauseRef: 'RPwD Act 2016 & APH Clause 7.1.5',
      category: 'INFRASTRUCTURE' as const,
      severity: 'MEDIUM' as const,
      requiredEvidenceDoc: 'BARRIER_FREE_ACCESSIBILITY_CERT',
      isActive: true
    },
    {
      id: 'cr_7',
      ruleCode: 'CR-ANTI-RAGGING',
      name: 'Anti-Ragging Statutory Undertaking & Cell Notification',
      description: 'Affidavit affirming compliance with AICTE Regulations 2009 on Curbing Menace of Ragging, constituted Anti-Ragging Committee and Squad.',
      aphClauseRef: 'AICTE Regulation F.No.37-3/Legal/AICTE/2009',
      category: 'STATUTORY_DECLARATION' as const,
      severity: 'HIGH' as const,
      requiredEvidenceDoc: 'ANTI_RAGGING_AFFIDAVIT',
      isActive: true
    },
    {
      id: 'cr_8',
      ruleCode: 'CR-NBA-ACCR',
      name: 'NBA/NAAC Accreditation for Intake Expansion',
      description: 'Intake increase exceeding 180 seats or new division requires at least one existing program accredited by NBA with minimum 675 marks or NAAC grade A.',
      aphClauseRef: 'APH 2024-27 Clause 2.4.2 (Intake Expansion Criteria)',
      category: 'ACADEMIC_ACCREDITATION' as const,
      severity: 'HIGH' as const,
      requiredEvidenceDoc: 'AUDITED_FINANCIAL_STATEMENT',
      isActive: true
    }
  ];

  // 4. Applications
  const applications = [
    {
      id: 'app_101',
      applicationNumber: 'AICTE/2025-26/APP-101-DTU',
      institutionId: 'inst_dtu',
      academicYear: '2025-26',
      applicationType: 'EXTENSION_OF_APPROVAL' as const,
      currentStage: 'UNDER_SCRUTINY' as const,
      submittedAt: subDays(14),
      assignedOfficerId: 'usr_officer_1',
      assignedOfficerName: 'Dr. Alok Sharma',
      assignedDate: subDays(10),
      targetCompletionDate: addDays(4),
      complianceScore: 88,
      criticalDeficiencyCount: 1,
      createdAt: subDays(16),
      updatedAt: subDays(2)
    },
    {
      id: 'app_102',
      applicationNumber: 'AICTE/2025-26/APP-102-COEP',
      institutionId: 'inst_coep',
      academicYear: '2025-26',
      applicationType: 'INCREASE_IN_INTAKE' as const,
      currentStage: 'CLARIFICATION_REQUESTED' as const,
      submittedAt: subDays(20),
      assignedOfficerId: 'usr_officer_1',
      assignedOfficerName: 'Dr. Alok Sharma',
      assignedDate: subDays(16),
      targetCompletionDate: subDays(2), // Overdue clarification window
      complianceScore: 72,
      criticalDeficiencyCount: 1,
      createdAt: subDays(25),
      updatedAt: subDays(1)
    },
    {
      id: 'app_103',
      applicationNumber: 'AICTE/2025-26/APP-103-RVCE',
      institutionId: 'inst_rvce',
      academicYear: '2025-26',
      applicationType: 'NEW_PROGRAMME_COURSE' as const,
      currentStage: 'PRELIMINARY_SCRUTINY' as const,
      submittedAt: subDays(3),
      targetCompletionDate: addDays(4),
      complianceScore: 95,
      criticalDeficiencyCount: 0,
      createdAt: subDays(7),
      updatedAt: subDays(3)
    },
    {
      id: 'app_104',
      applicationNumber: 'AICTE/2025-26/APP-104-VJTI',
      institutionId: 'inst_vjti',
      academicYear: '2025-26',
      applicationType: 'EXTENSION_OF_APPROVAL' as const,
      currentStage: 'APPROVED' as const,
      submittedAt: subDays(45),
      assignedOfficerId: 'usr_officer_2',
      assignedOfficerName: 'Dr. Meenakshi Iyer',
      assignedDate: subDays(40),
      targetCompletionDate: subDays(20),
      actualCompletionDate: subDays(22),
      complianceScore: 100,
      criticalDeficiencyCount: 0,
      finalDecision: 'APPROVED' as const,
      finalDecisionDate: subDays(22),
      finalDecisionOfficerId: 'usr_admin',
      finalDecisionRemarks: 'All statutory norms verified. Full Extension of Approval granted for AY 2025-26 under Chapter II.',
      createdAt: subDays(50),
      updatedAt: subDays(22)
    },
    {
      id: 'app_105',
      applicationNumber: 'AICTE/2025-26/APP-105-JU',
      institutionId: 'inst_ju',
      academicYear: '2025-26',
      applicationType: 'INCREASE_IN_INTAKE' as const,
      currentStage: 'UNDER_SCRUTINY' as const,
      submittedAt: subDays(28),
      assignedOfficerId: 'usr_officer_2',
      assignedOfficerName: 'Dr. Meenakshi Iyer',
      assignedDate: subDays(24),
      targetCompletionDate: subDays(4), // OVERDUE by 4 days
      complianceScore: 65,
      criticalDeficiencyCount: 2,
      createdAt: subDays(30),
      updatedAt: subDays(4)
    },
    {
      id: 'app_106',
      applicationNumber: 'AICTE/2025-26/APP-106-DRAFT',
      institutionId: 'inst_dtu',
      academicYear: '2025-26',
      applicationType: 'NRI_OCI_SUPERNUMERARY' as const,
      currentStage: 'DRAFT' as const,
      complianceScore: 40,
      criticalDeficiencyCount: 3,
      createdAt: subDays(2),
      updatedAt: subDays(1)
    }
  ];

  // 5. Programmes
  const programmes = [
    {
      id: 'prog_1',
      applicationId: 'app_101',
      programmeType: 'ENGINEERING_AND_TECHNOLOGY' as const,
      courseName: 'Computer Science and Engineering',
      level: 'UG' as const,
      durationYears: 4,
      existingIntake: 240,
      proposedIntake: 240,
      nbaAccredited: true,
      facultyCount: 16
    },
    {
      id: 'prog_2',
      applicationId: 'app_101',
      programmeType: 'ENGINEERING_AND_TECHNOLOGY' as const,
      courseName: 'Electronics and Communication Engineering',
      level: 'UG' as const,
      durationYears: 4,
      existingIntake: 180,
      proposedIntake: 180,
      nbaAccredited: true,
      facultyCount: 12
    },
    {
      id: 'prog_3',
      applicationId: 'app_102',
      programmeType: 'ENGINEERING_AND_TECHNOLOGY' as const,
      courseName: 'Artificial Intelligence and Data Science',
      level: 'UG' as const,
      durationYears: 4,
      existingIntake: 60,
      proposedIntake: 120, // Increase requested
      nbaAccredited: true,
      facultyCount: 7
    },
    {
      id: 'prog_4',
      applicationId: 'app_103',
      programmeType: 'ENGINEERING_AND_TECHNOLOGY' as const,
      courseName: 'Robotics and Autonomous Systems',
      level: 'PG' as const,
      durationYears: 2,
      existingIntake: 0,
      proposedIntake: 30, // New course
      nbaAccredited: false,
      facultyCount: 3
    },
    {
      id: 'prog_5',
      applicationId: 'app_104',
      programmeType: 'ENGINEERING_AND_TECHNOLOGY' as const,
      courseName: 'Mechanical Engineering',
      level: 'UG' as const,
      durationYears: 4,
      existingIntake: 120,
      proposedIntake: 120,
      nbaAccredited: true,
      facultyCount: 8
    },
    {
      id: 'prog_6',
      applicationId: 'app_105',
      programmeType: 'ENGINEERING_AND_TECHNOLOGY' as const,
      courseName: 'Information Technology',
      level: 'UG' as const,
      durationYears: 4,
      existingIntake: 60,
      proposedIntake: 120,
      nbaAccredited: true,
      facultyCount: 5
    }
  ];

  // 6. Application Documents
  const documents = [
    // DTU app_101
    {
      id: 'doc_101_1',
      applicationId: 'app_101',
      documentCategory: 'LAND_TITLE_DEED' as const,
      title: 'Registered Land Ownership Title Deed (164 Acres)',
      originalFilename: 'DTU_Land_Deed_Govt_NCT_Delhi_1998.pdf',
      storagePath: '/uploads/sample_dtu_land_deed.pdf',
      fileSizeBytes: 2450800,
      mimeType: 'application/pdf',
      uploadDate: subDays(15),
      uploadedByUserId: 'usr_inst_1',
      validityExpiryDate: '2099-12-31',
      status: 'VERIFIED' as const,
      verificationNotes: 'Permanent government grant; 164 acres in continuous possession.',
      version: 1
    },
    {
      id: 'doc_101_2',
      applicationId: 'app_101',
      documentCategory: 'FIRE_SAFETY_NOC' as const,
      title: 'Delhi Fire Service Safety Clearance Certificate',
      originalFilename: 'DFS_Fire_Safety_NOC_2024_2027.pdf',
      storagePath: '/uploads/sample_dtu_fire_noc.pdf',
      fileSizeBytes: 1820400,
      mimeType: 'application/pdf',
      uploadDate: subDays(15),
      uploadedByUserId: 'usr_inst_1',
      validityExpiryDate: '2026-03-31', // Valid
      status: 'VERIFIED' as const,
      verificationNotes: 'Issued by Chief Fire Officer, Delhi Fire Service on 01-Apr-2024.',
      version: 1
    },
    {
      id: 'doc_101_3',
      applicationId: 'app_101',
      documentCategory: 'BUILDING_OCCUPANCY_CERTIFICATE' as const,
      title: 'DDA / Municipal Corporation Occupancy Certificate',
      originalFilename: 'MCD_Occupancy_Certificate_DTU_Campus.pdf',
      storagePath: '/uploads/sample_dtu_occupancy.pdf',
      fileSizeBytes: 3120000,
      mimeType: 'application/pdf',
      uploadDate: subDays(15),
      uploadedByUserId: 'usr_inst_1',
      status: 'NEEDS_REVIEW' as const,
      verificationNotes: 'Block C auditorium addition requires updated structural certificate.',
      version: 1
    },
    {
      id: 'doc_101_4',
      applicationId: 'app_101',
      documentCategory: 'FACULTY_CADRE_DECLARATION' as const,
      title: 'Faculty List with AICTE Faculty IDs and Aadhaar Verification',
      originalFilename: 'DTU_Faculty_Cadre_List_AY2024_25.pdf',
      storagePath: '/uploads/sample_dtu_faculty.pdf',
      fileSizeBytes: 1420000,
      mimeType: 'application/pdf',
      uploadDate: subDays(14),
      uploadedByUserId: 'usr_inst_1',
      status: 'VERIFIED' as const,
      verificationNotes: '28 approved professors, 44 associate professors, 96 assistant professors.',
      version: 1
    },
    // COEP app_102
    {
      id: 'doc_102_1',
      applicationId: 'app_102',
      documentCategory: 'FIRE_SAFETY_NOC' as const,
      title: 'Pune Municipal Corporation Fire Safety NOC',
      originalFilename: 'PMC_Fire_Dept_NOC_2023.pdf',
      storagePath: '/uploads/sample_coep_fire_noc.pdf',
      fileSizeBytes: 1530000,
      mimeType: 'application/pdf',
      uploadDate: subDays(21),
      uploadedByUserId: 'usr_inst_2',
      validityExpiryDate: '2024-05-31', // EXPIRED! Triggered finding
      status: 'NEEDS_REVIEW' as const,
      verificationNotes: 'Fire NOC expired on 31-May-2024. Renewal receipt provided; formal NOC requested.',
      version: 1
    },
    {
      id: 'doc_102_2',
      applicationId: 'app_102',
      documentCategory: 'LAND_TITLE_DEED' as const,
      title: 'Revenue Authority Land Sanction Order (36.5 Acres)',
      originalFilename: 'COEP_Land_Title_Pune_Collector.pdf',
      storagePath: '/uploads/sample_coep_land.pdf',
      fileSizeBytes: 2100000,
      mimeType: 'application/pdf',
      uploadDate: subDays(21),
      uploadedByUserId: 'usr_inst_2',
      status: 'VERIFIED' as const,
      version: 1
    }
  ];

  // 7. Extracted Fields
  const extractedFields = [
    {
      id: 'ef_1',
      documentId: 'doc_101_1',
      applicationId: 'app_101',
      fieldName: 'Total Land Area',
      extractedValue: '164.00 Acres',
      expectedValue: '164.00 Acres',
      confidenceScore: 0.98,
      pageNumber: 1,
      isMatch: true,
      extractedAt: subDays(14)
    },
    {
      id: 'ef_2',
      documentId: 'doc_101_2',
      applicationId: 'app_101',
      fieldName: 'Fire NOC Expiry Date',
      extractedValue: '31-03-2026',
      expectedValue: '>= 31-08-2025',
      confidenceScore: 0.95,
      pageNumber: 1,
      isMatch: true,
      extractedAt: subDays(14)
    },
    {
      id: 'ef_3',
      documentId: 'doc_102_1',
      applicationId: 'app_102',
      fieldName: 'Fire NOC Expiry Date',
      extractedValue: '31-05-2024',
      expectedValue: '>= 31-08-2025',
      confidenceScore: 0.96,
      pageNumber: 2,
      isMatch: false, // Discrepancy!
      extractedAt: subDays(20)
    }
  ];

  // 8. Compliance Findings
  const complianceFindings = [
    // DTU app_101 findings
    {
      id: 'fnd_101_1',
      applicationId: 'app_101',
      ruleId: 'cr_1',
      ruleCode: 'CR-DOC-PRESENCE',
      ruleName: 'Mandatory Statutory Document Checklist',
      aphClauseRef: 'APH 2024-27 Clause 2.4.1',
      severity: 'LOW' as const,
      status: 'AUTOMATED_PASS' as const,
      explanation: 'All 8 required statutory compliance documents have been submitted and digitally validated.',
      evidenceSource: 'Document Repository Index (8/8 uploaded)',
      confidenceScore: 1.0,
      recommendedAction: 'Proceed to Scrutiny Committee original verification.',
      reviewerDisposition: 'PENDING' as const,
      createdAt: subDays(14)
    },
    {
      id: 'fnd_101_2',
      applicationId: 'app_101',
      ruleId: 'cr_2',
      ruleCode: 'CR-FIRE-NOC',
      ruleName: 'Fire & Life Safety Certificate Validity',
      aphClauseRef: 'APH 2024-27 Clause 7.1.3',
      severity: 'CRITICAL' as const,
      status: 'AUTOMATED_PASS' as const,
      explanation: 'Fire Safety NOC is valid until 31-Mar-2026, satisfying the minimum academic year requirement.',
      evidenceSource: 'DFS_Fire_Safety_NOC_2024_2027.pdf (Page 1, Para 2)',
      evidenceDocId: 'doc_101_2',
      confidenceScore: 0.95,
      recommendedAction: 'Verified. No remedial action required.',
      reviewerDisposition: 'PENDING' as const,
      createdAt: subDays(14)
    },
    {
      id: 'fnd_101_3',
      applicationId: 'app_101',
      ruleId: 'cr_5',
      ruleCode: 'CR-BLDG-OCC',
      ruleName: 'Building Occupancy & Structural Stability',
      aphClauseRef: 'APH 2024-27 Clause 7.1.2',
      severity: 'HIGH' as const,
      status: 'WARNING' as const,
      explanation: 'Newly inaugurated Academic Block C (12,000 sq.m) structural stability test certificate is pending municipal sign-off.',
      evidenceSource: 'MCD_Occupancy_Certificate_DTU_Campus.pdf (Annexure 3 Note)',
      evidenceDocId: 'doc_101_3',
      confidenceScore: 0.88,
      recommendedAction: 'Request formal structural stability endorsement before issuing final approval.',
      reviewerDisposition: 'CONFIRMED_DEFICIENCY' as const,
      createdAt: subDays(14)
    },
    // COEP app_102 findings
    {
      id: 'fnd_102_1',
      applicationId: 'app_102',
      ruleId: 'cr_2',
      ruleCode: 'CR-FIRE-NOC',
      ruleName: 'Fire & Life Safety Certificate Validity',
      aphClauseRef: 'APH 2024-27 Clause 7.1.3',
      severity: 'CRITICAL' as const,
      status: 'AUTOMATED_FAIL' as const,
      explanation: 'Extracted Fire NOC expired on 31-May-2024. A valid certificate covering AY 2025-26 is mandatory under National Building Code norms.',
      evidenceSource: 'PMC_Fire_Dept_NOC_2023.pdf (Page 2, Box 4)',
      evidenceDocId: 'doc_102_1',
      confidenceScore: 0.96,
      recommendedAction: 'Issue immediate clarification notice to COEP for updated renewal NOC.',
      reviewerDisposition: 'CLARIFICATION_PENDING' as const,
      createdAt: subDays(20)
    },
    // Jadavpur app_105 findings
    {
      id: 'fnd_105_1',
      applicationId: 'app_105',
      ruleId: 'cr_4',
      ruleCode: 'CR-FAC-RATIO',
      ruleName: 'Cadre Ratio & Teacher-Student Norm (1:15 / 1:20)',
      aphClauseRef: 'APH 2024-27 Clause 7.2.1',
      severity: 'CRITICAL' as const,
      status: 'AUTOMATED_FAIL' as const,
      explanation: 'Proposed IT intake expansion to 120 seats results in 1:24 faculty ratio, breaching the 1:20 threshold by 4 faculty members.',
      evidenceSource: 'Faculty Cadre Submission vs Proposed Intake computation',
      confidenceScore: 0.99,
      recommendedAction: 'Intake expansion cannot be recommended until 4 additional assistant professors are recruited.',
      reviewerDisposition: 'CONFIRMED_DEFICIENCY' as const,
      createdAt: subDays(28)
    }
  ];

  // 9. Stage History
  const stageHistory = [
    {
      id: 'sh_1',
      applicationId: 'app_101',
      fromStage: 'DRAFT' as const,
      toStage: 'SUBMITTED' as const,
      action: 'Institution Submission',
      performedByUserId: 'usr_inst_1',
      performedByName: 'Prof. Rajesh K. Pathak',
      performedByRole: 'INSTITUTION' as const,
      comments: 'Submitted application for Extension of Approval (EoA) AY 2025-26 with all fee payment receipts and declarations.',
      timestamp: subDays(14)
    },
    {
      id: 'sh_2',
      applicationId: 'app_101',
      fromStage: 'SUBMITTED' as const,
      toStage: 'PRELIMINARY_SCRUTINY' as const,
      action: 'Automated Preliminary Scrutiny Execution',
      performedByUserId: 'usr_admin',
      performedByName: 'AICTE Automated Scrutiny Engine',
      performedByRole: 'ADMIN' as const,
      comments: 'Deterministic rule engine completed checks. 7 PASS, 1 WARNING detected.',
      timestamp: subDays(14)
    },
    {
      id: 'sh_3',
      applicationId: 'app_101',
      fromStage: 'PRELIMINARY_SCRUTINY' as const,
      toStage: 'SCRUTINY_ASSIGNED' as const,
      action: 'Reviewer Allocation',
      performedByUserId: 'usr_admin',
      performedByName: 'Er. Vivek Rastogi',
      performedByRole: 'ADMIN' as const,
      comments: 'Assigned to Dr. Alok Sharma (Senior Scrutiny Officer, Northern Region). Target SLA: 7 days.',
      timestamp: subDays(10)
    },
    {
      id: 'sh_4',
      applicationId: 'app_101',
      fromStage: 'SCRUTINY_ASSIGNED' as const,
      toStage: 'UNDER_SCRUTINY' as const,
      action: 'Scrutiny Officer Acceptance',
      performedByUserId: 'usr_officer_1',
      performedByName: 'Dr. Alok Sharma',
      performedByRole: 'SCRUTINY_OFFICER' as const,
      comments: 'Scrutiny started. Physical/digital inspection in progress.',
      timestamp: subDays(9)
    },
    // COEP stage history
    {
      id: 'sh_5',
      applicationId: 'app_102',
      fromStage: 'UNDER_SCRUTINY' as const,
      toStage: 'CLARIFICATION_REQUESTED' as const,
      action: 'Clarification Notice Issued',
      performedByUserId: 'usr_officer_1',
      performedByName: 'Dr. Alok Sharma',
      performedByRole: 'SCRUTINY_OFFICER' as const,
      comments: 'Fire NOC expired on 31-May-2024. Institution requested to furnish valid renewal certificate within 7 working days.',
      timestamp: subDays(6)
    }
  ];

  // 10. Review Comments
  const reviewComments = [
    {
      id: 'rc_1',
      applicationId: 'app_101',
      officerId: 'usr_officer_1',
      officerName: 'Dr. Alok Sharma',
      category: 'INFRASTRUCTURE' as const,
      comment: 'Land records verified against Delhi Revenue Land Register. Total campus area of 164 acres confirmed. Divyangjan accessibility ramp observed on Ground and First floors.',
      timestamp: subDays(8)
    },
    {
      id: 'rc_2',
      applicationId: 'app_101',
      officerId: 'usr_officer_1',
      officerName: 'Dr. Alok Sharma',
      category: 'DOCUMENT' as const,
      comment: 'Fire Safety NOC is valid and genuine. Awaiting structural stability certificate for newly added Academic Block C.',
      timestamp: subDays(4)
    },
    {
      id: 'rc_3',
      applicationId: 'app_102',
      officerId: 'usr_officer_1',
      officerName: 'Dr. Alok Sharma',
      category: 'COMPLIANCE' as const,
      comment: 'Fire safety certificate is expired. Institution must submit current NOC before Scrutiny Committee can recommend intake increase.',
      timestamp: subDays(6)
    }
  ];

  // 11. Clarifications
  const clarifications = [
    {
      id: 'clr_1',
      applicationId: 'app_102',
      officerId: 'usr_officer_1',
      officerName: 'Dr. Alok Sharma',
      requestedFields: ['FIRE_SAFETY_NOC'],
      requestQuery: 'The Fire NOC uploaded (PMC_Fire_Dept_NOC_2023.pdf) shows expiry date 31-05-2024. Please upload the valid renewed Fire & Emergency Services NOC valid for AY 2025-26 along with payment receipt.',
      deadlineDate: addDays(2),
      status: 'PENDING_INSTITUTION' as const,
      requestedAt: subDays(6)
    }
  ];

  // 12. Notifications
  const notifications = [
    {
      id: 'notif_1',
      userId: 'usr_inst_1',
      roleTarget: 'INSTITUTION' as const,
      applicationId: 'app_101',
      title: 'Scrutiny Officer Assigned',
      message: 'Your application AICTE/2025-26/APP-101-DTU has been assigned to Dr. Alok Sharma for Committee Scrutiny.',
      severity: 'INFO' as const,
      isRead: true,
      linkUrl: '/applications/app_101',
      timestamp: subDays(10)
    },
    {
      id: 'notif_2',
      userId: 'usr_inst_2',
      roleTarget: 'INSTITUTION' as const,
      applicationId: 'app_102',
      title: 'Action Required: Clarification Requested',
      message: 'Scrutiny Officer has requested renewal of Fire Safety NOC for application AICTE/2025-26/APP-102-COEP.',
      severity: 'WARNING' as const,
      isRead: false,
      linkUrl: '/applications/app_102',
      timestamp: subDays(6)
    },
    {
      id: 'notif_3',
      roleTarget: 'ADMIN' as const,
      applicationId: 'app_105',
      title: 'SLA Alert: Application Processing Overdue',
      message: 'Application AICTE/2025-26/APP-105-JU under Dr. Meenakshi Iyer has exceeded configured SLA threshold by 4 days.',
      severity: 'CRITICAL' as const,
      isRead: false,
      linkUrl: '/applications/app_105',
      timestamp: subDays(2)
    },
    {
      id: 'notif_4',
      roleTarget: 'ADMIN' as const,
      applicationId: 'app_103',
      title: 'New Application Submitted - Pending Assignment',
      message: 'RV College of Engineering submitted APP-103 for New PG Programme. Automated preliminary scrutiny passed.',
      severity: 'INFO' as const,
      isRead: false,
      linkUrl: '/applications/app_103',
      timestamp: subDays(3)
    }
  ];

  // 13. System Configurations
  const systemConfigurations = [
    {
      id: 'cfg_1',
      key: 'SLA_PRELIMINARY_SCRUTINY_DAYS',
      value: '3',
      description: 'Maximum allowable days for preliminary automated checks',
      updatedAt: subDays(30),
      updatedBy: 'usr_admin'
    },
    {
      id: 'cfg_2',
      key: 'SLA_SCRUTINY_OFFICER_DAYS',
      value: '7',
      description: 'Target processing window for Scrutiny Committee review',
      updatedAt: subDays(30),
      updatedBy: 'usr_admin'
    },
    {
      id: 'cfg_3',
      key: 'SLA_CLARIFICATION_WINDOW_DAYS',
      value: '7',
      description: 'Days granted to applicant institutions to submit deficiency rectifications',
      updatedAt: subDays(30),
      updatedBy: 'usr_admin'
    },
    {
      id: 'cfg_4',
      key: 'SLA_TECHNICAL_REVIEW_DAYS',
      value: '10',
      description: 'Maximum turnaround for final Technical & Approval Bureau committee decision',
      updatedAt: subDays(30),
      updatedBy: 'usr_admin'
    },
    {
      id: 'cfg_5',
      key: 'ALERT_OVERDUE_DAYS_THRESHOLD',
      value: '1',
      description: 'Days past target completion before triggering administrative escalation alert',
      updatedAt: subDays(30),
      updatedBy: 'usr_admin'
    }
  ];

  // 14. Cryptographic Hash-Linked Audit Trail (Genesis block onwards)
  const auditLogs: AuditLog[] = [];
  function addAudit(
    actorId: string,
    actorName: string,
    actorRole: any,
    action: string,
    entityType: any,
    entityId: string,
    details: string,
    justification?: string,
    timeOffsetDays = 30
  ) {
    const prevHash = auditLogs.length === 0 
      ? '0000000000000000000000000000000000000000000000000000000000000000'
      : auditLogs[auditLogs.length - 1].hash;

    const index = auditLogs.length + 1;
    const timestamp = subDays(timeOffsetDays);
    const payload = `${index}|${timestamp}|${actorId}|${action}|${entityType}|${entityId}|${details}|${justification || ''}|${prevHash}`;
    const hash = crypto.createHash('sha256').update(payload).digest('hex');

    auditLogs.push({
      id: `aud_${index}`,
      index,
      timestamp,
      actorId,
      actorName,
      actorRole,
      action,
      entityType,
      entityId,
      details,
      justification,
      previousHash: prevHash,
      hash
    });
  }

  // Genesis & initial ledger records
  addAudit('usr_admin', 'Er. Vivek Rastogi', 'ADMIN', 'SYSTEM_INIT', 'SYSTEM_CONFIG', 'SYS_INIT', 'AICTE Automated Scrutiny & Approval System initialised with APH 2024-27 rulebook.', undefined, 45);
  addAudit('usr_inst_1', 'Prof. Rajesh K. Pathak', 'INSTITUTION', 'APPLICATION_SUBMITTED', 'APPLICATION', 'app_101', 'Submitted EoA 2025-26 Application AICTE/2025-26/APP-101-DTU', undefined, 14);
  addAudit('usr_admin', 'AICTE Rules Engine', 'ADMIN', 'AUTOMATED_SCRUTINY_RUN', 'COMPLIANCE_FINDING', 'app_101', 'Executed deterministic check: 7 rules satisfied, 1 warning (Structural Stability Block C).', undefined, 14);
  addAudit('usr_admin', 'Er. Vivek Rastogi', 'ADMIN', 'REVIEWER_ASSIGNED', 'WORKFLOW', 'app_101', 'Assigned Scrutiny Officer Dr. Alok Sharma to application app_101', undefined, 10);
  addAudit('usr_inst_2', 'Dr. Sunita Deshmukh', 'INSTITUTION', 'APPLICATION_SUBMITTED', 'APPLICATION', 'app_102', 'Submitted Intake Expansion Application AICTE/2025-26/APP-102-COEP', undefined, 20);
  addAudit('usr_officer_1', 'Dr. Alok Sharma', 'SCRUTINY_OFFICER', 'CLARIFICATION_REQUESTED', 'WORKFLOW', 'app_102', 'Issued clarification notice for expired Fire Safety NOC (expired 31-May-2024)', 'Statutory requirement under NBC Part 4 cannot be waived.', 6);
  addAudit('usr_admin', 'Er. Vivek Rastogi', 'ADMIN', 'APPROVAL_GRANTED', 'APPLICATION', 'app_104', 'Granted formal Extension of Approval for VJTI Mumbai for AY 2025-26', 'All physical & documentary compliances 100% verified without exceptions.', 22);

  return {
    users,
    institutions,
    applications,
    programmes,
    documents,
    extractedFields,
    complianceRules,
    complianceFindings,
    stageHistory,
    reviewComments,
    clarifications,
    notifications,
    auditLogs,
    systemConfigurations
  };
}
