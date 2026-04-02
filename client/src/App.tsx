import {type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import {Toaster} from "react-hot-toast";

// Компонент-обгортка для захисту маршрутів
// Використовуємо ReactNode замість JSX.Element
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const token = localStorage.getItem('token');

    // Якщо токена немає - одразу відправляємо на сторінку входу
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

function App() {
    return (
        <div className="min-h-screen font-sans text-gray-900 bg-gray-100">
            <Toaster position="top-right" />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Загортаємо Dashboard у наш ProtectedRoute */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Розумний редирект для всіх інших невідомих посилань */}
                <Route
                    path="*"
                    element={<Navigate to={localStorage.getItem('token') ? "/dashboard" : "/login"} replace />}
                />
            </Routes>
        </div>
    );
}

export default App;