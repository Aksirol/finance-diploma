import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Розширюємо стандартний Request, щоб додати туди id користувача
export interface AuthRequest extends Request {
    user?: { userId: number };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): any => {
    // Отримуємо заголовок Authorization (зазвичай у форматі "Bearer <token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Доступ заборонено. Токен відсутній.' });
    }

    // Перевіряємо токен
    // Перевіряємо токен строго за секретним ключем
    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Недійсний або прострочений токен.' });
        }

        // Зберігаємо розшифрований userId у request для наступних функцій
        req.user = decoded as { userId: number };
        next();
    });
};