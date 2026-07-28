import { Router } from 'express';
import { getCredits, adjustCredit, updateCreditStatus } from '../controllers/creditController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, getCredits);
router.put('/:id/status', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), updateCreditStatus);
router.put('/:id/adjust', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), adjustCredit);

export default router;
