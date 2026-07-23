import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import estimateRoutes from './routes/routes';

// Load environment variables from the shared .env.local file
// The path is relative to where you run the command (microservices/estimate-service/)
dotenv.config({ path: '../../.env.local' });

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(cors());            // Allow cross-origin requests from your Next.js frontend
app.use(express.json());    // Parse incoming JSON request bodies

// Mount the estimate routes at /api/estimates
// This means: all routes defined in estimate.routes.ts get prefixed with /api/estimates
// So router.get('/') becomes GET /api/estimates/
// And router.get('/:id') becomes GET /api/estimates/:id
app.use('/api/estimates', estimateRoutes);

// Health check endpoint — useful for testing if the server is running
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'estimate-service' });
});

// Start the server
app.listen(port, () => {
    console.log(`Estimate service running on http://localhost:${port}`);
});
