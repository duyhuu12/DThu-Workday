import { Router } from 'express';
import { getRegistrations, registerEvent, cancelRegistration, updateRegistrationStatus } from '../controllers/registrationController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, getRegistrations);
router.post('/', authenticate, registerEvent);
router.post('/:id/cancel', authenticate, cancelRegistration);
router.put('/:id/status', authenticate, authorize(['ORGANIZER', 'ADMIN', 'SUPER_ADMIN']), updateRegistrationStatus);

export default router;
