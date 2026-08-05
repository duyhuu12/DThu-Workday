import { Router } from 'express';
import { getEvents, getEventById, createEvent, updateEvent } from '../controllers/eventController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, getEvents);
router.get('/:id', authenticate, getEventById);
router.post('/', authenticate, authorize(['ORGANIZER', 'ADMIN', 'SUPER_ADMIN']), createEvent);
router.put('/:id', authenticate, authorize(['ORGANIZER', 'ADMIN', 'SUPER_ADMIN']), updateEvent);

export default router;
