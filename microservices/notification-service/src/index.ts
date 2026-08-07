import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import notificationRoutes from './routes/routes';

// In Docker, env vars are injected by compose. Only load .env.local for local dev.
if (!process.env.DB_HOST) {
  dotenv.config({ path: '../../.env.local' });
}

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

app.use('/api/notifications', notificationRoutes);

app.get('/health', (req: express.Request, res: express.Response) => {
    res.json({ status: 'ok', service: 'notification-service' });
});

app.listen(port, () => {
    console.log(`Notification service running on http://localhost:${port}`);
});