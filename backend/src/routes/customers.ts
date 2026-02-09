import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import * as customersController from '../controllers/customers';

import multer from 'multer';
import { extractCustomerDataFromLicense } from '../ai/geminiService';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

router.post('/extract', upload.single('file'), async (req: AuthRequest, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const data = await extractCustomerDataFromLicense(req.file.buffer, req.file.mimetype);
        return res.json({ success: true, data });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/bulk-delete', requirePermission('customers.delete'), customersController.bulkDeleteCustomers);

router.get('/', requirePermission('customers.view'), customersController.getAllCustomers);
router.get('/:id', requirePermission('customers.view'), customersController.getCustomerById);
router.post('/', requirePermission('customers.create'), customersController.createCustomer);
router.put('/:id', requirePermission('customers.edit'), customersController.updateCustomer);
router.delete('/:id', requirePermission('customers.delete'), customersController.deleteCustomer);

export default router;
