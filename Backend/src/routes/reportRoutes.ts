import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
  exportAdminStudents,
  exportAttendance,
  exportOrganizerEvents,
  getAdminSummary,
  getOrganizerSummary,
} from '../controllers/reportController.js';

const router = Router();

router.get('/admin/summary', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), getAdminSummary);
router.get('/admin/students.csv', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), exportAdminStudents);
router.get('/organizer/summary', authenticate, authorize(['ORGANIZER', 'ADMIN', 'SUPER_ADMIN']), getOrganizerSummary);
router.get('/organizer/events.csv', authenticate, authorize(['ORGANIZER', 'ADMIN', 'SUPER_ADMIN']), exportOrganizerEvents);
router.get('/events/:eventId/attendance.csv', authenticate, authorize(['ORGANIZER', 'ADMIN', 'SUPER_ADMIN']), exportAttendance);

export default router;
