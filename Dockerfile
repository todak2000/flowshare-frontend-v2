# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Install dependencies
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "No lockfile found." && exit 1; \
  fi

# Copy source
COPY . .

# Set dummy environment variables for build (real values injected at runtime)
ENV NEXT_PUBLIC_FIREBASE_API_KEY=dummy_build_key
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dummy.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=dummy-project
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dummy.appspot.com
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:dummy
ENV GEMINI_API_KEY=dummy_gemini_key

# Build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN \
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then pnpm run build; \
  fi

# Production stage  
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]