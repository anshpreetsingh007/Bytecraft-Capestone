import * as dotenv from 'dotenv';

if (!process.env.DB_HOST) {
    dotenv.config({ path: '../../.env.local' });
}

import pool from './config/db';
import estimateRoutes from './routes/routes';
import { createServiceApp, finalizeServiceApp, startService } from './shared';

const SERVICE_NAME = 'estimate-service';
const port = Number(process.env.PORT || 3002);

const app = createServiceApp({ serviceName: SERVICE_NAME, pool });

app.use('/api/estimates', estimateRoutes);

finalizeServiceApp(app);
startService(app, { serviceName: SERVICE_NAME, port, pool });
