import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import * as orocrmController from '../controllers/orocrm';

const router = Router();

router.post('/sync', authenticateToken, requirePermission('integrations.edit'), orocrmController.triggerSync);
router.get('/status', authenticateToken, requirePermission('integrations.view'), orocrmController.getStatus);
router.post('/webhook', orocrmController.handleWebhook);

export default router;
