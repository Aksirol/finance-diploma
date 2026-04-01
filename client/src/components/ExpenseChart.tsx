import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Transaction {
    id: number;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: { name: string };
}

// Розширена палітра з максимально контрастними та різними кольорами
const DISTINCT_COLORS = [
    '#FF6384', // Рожево-червоний
    '#36A2EB', // Блакитний
    '#FFCE56', // Жовтий
    '#4BC0C0', // Бірюзовий
    '#9966FF', // Фіолетовий
    '#FF9F40', // Помаранчевий
    '#8AC926', // Яскраво-зелений
    '#1982C4', // Темно-синій
    '#6A4C93', // Темно-фіолетовий
    '#F45B69', // Кораловий
    '#E9C46A', // Пісочний
    '#2A9D8F', // Смарагдовий
];

// Словник (кеш) для збереження закріплених кольорів за категоріями
const categoryColorCache: Record<string, string> = {};
let nextColorIndex = 0;

const getColorForCategory = (categoryName: string) => {
    // Якщо категорія ще не має кольору, беремо наступний з палітри і запам'ятовуємо
    if (!categoryColorCache[categoryName]) {
        categoryColorCache[categoryName] = DISTINCT_COLORS[nextColorIndex % DISTINCT_COLORS.length];
        nextColorIndex++;
    }
    return categoryColorCache[categoryName];
};

export default function ExpenseChart({ transactions }: { transactions: Transaction[] }) {
    const expenses = transactions.filter(t => t.type === 'EXPENSE');

    if (expenses.length === 0) {
        return (
            <div className="flex items-center justify-center h-full p-6 text-sm text-gray-500 bg-white shadow-sm rounded-xl">
                Немає даних про витрати для побудови графіка.
            </div>
        );
    }

    const categoryTotals: Record<string, number> = {};
    expenses.forEach(t => {
        const catName = t.category?.name || 'Інше';
        categoryTotals[catName] = (categoryTotals[catName] || 0) + t.amount;
    });

    const labels = Object.keys(categoryTotals);
    // Отримуємо кольори через наш кеш
    const backgroundColors = labels.map(label => getColorForCategory(label));

    const data = {
        labels,
        datasets: [
            {
                data: Object.values(categoryTotals),
                backgroundColor: backgroundColors,
                borderWidth: 0,
                hoverOffset: 4,
            },
        ],
    };

    const options = {
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                }
            }
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="flex flex-col p-6 bg-white shadow-sm rounded-xl h-80">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">Структура витрат</h2>
            <div className="relative flex-1 w-full">
                <Doughnut data={data} options={options} />
            </div>
        </div>
    );
}