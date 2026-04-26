import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import itemRoutes from './routes/items';
import departmentRoutes from './routes/departments';
import vendorRoutes from './routes/vendors';
import inventoryRoutes from './routes/inventory';
import fuelRoutes from './routes/fuel';
import promotionRoutes from './routes/promotions';
import reconRoutes from './routes/reconciliation';
import posRoutes from './routes/pos';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/recon', reconRoutes);
app.use('/api/pos', posRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
