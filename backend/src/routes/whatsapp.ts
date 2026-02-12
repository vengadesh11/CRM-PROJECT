import { Router } from 'express';
import * as whatsappController from '../controllers/whatsapp';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = Router();

// Webhook verification (GET) - Public, but secured by verify_token
router.get('/webhook', whatsappController.verifyWebhook);

// Webhook event receiver (POST) - Public, verified by signature (TODO: Add signature verification middleware)
router.post('/webhook', whatsappController.receiveWebhook);

// Send message - Protected
router.post('/send', authenticateToken, requirePermission('integrations.edit'), whatsappController.sendMessage);

export default router;
