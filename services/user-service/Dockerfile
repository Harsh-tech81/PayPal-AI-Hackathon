FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY database/ database/
COPY packages/ packages/
COPY services/user-service/ services/user-service/

RUN npm install --omit=dev

EXPOSE 8001
CMD ["npx", "tsx", "services/user-service/src/index.ts"]
