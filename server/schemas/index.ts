import { z } from 'zod';

// Схеми для авторизації
export const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, { message: 'Ім\'я повинно містити мінімум 2 символи' }),
        email: z.string().email({ message: 'Невірний формат email адреси' }),
        password: z.string().min(6, { message: 'Пароль повинен містити мінімум 6 символів' }),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email({ message: 'Невірний формат email адреси' }),
        password: z.string().min(1, { message: 'Пароль є обов\'язковим' }),
    }),
});

// Схема для категорій
export const categorySchema = z.object({
    body: z.object({
        name: z.string().min(1, { message: 'Назва категорії є обов\'язковою' }),
        type: z.enum(['INCOME', 'EXPENSE'], {
            message: 'Тип має бути INCOME або EXPENSE'
        }),
        limit: z.number().positive({ message: 'Ліміт повинен бути більшим за нуль' }).nullable().optional(),
    }),
});

// Схема для транзакцій
export const transactionSchema = z.object({
    body: z.object({
        amount: z.number().positive({ message: 'Сума повинна бути більшою за нуль' }),
        type: z.enum(['INCOME', 'EXPENSE'], {
            message: 'Тип має бути INCOME або EXPENSE'
        }),
        categoryId: z.number().int().positive({ message: 'ID категорії має бути цілим додатнім числом' }),
        description: z.string().optional(),
        date: z.string().datetime({ message: 'Невірний формат дати' }).optional().or(z.date().optional()),
    }),
});