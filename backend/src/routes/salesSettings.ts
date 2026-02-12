import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import * as salesSettingsController from '../controllers/salesSettings';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticateToken);

// GET /api/crm/sales-settings/:category - Get all items
router.get('/:category', requirePermission('settings.view'), salesSettingsController.getItems);

// POST /api/crm/sales-settings/:category - Create new item
router.post('/:category', requirePermission('settings.edit'), salesSettingsController.createItem);

// PUT /api/crm/sales-settings/:category/:id - Update item
router.put('/:category/:id', requirePermission('settings.edit'), salesSettingsController.updateItem);

// DELETE /api/crm/sales-settings/:category/:id - Delete item
router.delete('/:category/:id', requirePermission('settings.edit'), salesSettingsController.deleteItem);

export default router;
