import express from 'express';
import type { Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { calculateLinearRegression } from '../utils/regression';

const router = express.Router();

// GET /api/analytics/predict
router.get('/predict', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Не авторизовано' });

        // Отримуємо всі витрати користувача, відсортовані за датою
        const expenses = await prisma.transaction.findMany({
            where: {
                userId,
                type: 'EXPENSE'
            },
            orderBy: { date: 'asc' }
        });

        if (expenses.length === 0) {
            return res.json({ prediction: 0, message: 'Недостатньо даних' });
        }

        // Групуємо витрати по місяцях (формат "РРРР-ММ")
        const monthlyTotals: Record<string, number> = {};

        expenses.forEach(exp => {
            // Отримуємо рядок року і місяця, наприклад "2026-03"
            const monthKey = exp.date.toISOString().substring(0, 7);
            monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + exp.amount;
        });

        // Перетворюємо об'єкт у масив сум у хронологічному порядку
        const historicalData = Object.values(monthlyTotals);

        // Розраховуємо прогноз
        const predictedAmount = calculateLinearRegression(historicalData);

        res.json({
            historicalData,
            prediction: predictedAmount,
            monthsAnalyzed: historicalData.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка розрахунку прогнозу' });
    }
});

export default router;