FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
# Копіюємо схему Prisma і генеруємо клієнт
COPY prisma ./prisma/
RUN npx prisma generate
COPY . .
# Відкриваємо порт
EXPOSE 5000
CMD ["npm", "run", "dev"]