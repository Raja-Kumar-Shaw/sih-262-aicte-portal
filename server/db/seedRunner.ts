import { db } from './database';

console.log('--- Initializing AICTE Portal Database Seeding ---');
const res = db.resetDatabase();
console.log(res.message);
console.log(`Users loaded: ${db.getUsers().length}`);
console.log(`Institutions loaded: ${db.getInstitutions().length}`);
console.log(`Applications loaded: ${db.getApplications().length}`);
console.log(`Compliance Rules: ${db.getComplianceRules().length}`);
const auditCheck = db.verifyAuditChain();
console.log(`Audit chain verification: ${auditCheck.message}`);
console.log('--- Seeding completed successfully ---');
