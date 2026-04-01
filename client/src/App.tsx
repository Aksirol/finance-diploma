import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; // <-- Імпортуємо новий компонент

function App() {
    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Підключаємо реальний компонент */}
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </div>
    );
}

export default App;