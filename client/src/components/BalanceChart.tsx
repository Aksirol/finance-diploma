import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Реєструємо необхідні модулі для лінійного графіка
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface Transaction {
    id: number;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    date: string;
}

export default function BalanceChart({ transactions }: { transactions: Transaction[] }) {
    if (transactions.length === 0) {
        return (
            <div className="flex items-center justify-center h-full p-6 text-sm text-gray-500 bg-white shadow-sm rounded-xl">
                Немає даних для побудови графіка балансу.
            </div>
        );
    }

    // 1. Групуємо чистий дохід (доходи мінус витрати) по місяцях
    const monthlyNet: Record<string, number> = {};

    // Сортуємо транзакції від найстаріших до найновіших
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(t => {
        // Отримуємо назву місяця та рік (наприклад: "бер. 2026")
        const dateObj = new Date(t.date);
        const monthYear = dateObj.toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' });

        if (!monthlyNet[monthYear]) {
            monthlyNet[monthYear] = 0;
        }

        if (t.type === 'INCOME') {
            monthlyNet[monthYear] += t.amount;
        } else {
            monthlyNet[monthYear] -= t.amount;
        }
    });

    const labels = Object.keys(monthlyNet);
    const netValues = Object.values(monthlyNet);

    // 2. Рахуємо накопичувальний баланс (як сума змінювалася з часом)
    let accumulatedBalance = 0;
    const cumulativeData = netValues.map(val => {
        accumulatedBalance += val;
        return accumulatedBalance;
    });

    const data = {
        labels,
        datasets: [
            {
                label: 'Загальний баланс',
                data: cumulativeData,
                borderColor: '#3B82F6', // Синій колір лінії (Blue 500)
                backgroundColor: 'rgba(59, 130, 246, 0.2)', // Напівпрозорий синій для заливки під лінією
                fill: true, // Вмикаємо заливку
                tension: 0.4, // Робить лінію плавною (крива Без'є)
                pointBackgroundColor: '#3B82F6',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false, // Ховаємо легенду, бо маємо заголовок картки
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        return `Баланс: ₴ ${context.parsed.y.toFixed(2)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: '#F3F4F6', // Світло-сіра сітка
                }
            },
            x: {
                grid: {
                    display: false, // Вимикаємо вертикальну сітку для чистоти
                }
            }
        }
    };

    return (
        <div className="flex flex-col p-6 bg-white shadow-sm rounded-xl h-80">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">Динаміка балансу</h2>
            <div className="relative flex-1 w-full">
                <Line data={data} options={options} />
            </div>
        </div>
    );
}