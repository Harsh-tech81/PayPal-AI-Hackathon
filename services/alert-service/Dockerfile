FROM node:22-alpine AS base
WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/ packages/
COPY services/alert-service/ services/alert-service/

RUN npm install --omit=dev

EXPOSE 8005

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8005/health || exit 1

CMD ["npx", "tsx", "services/alert-service/src/index.ts"]
