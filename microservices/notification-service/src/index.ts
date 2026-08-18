import * as dotenv from 'dotenv';

// In Docker, env vars are injected by compose. Only load .env.local for local dev.
if (!process.env.DB_HOST) {
    dotenv.config({ path: '../../.env.local' });
}

import { pool } from './config/db';
import notificationRoutes from './routes/routes';
import { createServiceApp, finalizeServiceApp, startService } from './shared';

const SERVICE_NAME = 'notification-service';
const port = Number(process.env.PORT || 3005);

const app = createServiceApp({ serviceName: SERVICE_NAME, pool });

app.use('/api/notifications', notificationRoutes);

finalizeServiceApp(app);
startService(app, { serviceName: SERVICE_NAME, port, pool });
