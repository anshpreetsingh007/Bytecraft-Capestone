import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import submissionRoutes from './routes/routes';

<<<<<<< HEAD
// In Docker, env vars are injected by compose. Only load .env.local for local dev.
=======
>>>>>>> origin/main
if (!process.env.DB_HOST) {
  dotenv.config({ path: '../../.env.local' });
}

const app = express();
const port = process.env.PORT || 3007;

app.use(cors());
app.use(express.json());

<<<<<<< HEAD
app.use('/api/inspection-requests', submissionRoutes);
=======
app.use('/api', submissionRoutes);
>>>>>>> origin/main

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'submission-service' });
});

app.listen(port, () => {
  console.log(`Submission service running on http://localhost:${port}`);
<<<<<<< HEAD
});
=======
});
>>>>>>> origin/main
