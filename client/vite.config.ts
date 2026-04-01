import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- Додаємо цей імпорт

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), // <-- Додаємо виклик плагіна
    react()
  ],
})