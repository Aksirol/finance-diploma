import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import AddDataForm from '../components/AddDataForm';
import ExpenseChart from '../components/ExpenseChart'; // <-- Додаємо імпорт

// Описуємо тип транзакції (як вона приходить з бекенду)
interface Transaction {
    id: number;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    description: string;
    date: string;
    category: { name: string };
}

export default function Dashboard() {
    const navigate = useNavigate();

    // Отримуємо транзакції з сервера за допомогою React Query
    const { data: transactions = [], isLoading, isError } = useQuery<Transaction[]>({
        queryKey: ['transactions'],
        queryFn: async () => {
            const response = await api.get('/transactions');
            return response.data;
        },
    });

    // НОВИЙ КОД: Отримуємо прогноз
    const { data: analytics } = useQuery({
        queryKey: ['analytics'],
        queryFn: async () => {
            const response = await api.get('/analytics/predict');
            return response.data;
        },
    });

    // Логіка виходу з акаунта
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Логіка експорту в CSV
    const handleExportCSV = () => {
        if (transactions.length === 0) {
            alert('Немає даних для експорту');
            return;
        }

        // Створюємо заголовки колонок
        const headers = ['Дата', 'Категорія', 'Тип', 'Сума', 'Опис'];

        // Формуємо рядки з даними
        const csvRows = [headers.join(',')];

        transactions.forEach(t => {
            const date = new Date(t.date).toLocaleDateString('uk-UA');
            const category = t.category?.name || 'Без категорії';
            const type = t.type === 'INCOME' ? 'Дохід' : 'Витрата';
            const amount = t.amount;
            // Очищаємо опис від можливих ком та лапок, щоб не зламати формат CSV
            const description = t.description ? `"${t.description.replace(/"/g, '""')}"` : 'Без опису';

            csvRows.push([date, category, type, amount, description].join(','));
        });

        // Об'єднуємо все в один текст
        const csvString = csvRows.join('\n');

        // Створюємо Blob (файл) з додаванням BOM (\ufeff) для правильного читання кирилиці в Excel
        const blob = new Blob(["\ufeff" + csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        // Створюємо тимчасове посилання для завантаження
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'my_finances.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Вираховуємо статистику
    const income = transactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    if (isLoading) return <div className="flex items-center justify-center min-h-screen text-xl text-gray-600">Завантаження даних...</div>;
    if (isError) return <div className="flex items-center justify-center min-h-screen text-xl text-red-500">Помилка завантаження даних. Будь ласка, увійдіть знову.</div>;

    return (
        <div className="min-h-screen p-8 bg-gray-100">
            <div className=" max-w-6xl mx-auto space-y-6">

                {/* Шапка */}
                <div className="flex items-center justify-between p-4 bg-white shadow-sm rounded-xl">
                    <h1 className="text-2xl font-bold text-gray-800">Мої фінанси</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportCSV}
                            className="px-4 py-2 text-sm font-medium text-white transition-colors bg-emerald-500 rounded-md hover:bg-emerald-600"
                        >
                            Завантажити CSV
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm font-medium text-white transition-colors bg-gray-400 rounded-md hover:bg-red-500"
                        >
                            Вийти
                        </button>
                    </div>
                </div>

                {/* Картки статистики */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <div className="p-6 bg-white border-l-4 border-blue-500 shadow-sm rounded-xl">
                        <h3 className="text-sm font-medium text-gray-500">Загальний баланс</h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900">₴ {balance.toFixed(2)}</p>
                    </div>
                    <div className="p-6 bg-white border-l-4 border-green-500 shadow-sm rounded-xl">
                        <h3 className="text-sm font-medium text-gray-500">Доходи</h3>
                        <p className="mt-2 text-3xl font-bold text-green-600">₴ {income.toFixed(2)}</p>
                    </div>
                    <div className="p-6 bg-white border-l-4 border-red-500 shadow-sm rounded-xl">
                        <h3 className="text-sm font-medium text-gray-500">Витрати</h3>
                        <p className="mt-2 text-3xl font-bold text-red-600">₴ {expense.toFixed(2)}</p>
                    </div>
                    {/* НОВА КАРТКА ПРОГНОЗУ */}
                    <div className="p-6 bg-white border-l-4 border-purple-500 shadow-sm rounded-xl">
                        <h3 className="text-sm font-medium text-gray-500">Прогноз на міс.</h3>
                        <p className="mt-2 text-3xl font-bold text-purple-600">
                            ₴ {analytics?.prediction ? analytics.prediction.toFixed(2) : '0.00'}
                        </p>
                    </div>
                </div>

                {/* Список транзакцій */}
                {/* Головний контент: Графік, Список, Форма */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                    {/* Ліва колонка (Графік + Список транзакцій займають 2 частини) */}
                    <div className="space-y-6 lg:col-span-2">

                        {/* Додаємо наш новий графік сюди */}
                        <ExpenseChart transactions={transactions} />

                        <div className="overflow-hidden bg-white shadow-sm rounded-xl h-fit">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-800">Останні транзакції</h2>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {transactions.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">
                                        У вас ще немає транзакцій.
                                    </div>
                                ) : (
                                    transactions.map((t) => (
                                        <div key={t.id} className="flex items-center justify-between p-6 transition-colors hover:bg-gray-50">
                                            <div>
                                                <p className="font-medium text-gray-800">{t.description || 'Без опису'}</p>
                                                <p className="text-sm text-gray-500">
                                                    {t.category?.name || 'Без категорії'} • {new Date(t.date).toLocaleDateString('uk-UA')}
                                                </p>
                                            </div>
                                            <div className={`font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'INCOME' ? '+' : '-'} ₴ {t.amount.toFixed(2)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Права колонка (Форма додавання) */}
                    <div className="lg:col-span-1">
                        <AddDataForm />
                    </div>

                </div>

            </div>
        </div>
    );
}