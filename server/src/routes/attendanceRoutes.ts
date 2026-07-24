import { Router } from 'express';
import { getAttendanceByEvent, updateAttendance, completeEvent } from '../controllers/attendanceController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/event/:eventId', authenticate, authorize(['ORGANIZER', 'ADMIN', 'SUPER_ADMIN']), getAttendanceByEvent);
router.put('/:id/status', authenticate, authorize(['ORGANIZER', 'ADMIN', 'SUPER_ADMIN']), updateAttendance);
router.post('/complete', authenticate, authorize(['ORGANIZER', 'ADMIN', 'SUPER_ADMIN']), completeEvent);

export default router;
