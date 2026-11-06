FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY database/ database/
COPY packages/ packages/
COPY services/escalation-service/ services/escalation-service/

RUN npm install --omit=dev

EXPOSE 8006
CMD ["npx", "tsx", "services/escalation-service/src/index.ts"]
