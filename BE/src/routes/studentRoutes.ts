import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { getHistory, getProfile } from '../controllers/studentController.js';

const router = Router();

router.use(authenticate, authorize(['STUDENT', 'CLASS_LEADER']));
router.get('/profile', getProfile);
router.get('/history', getHistory);

export default router;
