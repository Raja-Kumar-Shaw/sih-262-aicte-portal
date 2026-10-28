import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('========================================================================');
  console.log('★ SIH26262 — ACCEPTANCE & SYSTEM INTEGRATION TEST SUITE ★');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await test('API Health & System Status Endpoint', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'HEALTHY');
    assert.strictEqual(data.auditChainValid, true);
  });

  // 2. Authentication & Role Switcher
  let instToken = '';
  let officerToken = '';
  let adminToken = '';
  let auditorToken = '';

  await test('Authentication: Institution Persona Login (DTU Registrar)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'dtu_registrar', password: 'password123' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.token);
    assert.strictEqual(data.user.role, 'INSTITUTION');
    instToken = data.token;
  });

  await test('Authentication: Scrutiny Officer Login (Dr. Alok Sharma)', async () => {
    const res = await fetch(`${BASE_URL}/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'officer_sharma' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.user.role, 'SCRUTINY_OFFICER');
    officerToken = data.token;
  });

  await test('Authentication: Administrator Login (Er. Vivek Rastogi)', async () => {
    const res = await fetch(`${BASE_URL}/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'ADMIN' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.user.role, 'ADMIN');
    adminToken = data.token;
  });

  await test('Authentication: Auditor Login (Smt. Vandana Saxena)', async () => {
    const res = await fetch(`${BASE_URL}/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'AUDITOR' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.user.role, 'AUDITOR');
    auditorToken = data.token;
  });

  // 3. Journey A: Application Draft, Validation, and Scrutiny
  let createdAppId = '';
  await test('Journey A: Institution Creates New Application Draft', async () => {
    const res = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${instToken}`
      },
      body: JSON.stringify({
        applicationType: 'EXTENSION_OF_APPROVAL',
        academicYear: '2025-26',
        programmes: [
          {
            courseName: 'Computer Science and Engineering',
            programmeType: 'ENGINEERING_AND_TECHNOLOGY',
            level: 'UG',
            durationYears: 4,
            existingIntake: 180,
            proposedIntake: 180,
            nbaAccredited: true,
            facultyCount: 12
          }
        ]
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.ok(data.application.id);
    assert.ok(data.application.applicationNumber.startsWith('AICTE/2025-26/APP-'));
    assert.strictEqual(data.application.currentStage, 'DRAFT');
    createdAppId = data.application.id;
  });

  await test('Journey A: Reopen & Update Application Draft', async () => {
    const res = await fetch(`${BASE_URL}/applications/${createdAppId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${instToken}`
      },
      body: JSON.stringify({
        applicationType: 'INCREASE_IN_INTAKE'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.application.applicationType, 'INCREASE_IN_INTAKE');
  });

  // 4. Journey F (Negative Test): Prevent Submission with Missing Mandatory Documents
  await test('Journey F (Negative): Reject Submission when Mandatory Documents are Missing', async () => {
    const res = await fetch(`${BASE_URL}/applications/${createdAppId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${instToken}`
      }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.ok(data.error.includes('Mandatory documents missing'));
  });

  // 5. Journey B: Scrutiny Officer Inspects Case & Runs Preliminary Checks
  await test('Journey B: Scrutiny Officer Inspects Existing Case (APP-101-DTU)', async () => {
    const res = await fetch(`${BASE_URL}/applications/app_101`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.application.applicationNumber, 'AICTE/2025-26/APP-101-DTU');
    assert.ok(data.findings.length > 0);
    assert.ok(data.documents.length > 0);
  });

  await test('Journey B: Scrutiny Officer Runs Deterministic Compliance Engine', async () => {
    const res = await fetch(`${BASE_URL}/applications/app_101/run-scrutiny`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.result.complianceScore >= 0);
    assert.ok(data.result.totalRulesEvaluated >= 5);
  });

  await test('Journey B: Scrutiny Officer Posts Official Review Comment', async () => {
    const res = await fetch(`${BASE_URL}/workflow/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        applicationId: 'app_101',
        category: 'INFRASTRUCTURE',
        comment: 'Verified 164 acres contiguous land in Delhi Revenue Registry.'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.comment.category, 'INFRASTRUCTURE');
  });

  // 6. Differentiating Feature B: Reviewer Override with Mandatory Justification
  let targetFindingId = '';
  await test('Fetch current findings for app_101', async () => {
    const res = await fetch(`${BASE_URL}/compliance/findings/app_101`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.findings.length > 0);
    targetFindingId = data.findings[0].id;
  });

  await test('Differentiating Feature B: Reject Override without Justification (<15 chars)', async () => {
    const res = await fetch(`${BASE_URL}/compliance/findings/${targetFindingId}/override`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        disposition: 'ACCEPTED_WITH_EXCEPTION',
        justification: 'Too short'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.ok(data.error.includes('Mandatory justification required'));
  });

  await test('Differentiating Feature B: Successfully Record Signed Reviewer Override', async () => {
    const res = await fetch(`${BASE_URL}/compliance/findings/${targetFindingId}/override`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        disposition: 'ACCEPTED_WITH_EXCEPTION',
        justification: 'State Directorate of Technical Education granted temporary operational extension order #DTE-782; fire safety equipment verified on site.'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.finding.reviewerDisposition, 'ACCEPTED_WITH_EXCEPTION');
    assert.strictEqual(data.finding.status, 'OVERRIDDEN');
  });

  // 7. Journey C: Clarification Notice & Institutional Response
  await test('Advance app_101 to UNDER_SCRUTINY stage', async () => {
    // If not in UNDER_SCRUTINY, transition to it
    await fetch(`${BASE_URL}/workflow/transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        applicationId: 'app_101',
        targetStage: 'UNDER_SCRUTINY',
        actionName: 'Commence Scrutiny Committee Inspection'
      })
    });
  });

  await test('Journey C: Scrutiny Officer Issues Clarification Notice', async () => {
    const res = await fetch(`${BASE_URL}/workflow/clarification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        applicationId: 'app_101',
        requestQuery: 'Please provide updated structural stability report for Academic Block C addition.',
        deadlineDays: 7
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.clarification.status, 'PENDING_INSTITUTION');
  });

  await test('Journey C: Institution Submits Clarification Response', async () => {
    const listRes = await fetch(`${BASE_URL}/applications/app_101`, {
      headers: { 'Authorization': `Bearer ${instToken}` }
    });
    const listData = await listRes.json();
    const clr = listData.clarifications[0];
    assert.ok(clr);

    const res = await fetch(`${BASE_URL}/workflow/clarification/${clr.id}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${instToken}`
      },
      body: JSON.stringify({
        remarks: 'Structural stability test completed by Chartered Structural Engineer; municipal endorsement attached.'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.clarification.status, 'SUBMITTED');
  });

  // 8. Journey D: Administrator Controls & SLA Configuration
  await test('Journey D: Administrator Reassigns Reviewer', async () => {
    const res = await fetch(`${BASE_URL}/workflow/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        applicationId: 'app_103',
        officerId: 'usr_officer_2'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.application.assignedOfficerId, 'usr_officer_2');
  });

  await test('Journey D: Administrator Updates SLA Threshold Configuration', async () => {
    const res = await fetch(`${BASE_URL}/audit/configurations/SLA_SCRUTINY_OFFICER_DAYS`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ value: '5' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.configuration.value, '5');
  });

  await test('Journey D: Administrator Fetches Executive Analytics & Bottleneck Telemetry', async () => {
    const res = await fetch(`${BASE_URL}/analytics/overview`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.summary.totalApplications >= 6);
    assert.ok(data.byStage.length > 0);
    assert.ok(data.bottlenecks.length > 0);
  });

  // 9. Journey E: Auditor Verification & Read-Only Enforcement
  await test('Journey E: Auditor Verifies Cryptographic SHA-256 Audit Chain', async () => {
    const res = await fetch(`${BASE_URL}/audit/verify`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${auditorToken}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.isValid, true);
    assert.ok(data.checkedBlocks >= 7);
  });

  await test('Journey E (Negative): Auditor Cannot Modify Application Decisions (Read-Only Enforcement)', async () => {
    const res = await fetch(`${BASE_URL}/workflow/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auditorToken}`
      },
      body: JSON.stringify({
        applicationId: 'app_101',
        decision: 'APPROVED',
        remarks: 'Attempted auditor override'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400); // Caught by WorkflowService role check
    assert.ok(data.error.includes('Unauthorized'));
  });

  // 10. Journey F: Invalid Workflow Transition Rejected
  await test('Journey F (Negative): Reject Invalid Workflow Stage Transition', async () => {
    const res = await fetch(`${BASE_URL}/workflow/transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        applicationId: createdAppId,
        targetStage: 'APPROVED' // DRAFT directly to APPROVED is illegal
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.ok(data.error.includes('Illegal workflow transition'));
  });

  console.log('\n========================================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
