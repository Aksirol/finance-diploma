import express from 'express';
import type { Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Отримати всі транзакції користувача (GET /api/transactions)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Не авторизовано' });

        const transactions = await prisma.transaction.findMany({
            where: { userId },
            include: {
                category: true, // Додаємо дані про категорію до кожної транзакції
            },
            orderBy: {
                date: 'desc', // Сортуємо від найновіших до найстаріших
            },
        });

        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка отримання транзакцій' });
    }
});

// Створити нову транзакцію (POST /api/transactions)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { amount, type, categoryId, description, date } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ error: 'Не авторизовано' });
        if (!amount || !type || !categoryId) {
            return res.status(400).json({ error: 'Сума, тип та категорія є обовʼязковими' });
        }

        const category = await prisma.category.findUnique({
            where: { id: parseInt(categoryId) }
        });

        if (!category || category.userId !== userId) {
            return res.status(403).json({ error: 'Недійсний ID категорії' });
        }

        const transactionDate = date ? new Date(date) : new Date();

        const transaction = await prisma.transaction.create({
            data: {
                amount: parseFloat(amount),
                type,
                categoryId: parseInt(categoryId),
                description: description || null,
                date: transactionDate,
                userId
            }
        });

        // НОВА ЛОГІКА: Перевірка місячного ліміту
        let warning = null;

        // Перевіряємо, чи це витрата і чи встановлено для цієї категорії ліміт
        if (type === 'EXPENSE' && category.limit) {
            // Знаходимо перший і останній день місяця цієї транзакції
            const startOfMonth = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), 1);
            const endOfMonth = new Date(transactionDate.getFullYear(), transactionDate.getMonth() + 1, 0, 23, 59, 59);

            // Рахуємо суму всіх витрат у цій категорії за цей місяць
            const monthlyExpenses = await prisma.transaction.aggregate({
                where: {
                    categoryId: category.id,
                    type: 'EXPENSE',
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    }
                },
                _sum: { amount: true }
            });

            const totalSpent = monthlyExpenses._sum.amount || 0;

            // Якщо витрати більші за ліміт, формуємо попередження
            if (totalSpent > category.limit) {
                warning = `Увага! Ви перевищили ліміт у категорії "${category.name}".\nВстановлений ліміт: ${category.limit} ₴\nВитрачено за місяць: ${totalSpent} ₴.`;
            }
        }

        // Повертаємо транзакцію і попередження (якщо воно є)
        res.status(201).json({ transaction, warning });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка створення транзакції' });
    }
});

export default router;