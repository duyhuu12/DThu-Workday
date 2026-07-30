import { Router } from 'express';
import { login, getCurrentUser, updateCurrentUser } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, updateCurrentUser);

export default router;
