import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import * as customFieldsController from '../controllers/custom-fields';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('settings.view'), customFieldsController.getAllCustomFields);
router.get('/:id', requirePermission('settings.view'), customFieldsController.getCustomFieldById);
router.post('/', requirePermission('settings.edit'), customFieldsController.createCustomField);
router.put('/:id', requirePermission('settings.edit'), customFieldsController.updateCustomField);
router.delete('/:id', requirePermission('settings.edit'), customFieldsController.deleteCustomField);

export default router;
