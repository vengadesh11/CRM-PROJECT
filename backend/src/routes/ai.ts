import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { generateDealData, scoreDeal, draftDealEmail } from '../ai/geminiService';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/deals/smart-fill', async (req: AuthRequest, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: 'Text prompt is required' });
        }
        const data = await generateDealData(text);
        return res.json({ success: true, data });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/deals/score', async (req: AuthRequest, res) => {
    try {
        const { dealData } = req.body;
        const result = await scoreDeal(dealData);
        return res.json({ success: true, ...result });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/deals/draft-email', async (req: AuthRequest, res) => {
    try {
        const { dealData } = req.body;
        const draft = await draftDealEmail(dealData);
        return res.json({ success: true, draft });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
