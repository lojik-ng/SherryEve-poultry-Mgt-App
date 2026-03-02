FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN mkdir -p /app/data /app/backups

EXPOSE 3015

ENV NODE_ENV=production
ENV PORT=3015
ENV DB_PATH=/app/data/poultry.db3

CMD ["node", "server.js"]
