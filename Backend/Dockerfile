FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json ./
RUN npm install
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY src ./src
RUN npm run prisma:generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
# Keep the TypeScript source available for `prisma db seed`, which imports the
# shared environment and Prisma configuration at runtime via tsx.
COPY --from=builder /app/src ./src
COPY --from=builder /app/dist ./dist
EXPOSE 8080
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
