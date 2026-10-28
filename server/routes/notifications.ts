import { Router } from 'express';
import { db } from '../db/database';
import { authenticate, AuthenticatedRequest } from './middleware';

export const notificationsRouter = Router();

notificationsRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const notifs = db.getNotifications(user.id, user.role);
    const unreadCount = notifs.filter(n => !n.isRead).length;
    res.json({ notifications: notifs, unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch notifications' });
  }
});

notificationsRouter.put('/:id/read', authenticate, (req, res) => {
  const { id } = req.params;
  const success = db.markNotificationRead(id);
  res.json({ success });
});

notificationsRouter.post('/read-all', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const success = db.markAllNotificationsRead(user.id, user.role);
  res.json({ success });
});
