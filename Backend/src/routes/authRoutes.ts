import { Router } from 'express';
import {
  login,
  getCurrentUser,
  updateCurrentUser,
  updateCurrentUserAvatar,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
} from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.post('/login', login);
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/verify', verifyPasswordResetOtp);
router.post('/password-reset/confirm', resetPassword);
router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, updateCurrentUser);
router.put('/me/avatar', authenticate, updateCurrentUserAvatar);

export default router;
