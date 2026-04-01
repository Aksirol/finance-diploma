import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

// Створюємо пул з'єднань за допомогою драйвера pg
const pool = new Pool({ connectionString });

// Створюємо адаптер Prisma
const adapter = new PrismaPg(pool);

// Ініціалізуємо клієнт з передачею адаптера
export const prisma = new PrismaClient({ adapter });