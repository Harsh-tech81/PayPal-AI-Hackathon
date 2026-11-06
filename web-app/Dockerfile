FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/ packages/
COPY web-app/ web-app/

RUN npm install

WORKDIR /app/web-app
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
