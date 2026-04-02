import express from 'express';
import type { Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
// ДОДАНО: transactionQuerySchema та logger
import { transactionSchema, idParamSchema, transactionQuerySchema } from '../schemas';
import { logger } from '../utils/logger';

const router = express.Router();

// Отримати всі транзакції з пагінацією та фільтрацією (GET /api/transactions)
router.get('/', authenticateToken, validate(transactionQuerySchema), async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Не авторизовано' });

        // Дістаємо параметри з URL (з дефолтними значеннями)
        const page = parseInt(req.query.page as string || '1');
        const limit = parseInt(req.query.limit as string || '50'); // Ставимо 50, щоб поки не зламати фронтенд
        const skip = (page - 1) * limit;

        const { startDate, endDate, type } = req.query;

        // Будуємо об'єкт фільтрації (whereClause)
        const whereClause: any = { userId };

        if (type) whereClause.type = type;

        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) whereClause.date.gte = new Date(startDate as string);
            if (endDate) whereClause.date.lte = new Date(endDate as string);
        }

        // Паралельно робимо 2 запити: отримуємо самі дані та їх загальну кількість
        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where: whereClause,
                include: { category: true },
                orderBy: { date: 'desc' },
                skip,
                take: limit,
            }),
            prisma.transaction.count({ where: whereClause })
        ]);

        // Повертаємо дані разом з метаданими для пагінації
        res.json({
            data: transactions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        });
    } catch (error) {
        // Використовуємо наш новий професійний логер!
        logger.error(error, 'Помилка отримання транзакцій');
        res.status(500).json({ error: 'Помилка отримання транзакцій' });
    }
});

// Створити нову транзакцію (POST /api/transactions)
router.post('/', authenticateToken, validate(transactionSchema), async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { amount, type, categoryId, description, date } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ error: 'Не авторизовано' });

        const category = await prisma.category.findUnique({
            where: { id: categoryId }
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
        logger.error(error, 'Опис помилки');
        res.status(500).json({ error: 'Помилка створення транзакції' });
    }
});

// Видалити транзакцію (DELETE /api/transactions/:id)
// Видалити транзакцію (DELETE /api/transactions/:id)
router.delete('/:id', authenticateToken, validate(idParamSchema), async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const transactionId = parseInt(req.params.id as string); // <-- Додали as string

        if (!userId) return res.status(401).json({ error: 'Не авторизовано' });

        // Перевіряємо, чи належить транзакція користувачу
        const existingTransaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
        if (!existingTransaction || existingTransaction.userId !== userId) {
            return res.status(404).json({ error: 'Транзакцію не знайдено' });
        }

        await prisma.transaction.delete({
            where: { id: transactionId }
        });

        res.json({ message: 'Транзакцію успішно видалено' });
    } catch (error) {
        logger.error(error, 'Опис помилки');
        res.status(500).json({ error: 'Помилка видалення транзакції' });
    }
});

export default router;