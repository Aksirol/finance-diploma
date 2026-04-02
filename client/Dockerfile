FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
# Запускаємо Vite з прапорцем --host, щоб він був доступний поза контейнером
CMD ["npm", "run", "dev", "--", "--host"]