# ============================================
# Obscura Backend - Railway Deployment
# Build context: root of repository
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy backend workspace configuration
COPY backend/package.json ./package.json
COPY backend/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY backend/tsconfig.json ./tsconfig.json

# Copy pnpm-lock if exists
COPY backend/pnpm-lock.yaml* ./

# Copy package.json files for all packages
COPY backend/packages/crypto/package.json ./packages/crypto/
COPY backend/packages/backend/package.json ./packages/backend/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY backend/packages/crypto/ ./packages/crypto/
COPY backend/packages/backend/ ./packages/backend/

# Build packages in order (crypto first, then backend)
RUN pnpm --filter @obscura/crypto build
RUN pnpm --filter @obscura/backend build

# Stage 2: Production
FROM node:20-alpine AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy workspace configuration
COPY backend/package.json ./package.json
COPY backend/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY backend/packages/crypto/package.json ./packages/crypto/
COPY backend/packages/backend/package.json ./packages/backend/

# Install production dependencies only
RUN pnpm install --no-frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/packages/crypto/dist ./packages/crypto/dist
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

# Copy public folder for static files (if exists)
COPY --from=builder /app/packages/backend/public ./packages/backend/public

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "packages/backend/dist/server.js"]
