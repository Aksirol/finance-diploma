import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet'; // <-- 1. Імпорт Helmet
import rateLimit from 'express-rate-limit'; // <-- 2. Імпорт Rate Limit

import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import transactionRoutes from './routes/transactions';
import analyticsRoutes from './routes/analytics';

dotenv.config();

if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in .env');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// === БЛОК БЕЗПЕКИ ===

// 1. Helmet: налаштовує безпечні HTTP-заголовки (ховає Express, захищає від XSS)
app.use(helmet());

// 2. CORS: дозволяємо запити лише з нашого клієнта
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

// 3. Rate Limiter: обмежуємо кількість запитів (захист від DDoS)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Вікно в 15 хвилин
    max: 150, // Максимум 150 запитів з однієї IP-адреси за вікно
    message: { error: 'Забагато запитів з вашої IP-адреси, спробуйте пізніше.' },
    standardHeaders: true, // Повертає інфо про ліміти в заголовках `RateLimit-*`
    legacyHeaders: false,
});

// Застосовуємо лімітер до всіх API-маршрутів
app.use('/api', apiLimiter);

// =====================

app.use(express.json());

// Підключаємо маршрути
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