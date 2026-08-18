import * as dotenv from 'dotenv';

if (!process.env.DB_HOST) {
    dotenv.config({ path: '../../.env.local' });
}

import { pool } from './config/db';
import reportRoutes from './routes/routes';
import jobReportRoutes from './routes/jobReportRoutes';
import { createServiceApp, finalizeServiceApp, startService } from './shared';

const SERVICE_NAME = 'report-service';
const port = Number(process.env.PORT || 3006);

const app = createServiceApp({ serviceName: SERVICE_NAME, pool });

app.use('/api/reports', reportRoutes);
app.use('/api/job-reports', jobReportRoutes);

finalizeServiceApp(app);
startService(app, { serviceName: SERVICE_NAME, port, pool });
