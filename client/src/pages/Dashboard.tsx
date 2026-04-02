import { useState } from 'react'; // <-- ДОДАНО
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import AddDataForm from '../components/AddDataForm';
import ExpenseChart from '../components/ExpenseChart';
import BalanceChart from '../components/BalanceChart';

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

    // 1. Отримуємо ВСІ транзакції для графіків та карток (статистика має рахуватися з усіх даних)
    const { data: allTransactions = [], isLoading, isError } = useQuery<Transaction[]>({
        queryKey: ['transactions', 'all'],
        queryFn: async () => {
            const response = await api.get('/transactions?limit=1000'); // Беремо з запасом для аналітики
            return response.data.data;
        },
    });

    // 2. Отримуємо транзакції для візуального списку з пагінацією
    const [page, setPage] = useState(1);
    const { data: listData } = useQuery({
        queryKey: ['transactions', 'list', page],
        queryFn: async () => {
            const response = await api.get(`/transactions?page=${page}&limit=5`); // Показуємо по 5 на сторінку
            return response.data;
        },
    });

    // Розділяємо дані
    const paginatedTransactions: Transaction[] = listData?.data || [];
    const meta = listData?.meta;

    // НОВИЙ КОД: Отримуємо прогноз
    const { data: analytics } = useQuery({
        queryKey: ['analytics'],
        queryFn: async () => {
            const response = await api.get('/analytics/predict');
            return response.data;
        },
    });

    const queryClient = useQueryClient();

    // Мутація для видалення транзакції
    const deleteTransactionMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/transactions/${id}`),
        onSuccess: () => {
            // Повертаємо Promise, щоб React Query знав, коли оновлення завершено
            return Promise.all([
                queryClient.invalidateQueries({ queryKey: ['transactions'] }),
                queryClient.invalidateQueries({ queryKey: ['analytics'] })
            ]);
        },
    });

    const handleDelete = (id: number) => {
        if (window.confirm('Ви впевнені, що хочете видалити цю транзакцію?')) {
            deleteTransactionMutation.mutate(id);
        }
    };

    // Логіка виходу з акаунта
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Логіка експорту в CSV
    const handleExportCSV = () => {
        if (allTransactions.length === 0) {
            toast.error('Немає даних для експорту');
            return;
        }

        // Створюємо заголовки колонок
        const headers = ['Дата', 'Категорія', 'Тип', 'Сума', 'Опис'];

        // Формуємо рядки з даними
        const csvRows = [headers.join(',')];

        allTransactions.forEach(t => {
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
    const income = allTransactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = allTransactions
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

                    {/* Ліва колонка (Графіки + Список транзакцій займають 2 частини) */}
                    <div className="space-y-6 lg:col-span-2">

                        {/* Блок з двома графіками поруч */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <ExpenseChart transactions={allTransactions} />
                            <BalanceChart transactions={allTransactions} />
                        </div>

                        <div className="overflow-hidden bg-white shadow-sm rounded-xl h-fit">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-800">Останні транзакції</h2>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {allTransactions.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">
                                        У вас ще немає транзакцій.
                                    </div>
                                ) : (
                                    paginatedTransactions.map((t) => (
                                        <div key={t.id} className="flex items-center justify-between p-6 transition-colors hover:bg-gray-50">
                                            <div>
                                                <p className="font-medium text-gray-800">{t.description || 'Без опису'}</p>
                                                <p className="text-sm text-gray-500">
                                                    {t.category?.name || 'Без категорії'} • {new Date(t.date).toLocaleDateString('uk-UA')}
                                                </p>
                                            </div>
                                            {/* Контейнер для суми та кнопки видалення */}
                                            <div className="flex items-center gap-4">
                                                <div className={`font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {t.type === 'INCOME' ? '+' : '-'} ₴ {t.amount.toFixed(2)}
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    disabled={deleteTransactionMutation.isPending}
                                                    className="p-2 text-gray-400 transition-colors rounded-full hover:text-red-500 hover:bg-red-50 disabled:opacity-50"
                                                    title="Видалити"
                                                >
                                                    {/* SVG Іконка кошика */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        {/* Панель пагінації */}
                        {meta && meta.totalPages > 1 && (
                            <div className="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
                                <button
                                    onClick={() => setPage(page - 1)} // <-- Виправлено
                                    disabled={page === 1}
                                    className="px-4 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-100 transition"
                                >
                                    Попередня
                                </button>
                                <span className="text-sm font-medium text-gray-600">Сторінка {page} з {meta.totalPages}</span>
                                <button
                                    onClick={() => setPage(page + 1)} // <-- Виправлено
                                    disabled={page === meta.totalPages}
                                    className="px-4 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-100 transition"
                                >
                                    Наступна
                                </button>
                            </div>
                        )}
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