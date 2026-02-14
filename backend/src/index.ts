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
import apiKeysRouter from './routes/api-keys';
import paymentsRouter from './routes/payments';
import suiteCrmRouter from './routes/suitecrm';
// import zohoRouter from './routes/zoho';

import espocrmRouter from './routes/espocrm';
import orocrmRouter from './routes/orocrm';
import whatsappRouter from './routes/whatsapp';
import integrationsRouter from './routes/integrations';
import salesSettingsRouter from './routes/salessettings';
import aiRouter from './routes/ai';


// Force restart
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Mount debug router at root level before other routes to catch the specific path
// app.use(crmIntegrationsRouter); // Disabling external router






// ============================================
// MIDDLEWARE
// ============================================

app.use((req, _res, next) => {
    console.log(`[DEBUG] Received ${req.method} ${req.url}`);
    next();
});

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
app.use('/api/crm/api-keys', apiKeysRouter);
app.use('/api/crm/payments', paymentsRouter);
app.use('/api/crm/integrations/suitecrm', suiteCrmRouter);
// app.use('/api/crm/integrations/zoho', zohoRouter);






app.use('/api/crm/integrations/espocrm', espocrmRouter);
app.use('/api/crm/integrations/orocrm', orocrmRouter);
app.use('/api/crm/integrations/whatsapp', whatsappRouter);
app.use('/api/crm/integrations', integrationsRouter);
app.use('/api/crm/sales-settings', salesSettingsRouter);
app.use('/api/crm/ai', aiRouter);



// 404 Handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    });
});

app.listen(PORT, () => {
    console.log(`DocuFlow CRM API Server running on port ${PORT}`);
});

export default app;


