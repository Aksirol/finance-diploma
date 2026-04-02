import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Інтерцептор для додавання токена до запиту
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// НОВИЙ КОД: Інтерцептор для обробки помилок відповіді
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Якщо сервер повертає 401 (Не авторизовано)
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token'); // Видаляємо зламаний/старий токен
            window.location.href = '/login'; // Примусово перекидаємо на сторінку входу
        }
        return Promise.reject(error);
    }
);