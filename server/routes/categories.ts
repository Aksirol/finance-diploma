import express from 'express';
import type { Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { categorySchema } from '../schemas';

const router = express.Router();

// Отримати всі категорії поточного користувача (GET /api/categories)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Не авторизовано' });

        const categories = await prisma.category.findMany({
            where: { userId }
        });

        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка отримання категорій' });
    }
});

// Створити нову категорію (POST /api/categories)
router.post('/', authenticateToken, validate(categorySchema), async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { name, type, limit } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ error: 'Не авторизовано' });
        // Видаляємо ручну перевірку if (!name || !type) ...

        const category = await prisma.category.create({
            data: {
                name,
                type, // Очікується 'INCOME' або 'EXPENSE'
                limit: limit ? parseFloat(limit) : null,
                userId
            }
        });

        res.status(201).json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка створення категорії' });
    }
});

export default router;