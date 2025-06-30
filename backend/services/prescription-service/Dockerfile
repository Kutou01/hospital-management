# Prescription Service Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package.json files
COPY services/prescription-service/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY services/prescription-service/src ./src/
COPY services/prescription-service/tsconfig.json ./
COPY services/prescription-service/.env ./

# Copy shared module and install its dependencies
COPY shared ./node_modules/@hospital/shared/
WORKDIR /app/node_modules/@hospital/shared
RUN npm install && npm run build

# Go back to app directory and build
WORKDIR /app
RUN npm run build

# Expose port
EXPOSE 3009

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3009/health || exit 1

# Start the application
CMD ["npm", "start"]
