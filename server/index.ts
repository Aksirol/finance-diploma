import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import transactionRoutes from './routes/transactions';
import analyticsRoutes from './routes/analytics';

dotenv.config();

// Перевірка наявності критичних змінних середовища
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in .env');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Закриваємо CORS тільки для нашого фронтенду
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json());

// Підключаємо всі маршрути в правильному логічному порядку
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ message: 'Сервер працює! 🚀' });
});

app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});