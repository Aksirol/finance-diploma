import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import transactionRoutes from './routes/transactions';
import analyticsRoutes from './routes/analytics';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);

// Підключаємо маршрути
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes); // <-- 2. Додаємо маршрут

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ message: 'Сервер фінансової платформи працює успішно! 🚀' });
});

app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});