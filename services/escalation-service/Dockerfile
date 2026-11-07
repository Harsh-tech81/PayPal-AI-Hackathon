FROM node:22-alpine AS base
WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./
COPY tsconfig.base.json ./
COPY database/ database/
COPY packages/ packages/
COPY services/escalation-service/ services/escalation-service/

RUN npm install --omit=dev

EXPOSE 8006

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8006/health || exit 1

CMD ["npx", "tsx", "services/escalation-service/src/index.ts"]
