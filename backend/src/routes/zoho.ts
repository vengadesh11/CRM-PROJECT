import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import * as zohoController from '../controllers/zoho';

const router = Router();

router.post('/sync', authenticateToken, requirePermission('integrations.edit'), zohoController.triggerSync);
router.get('/status', authenticateToken, requirePermission('integrations.view'), zohoController.getStatus);
router.post('/webhook', zohoController.handleWebhook);

export default router;
