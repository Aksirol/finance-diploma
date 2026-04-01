import express from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../schemas';

const router = express.Router();

// Реєстрація (POST /api/auth/register)
router.post('/register', validate(registerSchema), async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password, name } = req.body;

        // 1. Перевіряємо, чи не зайнятий email
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Користувач з таким email вже існує' });
        }

        // 2. Хешуємо пароль
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Зберігаємо в базу
        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
            },
        });

        res.status(201).json({ message: 'Користувача успішно створено!', userId: newUser.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка сервера при реєстрації' });
    }
});

// Логін (POST /api/auth/login)
router.post('/login', validate(loginSchema), async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body;

        // 1. Шукаємо користувача
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'Невірний email або пароль' });
        }

        // 2. Порівнюємо паролі
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Невірний email або пароль' });
        }

        // 3. Генеруємо токен
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка сервера при логіні' });
    }
});

export default router;