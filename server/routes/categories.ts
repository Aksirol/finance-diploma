import express from 'express';
import type { Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { categorySchema, idParamSchema, updateCategorySchema } from '../schemas';
import { logger } from '../utils/logger';

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
        logger.error(error, 'Помилка отримання категорій');;
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
        logger.error(error, 'Помилка створення категорії');
    }
});

// Редагувати ліміт категорії (PATCH /api/categories/:id)
router.patch('/:id', authenticateToken, validate(updateCategorySchema), async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const categoryId = parseInt(req.params.id as string); // <-- Додали as string
        const { limit } = req.body;

        if (!userId) return res.status(401).json({ error: 'Не авторизовано' });

        const existingCategory = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!existingCategory || existingCategory.userId !== userId) {
            return res.status(404).json({ error: 'Категорію не знайдено' });
        }

        const updatedCategory = await prisma.category.update({
            where: { id: categoryId },
            data: { limit },
        });

        res.json(updatedCategory);
    } catch (error) {
        logger.error(error, 'Помилка оновлення категорії');;
    }
});

// Видалити категорію (DELETE /api/categories/:id)
router.delete('/:id', authenticateToken, validate(idParamSchema), async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const categoryId = parseInt(req.params.id as string); // <-- Додали as string

        if (!userId) return res.status(401).json({ error: 'Не авторизовано' });

        const existingCategory = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!existingCategory || existingCategory.userId !== userId) {
            return res.status(404).json({ error: 'Категорію не знайдено' });
        }

        // Важливо: спочатку видаляємо всі транзакції, пов'язані з цією категорією
        await prisma.transaction.deleteMany({
            where: { categoryId: categoryId }
        });

        await prisma.category.delete({
            where: { id: categoryId }
        });

        res.json({ message: 'Категорію та всі її транзакції успішно видалено' });
    } catch (error) {
        logger.error(error, 'Помилка видалення категорії');
    }
});

export default router;