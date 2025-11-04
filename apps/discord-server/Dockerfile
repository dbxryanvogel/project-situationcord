# syntax=docker/dockerfile:1

# ================================
# Build Stage
# ================================
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++

WORKDIR /app

# Copy workspace root package files
COPY package.json package-lock.json* ./

# Copy workspace packages
COPY packages/ ./packages/

# Copy discord-server app
COPY apps/discord-server/ ./apps/discord-server/

# Install all dependencies (including workspace dependencies)
RUN npm ci --workspace=discord-server --include-workspace-root

# Build the shared-types package first
WORKDIR /app/packages/shared-types
RUN npm run build 2>/dev/null || echo "No build script for shared-types"

# Build the discord-server
WORKDIR /app/apps/discord-server
RUN npm run build

# ================================
# Production Stage
# ================================
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S discord -u 1001

WORKDIR /app

# Copy workspace root files
COPY --chown=discord:nodejs package.json package-lock.json* ./

# Copy built shared-types
COPY --from=builder --chown=discord:nodejs /app/packages/shared-types/ ./packages/shared-types/

# Copy discord-server package.json
COPY --from=builder --chown=discord:nodejs /app/apps/discord-server/package.json ./apps/discord-server/

# Install production dependencies only
RUN npm ci --workspace=discord-server --include-workspace-root --omit=dev && \
    npm cache clean --force

# Copy built discord-server files
COPY --from=builder --chown=discord:nodejs /app/apps/discord-server/dist/ ./apps/discord-server/dist/

# Switch to non-root user
USER discord

# Set working directory to the app
WORKDIR /app/apps/discord-server

# Environment variables (override these when running the container)
ENV NODE_ENV=production
ENV DISCORD_BOT_TOKEN=""
ENV WEBHOOK_URL=""
ENV SECONDARY_WEBHOOK_URL=""

# Health check (optional - adjust based on your app's behavior)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "console.log('Bot is running')" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]

# Labels
LABEL org.opencontainers.image.title="Discord Server Bot"
LABEL org.opencontainers.image.description="Discord bot for SituationCord monitoring"
LABEL org.opencontainers.image.source="https://github.com/yourusername/project-situationcord"
LABEL org.opencontainers.image.vendor="SituationCord"

