# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy root tsconfig.json and shared folder first
COPY tsconfig.json ./
COPY shared ./shared/

# Copy api-gateway package files
COPY api-gateway/package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy api-gateway source code
COPY api-gateway .

# Build TypeScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 3100

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3100/health || exit 1

# Start the application
CMD ["npm", "start"]
