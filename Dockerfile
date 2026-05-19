# ============================================================
# NexaTrade — Production Dockerfile
# ============================================================
# Build: docker build -t nexatrade .
# Run:   docker run -p 8000:8000 --env-file backend/.env nexatrade

# ── Stage 1: Build Frontend ──
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ── Stage 2: Build Backend ──
FROM node:20-alpine AS backend

WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --production

COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./dist

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start
CMD ["node", "index.js"]
