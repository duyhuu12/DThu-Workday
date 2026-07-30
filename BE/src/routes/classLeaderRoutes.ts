import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
  assignLeader,
  exportWorkCredits,
  getAssignments,
  getDashboard,
  getEvents,
  getProfile,
  getStudents,
  remindWorkdays,
  removeLeader,
  reviewRegistration,
  sendNotification,
} from '../controllers/classLeaderController.js';

const router = Router();

router.get('/admin/assignments', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), getAssignments);
router.put('/admin/assign', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), assignLeader);
router.delete('/admin/assignments/:userId', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), removeLeader);

router.use(authenticate, authorize(['CLASS_LEADER']));
router.get('/profile', getProfile);
router.get('/dashboard', getDashboard);
router.get('/events', getEvents);
router.get('/students', getStudents);
router.put('/registrations/:id/preliminary', reviewRegistration);
router.post('/notifications', sendNotification);
router.post('/reminders/workdays', remindWorkdays);
router.get('/reports/work-credits.csv', exportWorkCredits);

export default router;
