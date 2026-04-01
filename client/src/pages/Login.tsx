import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/axios';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // Відправляємо запит на бекенд
            const response = await api.post('/auth/login', { email, password });

            // Зберігаємо отриманий токен у локальне сховище браузера
            localStorage.setItem('token', response.data.token);

            // Перенаправляємо на головну панель
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Помилка авторизації. Перевірте дані.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-900">Вхід у систему</h2>

                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">
                        {error}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Пароль</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 font-semibold text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        Увійти
                    </button>
                </form>

                <p className="text-sm text-center text-gray-600">
                    Ще немає акаунта?{' '}
                    <Link to="/register" className="text-blue-600 hover:underline">
                        Зареєструватися
                    </Link>
                </p>
            </div>
        </div>
    );
}