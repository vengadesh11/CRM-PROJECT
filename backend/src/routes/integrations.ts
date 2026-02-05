import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import * as integrationController from '../controllers/integrations';

const router = Router();

router.use(authenticateToken);

// GET /api/crm/integrations
router.get('/', requirePermission('integrations.view'), integrationController.getIntegrations);

// PATCH /api/crm/integrations/:id
router.patch('/:id', requirePermission('integrations.edit'), integrationController.updateIntegration);

// GET /api/crm/integrations/:id/logs
router.get('/:id/logs', requirePermission('integrations.view'), integrationController.getIntegrationLogs);

export default router;
