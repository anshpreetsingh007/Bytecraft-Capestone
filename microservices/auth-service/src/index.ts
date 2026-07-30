import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import authRoutes from './routes/routes';

// In Docker, env vars are injected by compose. Only load .env.local for local dev.
if (!process.env.DB_HOST) {
  dotenv.config({ path: '../../.env.local' });
}

const app = express();
const port = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'auth-service' });
});

app.listen(port, () => {
    console.log(`Auth service running on http://localhost:${port}`);
});