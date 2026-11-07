FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/ packages/
COPY services/risk-engine/ services/risk-engine/

RUN npm install --omit=dev

EXPOSE 8004
CMD ["npx", "tsx", "services/risk-engine/src/index.ts"]
