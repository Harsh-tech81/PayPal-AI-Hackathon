FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/ packages/
COPY services/alert-service/ services/alert-service/

RUN npm install --omit=dev

EXPOSE 8005
CMD ["npx", "tsx", "services/alert-service/src/index.ts"]
