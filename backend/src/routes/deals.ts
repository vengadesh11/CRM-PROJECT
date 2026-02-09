import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import * as dealsController from '../controllers/deals';

const router = Router();

router.use(authenticateToken);

router.post('/bulk-delete', requirePermission('deals.delete'), dealsController.bulkDeleteDeals);

router.get('/', requirePermission('deals.view'), dealsController.getAllDeals);
router.get('/:id', requirePermission('deals.view'), dealsController.getDealById);
router.post('/', requirePermission('deals.create'), dealsController.createDeal);
router.put('/:id', requirePermission('deals.edit'), dealsController.updateDeal);
router.delete('/:id', requirePermission('deals.delete'), dealsController.deleteDeal);

export default router;
