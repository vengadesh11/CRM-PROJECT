import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import * as leadsController from '../controllers/leads';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/crm/leads/bulk-delete - Bulk delete leads
router.post('/bulk-delete', requirePermission('leads.delete'), leadsController.bulkDeleteLeads);

// GET /api/crm/leads - Get all leads
router.get('/', requirePermission('leads.view'), leadsController.getAllLeads);

// GET /api/crm/leads/:id - Get single lead
router.get('/:id', requirePermission('leads.view'), leadsController.getLeadById);

// POST /api/crm/leads - Create new lead
router.post('/', requirePermission('leads.create'), leadsController.createLead);

// PUT /api/crm/leads/:id - Update lead
router.put('/:id', requirePermission('leads.edit'), leadsController.updateLead);

// DELETE /api/crm/leads/:id - Delete lead
router.delete('/:id', requirePermission('leads.delete'), leadsController.deleteLead);

export default router;
