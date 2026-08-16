FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
# Provide a dummy DATABASE_URL so Prisma 7 config env loader doesn't fail during build
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Next.js telemetry disable
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy package.json for start script
COPY package.json ./

# Copy built app and dependencies
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

# Create .boards dir just in case
RUN mkdir -p .boards

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# We need to run migrations before starting the server. 
# In production, this can be handled via an entrypoint script.
# For simplicity, we just run the server.js which runs Next and Socket.io
# To run migrations, the user can run `docker-compose exec app npx prisma db push`
CMD ["npm", "start"]
