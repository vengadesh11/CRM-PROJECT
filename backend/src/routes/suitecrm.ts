import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import * as suiteCrmController from '../controllers/suitecrm';

const router = Router();

console.log('LOADING SuiteCRM Routes...'); // DEBUG log

/**
 * SuiteCRM integration endpoints
 * Sync and status endpoints require authentication & permissions
 */
router.get('/ping', (_req: any, res: any) => res.send('PONG')); // DEBUG Route
router.post('/sync', authenticateToken, requirePermission('integrations.edit'), suiteCrmController.triggerSync);
router.get('/status', authenticateToken, requirePermission('integrations.view'), suiteCrmController.getStatus);

/**
 * Incoming SuiteCRM webhook can be public if a shared secret isn't required.
 * If you want to verify the payload, add middleware that checks headers or query tokens.
 */
router.post('/webhook', suiteCrmController.handleWebhook);

export default router;
