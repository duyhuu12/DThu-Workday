import { Router } from 'express';
import {
  bulkUpdateAttendance,
  completeEvent,
  generateQr,
  getSession,
  getAttendanceByEvent,
  scanQr,
  startSession,
  stopSession,
  updateAttendance,
} from '../controllers/attendanceController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();
const managers = ['ORGANIZER', 'ADMIN', 'SUPER_ADMIN'] as const;

router.post('/student/scan', authenticate, authorize(['STUDENT']), scanQr);
router.get('/event/:eventId', authenticate, authorize([...managers]), getAttendanceByEvent);
router.get('/event/:eventId/session', authenticate, authorize([...managers]), getSession);
router.post('/event/:eventId/session/start', authenticate, authorize([...managers]), startSession);
router.post('/event/:eventId/session/stop', authenticate, authorize([...managers]), stopSession);
router.post('/event/:eventId/qr', authenticate, authorize([...managers]), generateQr);
router.put('/event/:eventId/bulk', authenticate, authorize([...managers]), bulkUpdateAttendance);
router.post('/event/:eventId/complete', authenticate, authorize([...managers]), completeEvent);
router.put('/:id/status', authenticate, authorize([...managers]), updateAttendance);
router.post('/complete', authenticate, authorize([...managers]), completeEvent);

export default router;
