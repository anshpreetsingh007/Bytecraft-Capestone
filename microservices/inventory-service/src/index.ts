import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import inventoryRoutes from './routes/routes';

dotenv.config({ path: '../../.env.local' });

const app = express();
const port = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.use('/api/inventory', inventoryRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'inventory-service' });
});

app.listen(port, () => {
    console.log(`Inventory service running on http://localhost:${port}`);
});
