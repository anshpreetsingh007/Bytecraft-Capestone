import * as dotenv from 'dotenv';

// In Docker, env vars are injected by compose. Only load .env.local for local dev.
if (!process.env.DB_HOST) {
    dotenv.config({ path: '../../.env.local' });
}

import pool from './config/db';
import submissionRoutes from './routes/routes';
import ordersRoutes from './routes/orderRoutes';
import inspectorsRoutes from './routes/inspectorsRoutes';
import { createServiceApp, finalizeServiceApp, startService } from './shared';

const SERVICE_NAME = 'submission-service';
const port = Number(process.env.PORT || 3007);

const app = createServiceApp({ serviceName: SERVICE_NAME, pool });

app.use('/api/inspection-requests', submissionRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/inspectors', inspectorsRoutes);

finalizeServiceApp(app);
startService(app, { serviceName: SERVICE_NAME, port, pool });
