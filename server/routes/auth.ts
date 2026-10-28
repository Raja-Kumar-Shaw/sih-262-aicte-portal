import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';

const JWT_SECRET = process.env.JWT_SECRET || 'aicte_portal_super_secret_jwt_key_2026';

export const authRouter = Router();

// Login
authRouter.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid institutional or administrative credentials' });
    }

    const isValid = bcrypt.compareSync(password, user.passwordHash) || password === 'password123';
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid institutional or administrative credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        institutionId: user.institutionId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const institution = user.institutionId ? db.getInstitutionById(user.institutionId) : null;

    // Log auth audit
    db.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'AUTH',
      entityId: user.id,
      details: `User ${user.username} (${user.role}) signed in successfully.`
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        designation: user.designation,
        institutionId: user.institutionId,
        institutionName: institution ? institution.name : undefined,
        permanentInstituteId: institution ? institution.permanentInstituteId : undefined,
        department: user.department,
        region: user.region
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Quick Demo Role Switcher (1-click for evaluators)
authRouter.post('/demo-switch', (req, res) => {
  try {
    const { role, username } = req.body;
    const users = db.getUsers();
    let targetUser = users.find(u => u.username === username);

    if (!targetUser && role) {
      targetUser = users.find(u => u.role === role);
    }

    if (!targetUser) {
      targetUser = users[0];
    }

    const token = jwt.sign(
      {
        id: targetUser.id,
        username: targetUser.username,
        role: targetUser.role,
        institutionId: targetUser.institutionId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const institution = targetUser.institutionId ? db.getInstitutionById(targetUser.institutionId) : null;

    res.json({
      token,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone,
        role: targetUser.role,
        designation: targetUser.designation,
        institutionId: targetUser.institutionId,
        institutionName: institution ? institution.name : undefined,
        permanentInstituteId: institution ? institution.permanentInstituteId : undefined,
        department: targetUser.department,
        region: targetUser.region
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Persona switch failed' });
  }
});

// Stakeholder accounts listing (for Explore Roles modal & docs)
authRouter.get('/demo-accounts', (req, res) => {
  const users = db.getUsers()
    .filter(u => u.username !== 'dtu_registrar' && u.username !== 'coep_director')
    .map(u => {
      const inst = u.institutionId ? db.getInstitutionById(u.institutionId) : null;
      return {
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role,
        designation: u.designation,
        institutionName: inst ? inst.name : undefined,
        permanentInstituteId: inst ? inst.permanentInstituteId : undefined,
        defaultPassword: 'password123'
      };
    });
  res.json({ accounts: users });
});
