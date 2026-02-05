import 'dotenv/config';

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

// Import CRM routes
import leadsRouter from './routes/leads';
import dealsRouter from './routes/deals';
import customersRouter from './routes/customers';
import customFieldsRouter from './routes/custom-fields';
import authRouter from './routes/auth';
import uploadsRouter from './routes/uploads';
import departmentsRouter from './routes/departments';
import rolesRouter from './routes/roles';
import permissionsRouter from './routes/permissions';
import usersRouter from './routes/users';
import subscriptionsRouter from './routes/subscriptions';
import analyticsRouter from './routes/analytics';
import webhooksRouter from './routes/webhooks';
import integrationsRouter from './routes/integrations';
import apiKeysRouter from './routes/api-keys';

// Force restart
const app: Application = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ============================================
// ROUTES
// ============================================

app.get('/health', (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'DocuFlow CRM API is running',
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/crm/auth', authRouter);
app.use('/api/crm/uploads', uploadsRouter);
app.use('/api/crm/departments', departmentsRouter);
app.use('/api/crm/roles', rolesRouter);
app.use('/api/crm/permissions', permissionsRouter);
app.use('/api/crm/users', usersRouter);
app.use('/api/crm/leads', leadsRouter);
app.use('/api/crm/deals', dealsRouter);
app.use('/api/crm/customers', customersRouter);
app.use('/api/crm/custom-fields', customFieldsRouter);
app.use('/api/crm/subscriptions', subscriptionsRouter);
app.use('/api/crm/analytics', analyticsRouter);
app.use('/api/crm/webhooks', webhooksRouter);
app.use('/api/crm/integrations', integrationsRouter);
app.use('/api/crm/api-keys', apiKeysRouter);

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    });
});

app.listen(PORT, () => {
    console.log(`🚀 DocuFlow CRM API Server running on port ${PORT}`);
});

export default app;
