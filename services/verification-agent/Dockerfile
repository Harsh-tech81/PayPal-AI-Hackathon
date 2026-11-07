FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/ packages/
COPY services/verification-agent/ services/verification-agent/

RUN npm install --omit=dev

EXPOSE 8003
CMD ["npx", "tsx", "services/verification-agent/src/index.ts"]
