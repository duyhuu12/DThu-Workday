import { Router } from 'express';
import { getCredits, adjustCredit } from '../controllers/creditController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, getCredits);
router.put('/:id/adjust', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), adjustCredit);

export default router;
