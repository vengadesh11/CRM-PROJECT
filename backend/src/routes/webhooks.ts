import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import * as webhookController from '../controllers/webhooks';

const router = Router();

// POST /api/crm/webhooks/stripe (Stripe sends events here)
// Note: This needs raw body for signature verification if not handled by global middleware.
// Assuming global middleware handles JSON, stripe.webhooks.constructEvent works with the raw buffer usually.
// For now, we rely on req.body if the parser preserves it conformantly, or we might need `express.raw`.
router.post('/stripe', webhookController.handleStripeWebhook);

router.use(authenticateToken);

// GET /api/crm/webhooks/endpoints
router.get('/endpoints', requirePermission('webhooks.view'), webhookController.getAllEndpoints);

// POST /api/crm/webhooks/endpoints
router.post('/endpoints', requirePermission('webhooks.create'), webhookController.createEndpoint);

// DELETE /api/crm/webhooks/endpoints/:id
router.delete('/endpoints/:id', requirePermission('webhooks.delete'), webhookController.deleteEndpoint);

// POST /api/crm/webhooks/test
router.post('/test', requirePermission('webhooks.create'), webhookController.testDispatch);

export default router;
