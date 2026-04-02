import { calculateLinearRegression } from './regression';

describe('Linear Regression Algorithm', () => {
    it('повинен повертати 0, якщо немає даних', () => {
        expect(calculateLinearRegression([])).toBe(0);
    });

    it('повинен повертати те саме значення, якщо є дані лише за 1 місяць', () => {
        expect(calculateLinearRegression([1500])).toBe(1500);
    });

    it('повинен правильно прогнозувати зростаючий тренд', () => {
        // Місяць 1: 1000, Місяць 2: 2000, Місяць 3: 3000. Прогноз на 4-й має бути 4000
        const prediction = calculateLinearRegression([1000, 2000, 3000]);
        // Через специфіку дробів у JS використовуємо toBeCloseTo
        expect(prediction).toBeCloseTo(4000);
    });

    it('повинен не допускати від\'ємних значень прогнозу (Math.max(0, ...))', () => {
        // Різке падіння: Місяць 1: 5000, Місяць 2: 100. Лінія піде в мінус, але алгоритм має повернути 0
        const prediction = calculateLinearRegression([5000, 100]);
        expect(prediction).toBe(0);
    });
});