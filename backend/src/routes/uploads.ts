import { Router } from 'express';
import multer from 'multer';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024)
    }
});

// POST /api/crm/uploads
router.post('/', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
    try {
        const file = req.file;
        const { module, field_id } = req.body as { module?: string; field_id?: string };

        if (!file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const bucket = process.env.SUPABASE_UPLOADS_BUCKET || 'crm-uploads';
        const userId = req.user?.id || 'anonymous';
        const safeName = file.originalname.replace(/\s+/g, '-');
        const path = `${module || 'general'}/${field_id || 'field'}/${userId}/${Date.now()}-${safeName}`;

        const { error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(path, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }

        const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

        return res.status(201).json({
            success: true,
            url: data.publicUrl,
            path
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message || 'Upload failed' });
    }
});

export default router;
