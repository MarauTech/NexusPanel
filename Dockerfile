# ============================================
# NexusPanel - Multi-stage Docker Build
# ============================================

# Stage 1: Build frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root package files
COPY package.json package-lock.json* ./

# Copy package.json files for workspaces
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install all dependencies
RUN npm install --workspace=client --workspace=server 2>/dev/null || npm install

# Copy source code
COPY . .

# Build React frontend
RUN cd client && npx vite build

# ============================================
# Stage 2: Production image
# ============================================
FROM node:20-alpine

LABEL maintainer="NexusPanel"
LABEL description="One dashboard for your entire homelab"
LABEL version="1.0.0"

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
COPY server/package.json ./server/

RUN npm install --workspace=server --omit=dev 2>/dev/null || (cd server && npm install --omit=dev)

# Copy server code
COPY server/ ./server/

# Copy built frontend from builder stage
COPY --from=builder /app/client/dist ./client/dist

# Create data and uploads directories
RUN mkdir -p /app/data /app/uploads

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/nexuspanel.db

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Run as non-root user
RUN addgroup -g 1001 -S nexuspanel && \
    adduser -S nexuspanel -u 1001 -G nexuspanel && \
    chown -R nexuspanel:nexuspanel /app

USER nexuspanel

# Start server
CMD ["node", "server/index.js"]
