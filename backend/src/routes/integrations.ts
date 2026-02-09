import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import * as integrationController from '../controllers/integrations';
import * as zohoController from '../controllers/zoho';


const router = Router();

router.use(authenticateToken);

// GET /api/crm/integrations
router.get('/', requirePermission('integrations.view'), integrationController.getIntegrations);

// PATCH /api/crm/integrations/:id
router.patch('/:id', requirePermission('integrations.edit'), integrationController.updateIntegration);

// GET /api/crm/integrations/:id/logs
router.get('/:id/logs', requirePermission('integrations.view'), integrationController.getIntegrationLogs);

router.post('/:provider/secret', requirePermission('integrations.edit'), integrationController.setIntegrationSecret);

// ✅ FIXED: POST /api/crm/integrations/zoho/sync
router.post(
    '/zoho/sync',
    requirePermission('integrations.edit'),
    async (_req, res) => {
        return res.status(200).json({

            success: true,
            message: 'Zoho sync endpoint reached ✅'
        });
    }
);

// ✅ Zoho Status
router.get('/zoho/status', requirePermission('integrations.view'), zohoController.getStatus);

export default router;

