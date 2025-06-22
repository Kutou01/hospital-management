# Medical Records Service Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package.json files
COPY services/medical-records-service/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY services/medical-records-service/src ./src/
COPY services/medical-records-service/tsconfig.json ./
COPY services/medical-records-service/.env ./

# Copy shared module and install its dependencies
COPY shared ./node_modules/@hospital/shared/
WORKDIR /app/node_modules/@hospital/shared
RUN npm install && npm run build

# Go back to app directory and build
WORKDIR /app
RUN npm run build

# Expose port
EXPOSE 3006

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3006/health || exit 1

# Start the application
CMD ["npm", "start"]
