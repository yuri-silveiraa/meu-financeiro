FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma/ ./prisma/
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/

RUN npx prisma generate --schema=prisma/schema.prisma
RUN npx tsc

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma/ ./prisma/
RUN npm install --omit=dev && npx prisma generate --schema=prisma/schema.prisma

COPY --from=builder /app/dist ./dist
COPY src/db/ ./dist/db/

EXPOSE 3001

CMD ["node", "dist/index.js"]
