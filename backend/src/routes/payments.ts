import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as paymentController from '../controllers/payments';

const router = Router();

// Ensure all routes are protected (or at least most of them)
router.use(authenticateToken);

router.post('/create-payment-intent', paymentController.createPaymentIntent);
router.post('/create-subscription', paymentController.createSubscription);
router.post('/create-portal-session', paymentController.createPortalSession);

export default router;
