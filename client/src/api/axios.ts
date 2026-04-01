import axios from 'axios';

// Створюємо базовий екземпляр Axios
export const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Адреса нашого бекенду
});

// Додаємо "перехоплювач" (interceptor) для всіх запитів
api.interceptors.request.use(
    (config) => {
        // Дістаємо токен з локального сховища браузера
        const token = localStorage.getItem('token');

        // Якщо токен є, додаємо його в заголовок Authorization
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);