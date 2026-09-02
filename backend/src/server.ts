import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import productRoutes from './routes/productRoutes';
import challanRoutes from './routes/challanRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Mini ERP + CRM API Portal',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/challans', challanRoutes);

// 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `API Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mini ERP API Server running on port ${PORT}`);
  console.log(`📡 Health Check available at http://localhost:${PORT}/api/health`);
});

export default app;
