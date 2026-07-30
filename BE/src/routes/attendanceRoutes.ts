import { Router } from 'express';
import {
  bulkUpdateAttendance,
  completeEvent,
  generateQr,
  getAttendanceByEvent,
  scanQr,
  updateAttendance,
} from '../controllers/attendanceController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();
const managers = ['ORGANIZER', 'ADMIN', 'SUPER_ADMIN'] as const;

router.post('/student/scan', authenticate, authorize(['STUDENT', 'CLASS_LEADER']), scanQr);
router.get('/event/:eventId', authenticate, authorize([...managers]), getAttendanceByEvent);
router.post('/event/:eventId/qr', authenticate, authorize([...managers]), generateQr);
router.put('/event/:eventId/bulk', authenticate, authorize([...managers]), bulkUpdateAttendance);
router.post('/event/:eventId/complete', authenticate, authorize([...managers]), completeEvent);
router.put('/:id/status', authenticate, authorize([...managers]), updateAttendance);
router.post('/complete', authenticate, authorize([...managers]), completeEvent);

export default router;
