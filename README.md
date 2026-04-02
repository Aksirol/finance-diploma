# 📊 Personal Finance Tracker (Fullstack Diploma Project)

Сучасний веб-застосунок для обліку особистих фінансів, створений у рамках дипломної роботи. Дозволяє користувачам додавати доходи та витрати, керувати категоріями, встановлювати ліміти та отримувати математичний прогноз витрат на наступний місяць за допомогою лінійної регресії.

## 🚀 Технологічний стек

**Frontend:**
- React (TypeScript) + Vite
- Tailwind CSS (v4)
- React Router DOM
- React Query (@tanstack/react-query)
- Chart.js + react-chartjs-2
- Axios

**Backend:**
- Node.js + Express (TypeScript)
- PostgreSQL (хмарна БД на Neon)
- Prisma ORM
- Zod (валідація даних)
- JWT + bcryptjs (аутентифікація та безпека)
- Helmet + Express Rate Limit (захист API)

## ⚙️ Встановлення та запуск локально

### 1. Клонування репозиторію
\`\`\`bash
git clone <url-вашого-репозиторію>
cd finance-diploma
\`\`\`

### 2. Налаштування Backend
Відкрийте термінал у папці \`server\`:
\`\`\`bash
cd server
npm install
\`\`\`
- Створіть файл \`.env\` у папці \`server\` на основі \`.env.example\` і заповніть свої дані (зокрема \`DATABASE_URL\` та \`JWT_SECRET\`).
- Застосуйте міграції бази даних:
  \`\`\`bash
  npx prisma migrate dev
  \`\`\`
- Запустіть сервер (працюватиме на http://localhost:5000):
  \`\`\`bash
  npm run dev
  \`\`\`

### 3. Налаштування Frontend
Відкрийте новий термінал у папці \`client\`:
\`\`\`bash
cd client
npm install
\`\`\`
- Створіть файл \`.env\` у папці \`client\` на основі \`.env.example\`.
- Запустіть клієнтську частину (працюватиме на http://localhost:5173):
  \`\`\`bash
  npm run dev
  \`\`\`

## 🛡️ Безпека
API захищене за допомогою JWT-токенів. Всі вхідні дані проходять сувору типізацію та валідацію через бібліотеку Zod. Для захисту від DDoS атак та XSS вразливостей використовуються \`express-rate-limit\` та \`helmet\`.