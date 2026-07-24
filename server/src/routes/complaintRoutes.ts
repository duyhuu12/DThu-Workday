import { Router } from 'express';
import { getComplaints, createComplaint, respondComplaint } from '../controllers/complaintController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, getComplaints);
router.post('/', authenticate, createComplaint);
router.put('/:id/respond', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), respondComplaint);

export default router;
