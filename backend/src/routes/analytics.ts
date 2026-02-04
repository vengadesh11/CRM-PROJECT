import { Router } from 'express';
import * as analyticsController from '../controllers/analytics';

const router = Router();

router.post('/events', analyticsController.trackEvent);

export default router;
