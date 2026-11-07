FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY database/ database/
COPY packages/ packages/
COPY services/transaction-service/ services/transaction-service/

RUN npm install --omit=dev

EXPOSE 8002
CMD ["npx", "tsx", "services/transaction-service/src/index.ts"]
