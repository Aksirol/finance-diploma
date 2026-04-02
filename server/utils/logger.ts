import pino from 'pino';

// Налаштовуємо логер
export const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true, // Красиві кольори в консолі
            translateTime: 'SYS:standard', // Зрозумілий формат часу
            ignore: 'pid,hostname', // Ховаємо зайву системну інформацію
        },
    },
});