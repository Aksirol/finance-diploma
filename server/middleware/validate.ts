import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) =>
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        const result = await schema.safeParseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        if (!result.success) {
            // ✅ Явно вказуємо тип через ZodError
            const error = result.error as ZodError;

            return res.status(400).json({
                error: 'Помилка валідації даних',
                // ✅ .issues — правильна властивість в Zod v3
                details: error.issues.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            });
        }

        return next();
    };