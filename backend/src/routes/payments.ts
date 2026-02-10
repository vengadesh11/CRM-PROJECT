import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as paymentController from '../controllers/payments';

const router = Router();

// Ensure all routes are protected (or at least most of them)
router.use(authenticateToken);

router.post('/create-payment-intent', paymentController.createPaymentIntent);
router.post('/create-subscription', paymentController.createSubscription);
router.post('/create-portal-session', paymentController.createPortalSession);
router.get('/list-payment-methods', paymentController.listPaymentMethods);
router.post('/setup-intent', paymentController.createSetupIntent);
router.post('/set-default-payment-method', paymentController.setDefaultPaymentMethod);
router.post('/detach-payment-method', paymentController.detachPaymentMethod);
router.get('/subscription-status', paymentController.getSubscriptionStatus);

export default router;
