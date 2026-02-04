import { Router } from 'express';
import * as subscriptionsController from '../controllers/subscriptions';

const router = Router();

router.post('/', subscriptionsController.createSubscription);

export default router;
