# 🚀 Production Deployment Guide - Hospital Management System

## 📋 Deployment Architecture

### Production Environment Setup

```mermaid
graph TB
    subgraph "Load Balancer Layer"
        LB[Nginx Load Balancer<br/>SSL Termination]
    end
    
    subgraph "Application Layer"
        AG1[API Gateway 1<br/>Port 3100]
        AG2[API Gateway 2<br/>Port 3100]
        AG3[API Gateway 3<br/>Port 3100]
        
        GG1[GraphQL Gateway 1<br/>Port 3200]
        GG2[GraphQL Gateway 2<br/>Port 3200]
    end
    
    subgraph "Microservices Layer"
        AUTH[Auth Service<br/>Cluster]
        DOC[Doctor Service<br/>Cluster]
        PAT[Patient Service<br/>Cluster]
        APP[Appointment Service<br/>Cluster]
    end
    
    subgraph "Data Layer"
        REDIS_CLUSTER[Redis Cluster<br/>Cache & Sessions]
        PG_PRIMARY[PostgreSQL Primary]
        PG_REPLICA[PostgreSQL Replica]
        RABBIT_CLUSTER[RabbitMQ Cluster]
    end
    
    LB --> AG1
    LB --> AG2
    LB --> AG3
    
    AG1 --> GG1
    AG2 --> GG2
    AG3 --> GG1
    
    AG1 --> AUTH
    AG2 --> DOC
    AG3 --> PAT
    
    AUTH --> REDIS_CLUSTER
    DOC --> PG_PRIMARY
    PAT --> PG_REPLICA
    
    classDef lb fill:#ff9999
    classDef gateway fill:#99ccff
    classDef service fill:#99ff99
    classDef data fill:#ffcc99
    
    class LB lb
    class AG1,AG2,AG3,GG1,GG2 gateway
    class AUTH,DOC,PAT,APP service
    class REDIS_CLUSTER,PG_PRIMARY,PG_REPLICA,RABBIT_CLUSTER data
```

## 🔧 Environment Configuration

### 1. API Gateway Production Config

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  api-gateway-1:
    image: hospital/api-gateway:latest
    environment:
      - NODE_ENV=production
      - PORT=3100
      - REDIS_URL=redis://redis-cluster:6379
      - JWT_SECRET=${JWT_SECRET}
      - GRAPHQL_GATEWAY_URL=http://graphql-gateway:3200
      - AUTH_SERVICE_URL=http://auth-service:3001
      - DOCTOR_SERVICE_URL=http://doctor-service:3002
      - PATIENT_SERVICE_URL=http://patient-service:3003
      - APPOINTMENT_SERVICE_URL=http://appointment-service:3004
      - DEPARTMENT_SERVICE_URL=http://department-service:3005
      - MEDICAL_RECORDS_SERVICE_URL=http://medical-records-service:3006
      - PRESCRIPTION_SERVICE_URL=http://prescription-service:3007
      - BILLING_SERVICE_URL=http://billing-service:3008
      - PAYMENT_SERVICE_URL=http://payment-service:3009
      - NOTIFICATION_SERVICE_URL=http://notification-service:3011
      - ALLOWED_ORIGINS=https://hospital.example.com,https://admin.hospital.example.com
      - LOG_LEVEL=info
      - METRICS_ENABLED=true
      - RATE_LIMIT_MAX=2000
      - RATE_LIMIT_WINDOW_MS=900000
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3100/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  graphql-gateway-1:
    image: hospital/graphql-gateway:latest
    environment:
      - NODE_ENV=production
      - PORT=3200
      - API_GATEWAY_URL=http://api-gateway:3100
      - REDIS_URL=redis://redis-cluster:6379
      - JWT_SECRET=${JWT_SECRET}
      - LOG_LEVEL=info
      - APOLLO_INTROSPECTION=false
      - APOLLO_PLAYGROUND=false
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.8'
          memory: 800M
        reservations:
          cpus: '0.4'
          memory: 400M
```

### 2. Nginx Load Balancer Configuration

```nginx
# /etc/nginx/sites-available/hospital-management
upstream api_gateway {
    least_conn;
    server api-gateway-1:3100 max_fails=3 fail_timeout=30s;
    server api-gateway-2:3100 max_fails=3 fail_timeout=30s;
    server api-gateway-3:3100 max_fails=3 fail_timeout=30s;
}

upstream graphql_gateway {
    least_conn;
    server graphql-gateway-1:3200 max_fails=3 fail_timeout=30s;
    server graphql-gateway-2:3200 max_fails=3 fail_timeout=30s;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=graphql_limit:10m rate=5r/s;

server {
    listen 443 ssl http2;
    server_name hospital.example.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/hospital.crt;
    ssl_certificate_key /etc/ssl/private/hospital.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss:";
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # API Routes
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
    
    # GraphQL Routes
    location /graphql {
        limit_req zone=graphql_limit burst=10 nodelay;
        
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;
        
        # WebSocket support for subscriptions
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts for GraphQL
        proxy_connect_timeout 5s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
    
    # Health Check
    location /health {
        proxy_pass http://api_gateway;
        access_log off;
    }
    
    # Static files (if serving frontend from same domain)
    location / {
        root /var/www/hospital-frontend;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name hospital.example.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. Kubernetes Deployment

```yaml
# k8s/api-gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  labels:
    app: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: hospital/api-gateway:latest
        ports:
        - containerPort: 3100
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3100"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: hospital-secrets
              key: jwt-secret
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: GRAPHQL_GATEWAY_URL
          value: "http://graphql-gateway-service:3200"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3100
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3100
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3

---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
spec:
  selector:
    app: api-gateway
  ports:
  - protocol: TCP
    port: 3100
    targetPort: 3100
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hospital-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - hospital.example.com
    secretName: hospital-tls
  rules:
  - host: hospital.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-gateway-service
            port:
              number: 3100
      - path: /graphql
        pathType: Prefix
        backend:
          service:
            name: api-gateway-service
            port:
              number: 3100
```

## 📊 Monitoring & Observability

### 1. Prometheus Metrics

```typescript
// metrics.ts - Production metrics collection
import prometheus from 'prom-client';

// Create a Registry
const register = new prometheus.Registry();

// Add default metrics
prometheus.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service']
});

const activeConnections = new prometheus.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['service']
});

const graphqlOperations = new prometheus.Counter({
  name: 'graphql_operations_total',
  help: 'Total number of GraphQL operations',
  labelNames: ['operation_name', 'operation_type', 'status']
});

const graphqlOperationDuration = new prometheus.Histogram({
  name: 'graphql_operation_duration_seconds',
  help: 'Duration of GraphQL operations in seconds',
  labelNames: ['operation_name', 'operation_type'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(graphqlOperations);
register.registerMetric(graphqlOperationDuration);

export {
  register,
  httpRequestDuration,
  httpRequestTotal,
  activeConnections,
  graphqlOperations,
  graphqlOperationDuration
};
```

### 2. Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "Hospital Management System - Gateway Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{service}} - {{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m]) / rate(http_requests_total[5m])",
            "legendFormat": "Error Rate"
          }
        ]
      },
      {
        "title": "GraphQL Operations",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(graphql_operations_total[5m])",
            "legendFormat": "{{operation_type}} - {{operation_name}}"
          }
        ]
      }
    ]
  }
}
```

### 3. Logging Configuration

```typescript
// logger.ts - Production logging setup
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const esTransport = new ElasticsearchTransport({
  level: 'info',
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200'
  },
  index: 'hospital-logs',
  indexTemplate: {
    name: 'hospital-logs-template',
    pattern: 'hospital-logs-*',
    settings: {
      number_of_shards: 1,
      number_of_replicas: 1
    },
    mappings: {
      properties: {
        '@timestamp': { type: 'date' },
        level: { type: 'keyword' },
        message: { type: 'text' },
        service: { type: 'keyword' },
        requestId: { type: 'keyword' },
        userId: { type: 'keyword' },
        method: { type: 'keyword' },
        url: { type: 'keyword' },
        statusCode: { type: 'integer' },
        responseTime: { type: 'integer' }
      }
    }
  }
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'api-gateway'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // Elasticsearch transport for production
    ...(process.env.NODE_ENV === 'production' ? [esTransport] : [])
  ]
});
```

## 🔒 Security Configuration

### 1. Environment Variables

```bash
# .env.production
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@postgres-primary:5432/hospital_db
DATABASE_REPLICA_URL=postgresql://user:password@postgres-replica:5432/hospital_db

# Redis
REDIS_URL=redis://redis-cluster:6379
REDIS_PASSWORD=your-redis-password

# External Services
ELASTICSEARCH_URL=http://elasticsearch:9200
PROMETHEUS_URL=http://prometheus:9090

# Rate Limiting
RATE_LIMIT_MAX=2000
RATE_LIMIT_WINDOW_MS=900000

# CORS
ALLOWED_ORIGINS=https://hospital.example.com,https://admin.hospital.example.com

# SSL/TLS
SSL_CERT_PATH=/etc/ssl/certs/hospital.crt
SSL_KEY_PATH=/etc/ssl/private/hospital.key

# Monitoring
METRICS_ENABLED=true
LOG_LEVEL=info
HEALTH_CHECK_INTERVAL=30000
```

### 2. Security Middleware

```typescript
// security.middleware.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Enhanced security middleware for production
export const productionSecurityMiddleware = [
  // Helmet for security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "https:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),
  
  // Rate limiting
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '2000'),
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path.includes('/health') || req.path === '/metrics';
    }
  }),
  
  // Slow down repeated requests
  slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 100, // allow 100 requests per windowMs without delay
    delayMs: 500, // add 500ms delay per request after delayAfter
    maxDelayMs: 20000, // max delay of 20 seconds
    skip: (req) => {
      return req.path.includes('/health') || req.path === '/metrics';
    }
  })
];
```

## 🔄 CI/CD Pipeline

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]
    paths:
      - 'backend/services/api-gateway/**'
      - 'backend/services/graphql-gateway/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Run security audit
        run: npm audit --audit-level high

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2
      
      - name: Login to Amazon ECR
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push API Gateway image
        run: |
          docker build -t $ECR_REGISTRY/hospital/api-gateway:$GITHUB_SHA ./backend/services/api-gateway
          docker push $ECR_REGISTRY/hospital/api-gateway:$GITHUB_SHA
          docker tag $ECR_REGISTRY/hospital/api-gateway:$GITHUB_SHA $ECR_REGISTRY/hospital/api-gateway:latest
          docker push $ECR_REGISTRY/hospital/api-gateway:latest
      
      - name: Build and push GraphQL Gateway image
        run: |
          docker build -t $ECR_REGISTRY/hospital/graphql-gateway:$GITHUB_SHA ./backend/services/graphql-gateway
          docker push $ECR_REGISTRY/hospital/graphql-gateway:$GITHUB_SHA
          docker tag $ECR_REGISTRY/hospital/graphql-gateway:$GITHUB_SHA $ECR_REGISTRY/hospital/graphql-gateway:latest
          docker push $ECR_REGISTRY/hospital/graphql-gateway:latest
      
      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --name hospital-production-cluster
          kubectl set image deployment/api-gateway api-gateway=$ECR_REGISTRY/hospital/api-gateway:$GITHUB_SHA
          kubectl set image deployment/graphql-gateway graphql-gateway=$ECR_REGISTRY/hospital/graphql-gateway:$GITHUB_SHA
          kubectl rollout status deployment/api-gateway
          kubectl rollout status deployment/graphql-gateway
```

## 📈 Performance Tuning

### 1. Node.js Optimization

```javascript
// server.js - Production optimizations
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Restart worker
  });
} else {
  // Worker process
  const app = require('./app');
  const PORT = process.env.PORT || 3100;
  
  // Optimize for production
  process.env.NODE_ENV = 'production';
  
  // Increase max listeners
  require('events').EventEmitter.defaultMaxListeners = 20;
  
  // Memory management
  if (process.env.NODE_ENV === 'production') {
    // Force garbage collection every 30 seconds
    setInterval(() => {
      if (global.gc) {
        global.gc();
      }
    }, 30000);
  }
  
  const server = app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started on port ${PORT}`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
}
```

### 2. Database Connection Pooling

```typescript
// database.config.ts
export const productionDbConfig = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  
  // Connection pooling
  pool: {
    min: 5,
    max: 20,
    acquire: 30000,
    idle: 10000
  },
  
  // Read replicas
  replication: {
    read: [
      {
        host: process.env.DATABASE_REPLICA_HOST,
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD
      }
    ],
    write: {
      host: process.env.DATABASE_HOST,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD
    }
  },
  
  // Logging
  logging: process.env.NODE_ENV === 'production' ? false : console.log,
  
  // SSL
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
};
```
