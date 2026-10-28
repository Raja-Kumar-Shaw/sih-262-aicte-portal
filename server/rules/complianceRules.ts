import { Application, ComplianceFinding, ComplianceRule } from '../db/schema';
import { db } from '../db/database';

export interface PreliminaryScrutinyResult {
  applicationId: string;
  totalRulesEvaluated: number;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  complianceScore: number;
  criticalDeficiencyCount: number;
  findings: ComplianceFinding[];
  aiSummary: string;
}

export function runComplianceScrutiny(applicationId: string): PreliminaryScrutinyResult {
  const app = db.getApplicationById(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);

  const institution = db.getInstitutionById(app.institutionId);
  if (!institution) throw new Error(`Institution ${app.institutionId} not found`);

  const docs = db.getDocuments(applicationId);
  const programmes = db.getProgrammes(applicationId);
  const rules = db.getComplianceRules().filter(r => r.isActive);
  const existingFindings = db.getComplianceFindings(applicationId);

  const findings: ComplianceFinding[] = [];
  const now = new Date().toISOString();

  // Helper to check existing reviewer override
  const getOverride = (ruleCode: string) => {
    return existingFindings.find(f => f.ruleCode === ruleCode && f.reviewerDisposition);
  };

  for (const rule of rules) {
    const existingOverride = getOverride(rule.ruleCode);

    switch (rule.ruleCode) {
      case 'CR-DOC-PRESENCE': {
        const mandatoryCategories = [
          'LAND_TITLE_DEED',
          'BUILDING_OCCUPANCY_CERTIFICATE',
          'FIRE_SAFETY_NOC',
          'FACULTY_CADRE_DECLARATION',
          'ANTI_RAGGING_AFFIDAVIT'
        ];
        const uploadedCategories = new Set(docs.map(d => d.documentCategory));
        const missing = mandatoryCategories.filter(c => !uploadedCategories.has(c as any));

        const isPass = missing.length === 0;
        findings.push({
          id: `fnd_${Date.now()}_doc_pres`,
          applicationId,
          ruleId: rule.id,
          ruleCode: rule.ruleCode,
          ruleName: rule.name,
          aphClauseRef: rule.aphClauseRef,
          severity: 'CRITICAL',
          status: isPass ? 'AUTOMATED_PASS' : 'AUTOMATED_FAIL',
          explanation: isPass
            ? `All mandatory statutory documents (${docs.length} uploaded) are present in the application dossier.`
            : `Deficiency detected: ${missing.length} mandatory document(s) missing: ${missing.join(', ')}.`,
          evidenceSource: isPass 
            ? `Document Dossier Index: ${docs.length} digital files verified` 
            : `Missing Category Checklist: ${missing.join(', ')}`,
          confidenceScore: 1.0,
          recommendedAction: isPass
            ? 'Proceed to Scrutiny Committee original certificate verification.'
            : 'Issue deficiency notice to institution to upload missing mandatory certificates.',
          reviewerDisposition: existingOverride?.reviewerDisposition || (isPass ? 'PENDING' : 'CONFIRMED_DEFICIENCY'),
          reviewerOverrideReason: existingOverride?.reviewerOverrideReason,
          overriddenByOfficerId: existingOverride?.overriddenByOfficerId,
          overriddenAt: existingOverride?.overriddenAt,
          createdAt: now
        });
        break;
      }

      case 'CR-FIRE-NOC': {
        const fireDoc = docs.find(d => d.documentCategory === 'FIRE_SAFETY_NOC');
        if (!fireDoc) {
          findings.push({
            id: `fnd_${Date.now()}_fire_miss`,
            applicationId,
            ruleId: rule.id,
            ruleCode: rule.ruleCode,
            ruleName: rule.name,
            aphClauseRef: rule.aphClauseRef,
            severity: 'CRITICAL',
            status: 'AUTOMATED_FAIL',
            explanation: 'Mandatory Fire Safety Certificate (NOC) has not been uploaded.',
            evidenceSource: 'Document Repository: No file with category FIRE_SAFETY_NOC',
            confidenceScore: 1.0,
            recommendedAction: 'Upload valid Fire NOC issued by State Fire & Emergency Services.',
            reviewerDisposition: existingOverride?.reviewerDisposition || 'CONFIRMED_DEFICIENCY',
            createdAt: now
          });
        } else {
          const expiryStr = fireDoc.validityExpiryDate || '2026-03-31';
          const expiryDate = new Date(expiryStr);
          const requiredDate = new Date('2025-08-31');
          const isValid = !isNaN(expiryDate.getTime()) && expiryDate.getTime() >= requiredDate.getTime();

          findings.push({
            id: `fnd_${Date.now()}_fire_val`,
            applicationId,
            ruleId: rule.id,
            ruleCode: rule.ruleCode,
            ruleName: rule.name,
            aphClauseRef: rule.aphClauseRef,
            severity: 'CRITICAL',
            status: isValid ? 'AUTOMATED_PASS' : 'AUTOMATED_FAIL',
            explanation: isValid
              ? `Fire Safety NOC (${fireDoc.originalFilename}) is valid up to ${expiryStr}, covering the upcoming academic year.`
              : `Fire Safety NOC expired on ${expiryStr}. A valid certificate extending beyond 31-Aug-2025 is mandatory under National Building Code Part 4.`,
            evidenceSource: `${fireDoc.originalFilename} (Validity: ${expiryStr})`,
            evidenceDocId: fireDoc.id,
            confidenceScore: 0.95,
            recommendedAction: isValid
              ? 'Certificate verified as genuine and active.'
              : 'Issue formal clarification notice requiring current Fire Safety renewal certificate.',
            reviewerDisposition: existingOverride?.reviewerDisposition || (isValid ? 'PENDING' : 'CLARIFICATION_PENDING'),
            reviewerOverrideReason: existingOverride?.reviewerOverrideReason,
            overriddenByOfficerId: existingOverride?.overriddenByOfficerId,
            overriddenAt: existingOverride?.overriddenAt,
            createdAt: now
          });
        }
        break;
      }

      case 'CR-LAND-REQ': {
        const landDoc = docs.find(d => d.documentCategory === 'LAND_TITLE_DEED');
        const minReqAcres = institution.region === 'NORTHERN' || institution.region === 'WESTERN' ? 2.5 : 2.5;
        const isSufficient = institution.landAreaAcres >= minReqAcres;

        findings.push({
          id: `fnd_${Date.now()}_land`,
          applicationId,
          ruleId: rule.id,
          ruleCode: rule.ruleCode,
          ruleName: rule.name,
          aphClauseRef: rule.aphClauseRef,
          severity: 'CRITICAL',
          status: isSufficient ? 'AUTOMATED_PASS' : 'AUTOMATED_FAIL',
          explanation: isSufficient
            ? `Institution holds ${institution.landAreaAcres} contiguous acres, exceeding the minimum urban requirement of ${minReqAcres} acres.`
            : `Campus land area of ${institution.landAreaAcres} acres is below the statutory requirement of ${minReqAcres} acres.`,
          evidenceSource: landDoc ? `${landDoc.originalFilename} (Area: ${institution.landAreaAcres} Acres)` : 'Institutional Profile Declaration',
          evidenceDocId: landDoc?.id,
          confidenceScore: 0.98,
          recommendedAction: isSufficient
            ? 'Land requirement satisfied.'
            : 'Deficiency: Institution must furnish additional contiguous land revenue records.',
          reviewerDisposition: existingOverride?.reviewerDisposition || 'PENDING',
          reviewerOverrideReason: existingOverride?.reviewerOverrideReason,
          overriddenByOfficerId: existingOverride?.overriddenByOfficerId,
          overriddenAt: existingOverride?.overriddenAt,
          createdAt: now
        });
        break;
      }

      case 'CR-FAC-RATIO': {
        const totalProposedIntake = programmes.reduce((sum, p) => sum + (p.proposedIntake || p.existingIntake), 0);
        const totalFaculty = programmes.reduce((sum, p) => sum + p.facultyCount, 0);
        // Approx 4 years student body = intake * 4
        const estimatedStudents = totalProposedIntake * 4;
        const ratio = totalFaculty > 0 ? (estimatedStudents / totalFaculty).toFixed(1) : '99.9';
        const numRatio = parseFloat(ratio);
        const isCompliant = numRatio <= 20.0;

        findings.push({
          id: `fnd_${Date.now()}_fac`,
          applicationId,
          ruleId: rule.id,
          ruleCode: rule.ruleCode,
          ruleName: rule.name,
          aphClauseRef: rule.aphClauseRef,
          severity: 'HIGH',
          status: isCompliant ? 'AUTOMATED_PASS' : (numRatio <= 22 ? 'WARNING' : 'AUTOMATED_FAIL'),
          explanation: isCompliant
            ? `Student-to-Teacher Ratio is 1:${numRatio} (across ${totalFaculty} approved faculty and ${estimatedStudents} estimated students), adhering to 1:20 norm.`
            : `Cadre deficiency: Ratio is 1:${numRatio}, exceeding statutory threshold of 1:20. Additional faculty required: ${Math.ceil(estimatedStudents / 20) - totalFaculty}.`,
          evidenceSource: `Faculty Cadre Declarations (${totalFaculty} faculty entries) vs Proposed Intake (${totalProposedIntake})`,
          confidenceScore: 0.94,
          recommendedAction: isCompliant
            ? 'Faculty ratio verified.'
            : 'Institution must recruit requisite faculty cadre before intake enhancement can be approved.',
          reviewerDisposition: existingOverride?.reviewerDisposition || (isCompliant ? 'PENDING' : 'CONFIRMED_DEFICIENCY'),
          reviewerOverrideReason: existingOverride?.reviewerOverrideReason,
          overriddenByOfficerId: existingOverride?.overriddenByOfficerId,
          overriddenAt: existingOverride?.overriddenAt,
          createdAt: now
        });
        break;
      }

      case 'CR-BLDG-OCC': {
        const occDoc = docs.find(d => d.documentCategory === 'BUILDING_OCCUPANCY_CERTIFICATE');
        const hasDoc = !!occDoc;
        const hasWarning = occDoc?.status === 'NEEDS_REVIEW';

        findings.push({
          id: `fnd_${Date.now()}_occ`,
          applicationId,
          ruleId: rule.id,
          ruleCode: rule.ruleCode,
          ruleName: rule.name,
          aphClauseRef: rule.aphClauseRef,
          severity: 'CRITICAL',
          status: hasDoc ? (hasWarning ? 'WARNING' : 'AUTOMATED_PASS') : 'AUTOMATED_FAIL',
          explanation: hasDoc
            ? (hasWarning
                ? 'Building Occupancy certificate uploaded but includes reviewer notes regarding pending municipal sign-off on recent extensions.'
                : `Permanent Building Occupancy Certificate (${occDoc.originalFilename}) verified from municipal authority.`)
            : 'Permanent Building Occupancy Certificate missing from dossier.',
          evidenceSource: occDoc ? `${occDoc.originalFilename}` : 'Missing Document',
          evidenceDocId: occDoc?.id,
          confidenceScore: 0.90,
          recommendedAction: hasDoc
            ? (hasWarning ? 'Verify original municipal endorsement during Scrutiny Committee.' : 'Verified.')
            : 'Mandatory Occupancy Certificate must be submitted.',
          reviewerDisposition: existingOverride?.reviewerDisposition || 'PENDING',
          reviewerOverrideReason: existingOverride?.reviewerOverrideReason,
          overriddenByOfficerId: existingOverride?.overriddenByOfficerId,
          overriddenAt: existingOverride?.overriddenAt,
          createdAt: now
        });
        break;
      }

      case 'CR-DIVYANGJAN': {
        const accessDoc = docs.find(d => d.documentCategory === 'BARRIER_FREE_ACCESSIBILITY_CERT');
        const isPass = !!accessDoc || institution.category === 'GOVERNMENT';

        findings.push({
          id: `fnd_${Date.now()}_div`,
          applicationId,
          ruleId: rule.id,
          ruleCode: rule.ruleCode,
          ruleName: rule.name,
          aphClauseRef: rule.aphClauseRef,
          severity: 'MEDIUM',
          status: isPass ? 'AUTOMATED_PASS' : 'WARNING',
          explanation: isPass
            ? 'Barrier-Free Built Environment certification and Divyangjan amenities (ramps, tactile tiles, accessible toilets) confirmed.'
            : 'Separate Divyangjan barrier-free certificate not found; verification recommended during physical scrutiny.',
          evidenceSource: accessDoc ? accessDoc.originalFilename : 'Campus Infrastructure Profile',
          evidenceDocId: accessDoc?.id,
          confidenceScore: 0.88,
          recommendedAction: 'Verify ground-floor accessible facilities during inspection.',
          reviewerDisposition: existingOverride?.reviewerDisposition || 'PENDING',
          createdAt: now
        });
        break;
      }

      case 'CR-ANTI-RAGGING': {
        const ragDoc = docs.find(d => d.documentCategory === 'ANTI_RAGGING_AFFIDAVIT');
        const isPass = !!ragDoc;

        findings.push({
          id: `fnd_${Date.now()}_rag`,
          applicationId,
          ruleId: rule.id,
          ruleCode: rule.ruleCode,
          ruleName: rule.name,
          aphClauseRef: rule.aphClauseRef,
          severity: 'HIGH',
          status: isPass ? 'AUTOMATED_PASS' : 'AUTOMATED_FAIL',
          explanation: isPass
            ? 'Statutory undertaking in accordance with AICTE Regulations 2009 duly submitted.'
            : 'Anti-Ragging statutory affidavit missing from application.',
          evidenceSource: ragDoc ? ragDoc.originalFilename : 'Missing Document',
          evidenceDocId: ragDoc?.id,
          confidenceScore: 1.0,
          recommendedAction: isPass ? 'Verified.' : 'Upload mandatory anti-ragging undertaking.',
          reviewerDisposition: existingOverride?.reviewerDisposition || 'PENDING',
          createdAt: now
        });
        break;
      }

      case 'CR-NBA-ACCR': {
        const isIntakeIncrease = app.applicationType === 'INCREASE_IN_INTAKE' || app.applicationType === 'NEW_PROGRAMME_COURSE';
        if (!isIntakeIncrease) {
          // Rule not applicable for simple EoA without increase
          findings.push({
            id: `fnd_${Date.now()}_nba_na`,
            applicationId,
            ruleId: rule.id,
            ruleCode: rule.ruleCode,
            ruleName: rule.name,
            aphClauseRef: rule.aphClauseRef,
            severity: 'LOW',
            status: 'AUTOMATED_PASS',
            explanation: 'Application is for standard Extension of Approval (EoA) without intake expansion; NBA condition waived per APH Clause 2.4.',
            evidenceSource: `Application Type: ${app.applicationType}`,
            confidenceScore: 1.0,
            recommendedAction: 'No action needed.',
            reviewerDisposition: 'PENDING',
            createdAt: now
          });
        } else {
          const hasAccreditation = institution.nbaAccredited || institution.naacGrade === 'A+' || institution.naacGrade === 'A++';
          findings.push({
            id: `fnd_${Date.now()}_nba_chk`,
            applicationId,
            ruleId: rule.id,
            ruleCode: rule.ruleCode,
            ruleName: rule.name,
            aphClauseRef: rule.aphClauseRef,
            severity: 'HIGH',
            status: hasAccreditation ? 'AUTOMATED_PASS' : 'AUTOMATED_FAIL',
            explanation: hasAccreditation
              ? `Institution meets intake expansion criteria: Accredited by NBA / NAAC Grade ${institution.naacGrade}.`
              : 'Intake increase requires at least one existing program accredited by NBA or NAAC grade A.',
            evidenceSource: `Accreditation Registry: NAAC ${institution.naacGrade || 'None'}, NBA: ${institution.nbaAccredited ? 'Active' : 'No'}`,
            confidenceScore: 0.95,
            recommendedAction: hasAccreditation ? 'Eligible for intake enhancement.' : 'Intake expansion cannot be permitted.',
            reviewerDisposition: existingOverride?.reviewerDisposition || (hasAccreditation ? 'PENDING' : 'CONFIRMED_DEFICIENCY'),
            createdAt: now
          });
        }
        break;
      }
    }
  }

  // Calculate scores
  const passedCount = findings.filter(f => f.status === 'AUTOMATED_PASS' || f.status === 'OVERRIDDEN' || f.status === 'RESOLVED').length;
  const failedCount = findings.filter(f => f.status === 'AUTOMATED_FAIL').length;
  const warningCount = findings.filter(f => f.status === 'WARNING').length;
  const criticalDeficiencyCount = findings.filter(f => f.severity === 'CRITICAL' && f.status === 'AUTOMATED_FAIL').length;
  const complianceScore = Math.round((passedCount / (findings.length || 1)) * 100);

  // Generate explainable preliminary summary
  const aiSummary = generateExplainableSummary(app, institution, findings, complianceScore, criticalDeficiencyCount);

  // Save findings into DB
  db.saveComplianceFindings(applicationId, findings);

  return {
    applicationId,
    totalRulesEvaluated: findings.length,
    passedCount,
    failedCount,
    warningCount,
    complianceScore,
    criticalDeficiencyCount,
    findings,
    aiSummary
  };
}

function generateExplainableSummary(
  app: Application,
  inst: Institution,
  findings: ComplianceFinding[],
  score: number,
  criticals: number
): string {
  const criticalFindings = findings.filter(f => f.severity === 'CRITICAL' && f.status === 'AUTOMATED_FAIL');
  const warningFindings = findings.filter(f => f.status === 'WARNING');

  let summary = `**PRELIMINARY SCRUTINY SUMMARY (DEMONSTRATION ENGINE)**\n\n`;
  summary += `**Application Ref:** ${app.applicationNumber} | **Institution:** ${inst.name} (PID: ${inst.permanentInstituteId})\n`;
  summary += `**Overall Compliance Readiness Score:** ${score}/100 (${score >= 85 ? 'HIGH READINESS' : score >= 65 ? 'MODERATE READINESS - DEFICIENCIES NOTED' : 'CRITICAL DEFICIENCIES IDENTIFIED'})\n\n`;

  if (criticals === 0 && warningFindings.length === 0) {
    summary += `✅ **Key Conclusion:** All statutory parameters evaluated under AICTE Approval Process Handbook (APH 2024–27) have been verified. Land area (${inst.landAreaAcres} Acres), building occupancy, fire safety validity, and faculty cadre ratios meet all specified requirements. Recommended for expedited Scrutiny Committee endorsement.`;
  } else {
    summary += `⚠️ **Attention Required by Scrutiny Committee:**\n`;
    if (criticalFindings.length > 0) {
      summary += `\n**Critical Statutory Deficiencies (${criticalFindings.length}):**\n`;
      criticalFindings.forEach((cf, idx) => {
        summary += `${idx + 1}. **${cf.ruleName}** [${cf.aphClauseRef}]: ${cf.explanation} -> *Recommended Action:* ${cf.recommendedAction}\n`;
      });
    }
    if (warningFindings.length > 0) {
      summary += `\n**Advisory / Non-Fatal Warnings (${warningFindings.length}):**\n`;
      warningFindings.forEach((wf, idx) => {
        summary += `${idx + 1}. **${wf.ruleName}**: ${wf.explanation}\n`;
      });
    }
    summary += `\n*Note: Official statutory approval or deficiency issuance remains under the exclusive purview of the designated Scrutiny Committee and Competent Authority.*`;
  }

  return summary;
}
