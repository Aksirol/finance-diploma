import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';

// Тип для категорії
interface Category {
    id: number;
    name: string;
    type: 'INCOME' | 'EXPENSE';
}

export default function AddDataForm() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'transaction' | 'category'>('transaction');

    // Стейт для нової категорії
    const [catName, setCatName] = useState('');
    const [catType, setCatType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
    const [catLimit, setCatLimit] = useState('');

    // Стейт для нової транзакції
    const [amount, setAmount] = useState('');
    const [transType, setTransType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');

    // Завантажуємо категорії користувача для випадаючого списку
    const { data: categories = [] } = useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/categories');
            return response.data;
        },
    });

    // Мутація для створення категорії
    const addCategoryMutation = useMutation({
        mutationFn: (newCategory: any) => api.post('/categories', newCategory),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] }); // Оновлюємо список категорій
            setCatName('');
            alert('Категорію успішно додано!');
        },
    });

    // Мутація для створення транзакції
    const addTransactionMutation = useMutation({
        mutationFn: (newTransaction: any) => api.post('/transactions', newTransaction),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Оновлюємо дашборд
            setAmount('');
            setDescription('');

            // Якщо сервер повернув попередження про ліміт — показуємо його!
            if (response.data.warning) {
                alert(response.data.warning);
            }
        },
    });

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!catName) return;
        addCategoryMutation.mutate({
            name: catName,
            type: catType,
            limit: catLimit ? parseFloat(catLimit) : null
        });
        setCatLimit(''); // Очищаємо поле;
    };

    const handleAddTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !categoryId) return;
        addTransactionMutation.mutate({
            amount: parseFloat(amount),
            type: transType,
            categoryId: parseInt(categoryId),
            description,
        });
    };

    // Фільтруємо категорії залежно від обраного типу транзакції (дохід/витрата)
    const filteredCategories = categories.filter(c => c.type === transType);

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Перемикач вкладок */}
            <div className="flex border-b border-gray-100">
                <button
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'transaction' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('transaction')}
                >
                    Транзакція
                </button>
                <button
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'category' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('category')}
                >
                    Категорія
                </button>
            </div>

            <div className="p-6">
                {/* Форма транзакції */}
                {activeTab === 'transaction' && (
                    <form onSubmit={handleAddTransaction} className="space-y-4">
                        <div className="flex gap-2 mb-4">
                            <button type="button" onClick={() => setTransType('EXPENSE')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${transType === 'EXPENSE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>Витрата</button>
                            <button type="button" onClick={() => setTransType('INCOME')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${transType === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>Дохід</button>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Сума (₴)</label>
                            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Категорія</label>
                            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="" disabled>Оберіть категорію</option>
                                {filteredCategories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {filteredCategories.length === 0 && (
                                <p className="text-xs text-red-500 mt-1">Спершу створіть категорію для цього типу!</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Опис (необов'язково)</label>
                            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Наприклад: Продукти в АТБ" />
                        </div>

                        <button type="submit" disabled={addTransactionMutation.isPending || !categoryId} className="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            {addTransactionMutation.isPending ? 'Додається...' : 'Додати транзакцію'}
                        </button>
                    </form>
                )}

                {/* Форма категорії */}
                {activeTab === 'category' && (
                    <form onSubmit={handleAddCategory} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Тип категорії</label>
                            <select value={catType} onChange={(e) => setCatType(e.target.value as 'INCOME' | 'EXPENSE')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="EXPENSE">Для витрат</option>
                                <option value="INCOME">Для доходів</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Назва категорії</label>
                            <div>
                                <label className="block mb-1 text-xs font-medium text-gray-700">Ліміт (₴) (необов'язково)</label>
                                <input type="number" step="0.01" value={catLimit} onChange={(e) => setCatLimit(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                            </div>
                            <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Наприклад: Транспорт" />
                        </div>

                        <button type="submit" disabled={addCategoryMutation.isPending} className="w-full py-2 bg-gray-800 text-white rounded-md font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors">
                            {addCategoryMutation.isPending ? 'Створюється...' : 'Створити категорію'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}