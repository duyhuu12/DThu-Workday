import { Router } from 'express';
import { getFaculties, getClasses, getSettings, updateSettings } from '../controllers/systemController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/faculties', getFaculties);
router.get('/classes', getClasses);
router.get('/settings', getSettings);
router.put('/settings', authenticate, authorize(['SUPER_ADMIN']), updateSettings);

export default router;
