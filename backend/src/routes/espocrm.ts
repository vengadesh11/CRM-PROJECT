import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import * as espocrmController from '../controllers/espocrm';

const router = Router();

router.post('/sync', authenticateToken, requirePermission('integrations.edit'), espocrmController.triggerSync);
router.get('/status', authenticateToken, requirePermission('integrations.view'), espocrmController.getStatus);
router.post('/webhook', espocrmController.handleWebhook);

export default router;
