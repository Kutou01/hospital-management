# 🚀 Deployment Guide - Hospital Management System

## 📋 Overview

This guide covers various deployment strategies for the Hospital Management System, from development to production environments.

## 🏗️ Deployment Architecture Options

### Option 1: Cloud-Native (Recommended)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Vercel       │    │    Railway      │    │   Supabase      │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│  (Database)     │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Next.js   │ │    │ │API Gateway  │ │    │ │ PostgreSQL  │ │
│ │   Static    │ │    │ │Microservices│ │    │ │    Auth     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Option 2: VPS with Docker
```
┌─────────────────────────────────────────────────────────────┐
│                    VPS Server                               │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Nginx     │  │   Docker    │  │      Supabase       │ │
│  │Load Balancer│  │ Containers  │  │    (External)       │ │
│  │             │  │             │  │                     │ │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────────────┐ │ │
│  │ │SSL/TLS  │ │  │ │Frontend │ │  │ │   PostgreSQL    │ │ │
│  │ │Certbot  │ │  │ │Backend  │ │  │ │   Auth Service  │ │ │
│  │ └─────────┘ │  │ │Services │ │  │ └─────────────────┘ │ │
│  └─────────────┘  │ └─────────┘ │  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Option 3: Kubernetes
```
┌─────────────────────────────────────────────────────────────┐
│                 Kubernetes Cluster                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Ingress    │  │    Pods     │  │     Services        │ │
│  │ Controller  │  │             │  │                     │ │
│  │             │  │ ┌─────────┐ │  │ ┌─────────────────┐ │ │
│  │ ┌─────────┐ │  │ │Frontend │ │  │ │  LoadBalancer   │ │ │
│  │ │ Nginx   │ │  │ │Backend  │ │  │ │   ClusterIP     │ │ │
│  │ │ Traefik │ │  │ │Services │ │  │ │   NodePort      │ │ │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────────────┘ │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🌐 Option 1: Cloud-Native Deployment

### Prerequisites
- Vercel account
- Railway account
- Supabase project
- GitHub repository

### 1. Supabase Setup
```bash
# 1. Create Supabase project at supabase.com
# 2. Note down your project URL and keys
# 3. Set up database tables (if not already done)

# Optional: Use Supabase CLI
npm install -g supabase
supabase login
supabase init
supabase db push
```

### 2. Frontend Deployment (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# NEXT_PUBLIC_API_GATEWAY_URL

# Deploy to production
vercel --prod
```

#### Vercel Configuration (vercel.json)
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "NEXT_PUBLIC_API_GATEWAY_URL": "@api-gateway-url"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
      "NEXT_PUBLIC_API_GATEWAY_URL": "@api-gateway-url"
    }
  }
}
```

### 3. Backend Deployment (Railway)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy API Gateway
cd backend/api-gateway
railway deploy

# Deploy each microservice
cd ../services/appointment-service
railway deploy

cd ../doctor-service
railway deploy

# Continue for other services...
```

#### Railway Configuration (railway.toml)
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
PORT = "3100"
```

### 4. Environment Variables Setup

#### Vercel Environment Variables
```bash
# Set via Vercel CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_API_GATEWAY_URL

# Or via Vercel Dashboard
# Go to Project Settings > Environment Variables
```

#### Railway Environment Variables
```bash
# Set via Railway CLI
railway variables set SUPABASE_URL=your-supabase-url
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-service-key
railway variables set NODE_ENV=production

# Or via Railway Dashboard
# Go to Project > Variables
```

## 🐳 Option 2: VPS with Docker

### Prerequisites
- VPS server (Ubuntu 20.04+ recommended)
- Docker and Docker Compose installed
- Domain name (optional)
- SSL certificate (Let's Encrypt)

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

### 2. Deploy Application
```bash
# Clone repository
git clone https://github.com/Kutou01/hospital-management.git
cd hospital-management

# Set up environment files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
cp backend/api-gateway/.env.example backend/api-gateway/.env

# Update environment variables with production values
nano frontend/.env.local
nano backend/.env
nano backend/api-gateway/.env

# Build and start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 3. Nginx Configuration
```nginx
# /etc/nginx/sites-available/hospital-management
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API Gateway
    location /api/ {
        proxy_pass http://localhost:3100/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 5. Monitoring and Logging
```bash
# View logs
docker-compose logs -f

# Monitor resource usage
docker stats

# Set up log rotation
sudo nano /etc/logrotate.d/docker-containers
```

## ☸️ Option 3: Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (local or cloud)
- kubectl configured
- Docker images built and pushed to registry

### 1. Build and Push Images
```bash
# Build images
docker build -t your-registry/hospital-frontend:latest ./frontend
docker build -t your-registry/hospital-api-gateway:latest ./backend/api-gateway

# Push to registry
docker push your-registry/hospital-frontend:latest
docker push your-registry/hospital-api-gateway:latest
```

### 2. Kubernetes Manifests

#### Namespace
```yaml
# deployment/k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: hospital-management
```

#### ConfigMap
```yaml
# deployment/k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: hospital-config
  namespace: hospital-management
data:
  NODE_ENV: "production"
  API_GATEWAY_URL: "http://api-gateway-service:3100"
```

#### Secret
```yaml
# deployment/k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: hospital-secrets
  namespace: hospital-management
type: Opaque
data:
  SUPABASE_URL: <base64-encoded-url>
  SUPABASE_SERVICE_ROLE_KEY: <base64-encoded-key>
  JWT_SECRET: <base64-encoded-secret>
```

#### Frontend Deployment
```yaml
# deployment/k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: hospital-management
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/hospital-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: hospital-config
              key: NODE_ENV
        - name: NEXT_PUBLIC_SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: hospital-secrets
              key: SUPABASE_URL
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

#### Service
```yaml
# deployment/k8s/frontend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: hospital-management
spec:
  selector:
    app: frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

#### Ingress
```yaml
# deployment/k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hospital-ingress
  namespace: hospital-management
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: hospital-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-gateway-service
            port:
              number: 3100
```

### 3. Deploy to Kubernetes
```bash
# Apply all manifests
kubectl apply -f deployment/k8s/

# Check deployment status
kubectl get pods -n hospital-management
kubectl get services -n hospital-management
kubectl get ingress -n hospital-management

# View logs
kubectl logs -f deployment/frontend -n hospital-management
```

## 🔧 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@v1.0.0
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: "api-gateway"
```

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Frontend health check
curl https://your-domain.com/api/health

# Backend health check
curl https://your-api-domain.com/health

# Database health check
curl https://your-api-domain.com/health/db
```

### Backup Strategy
```bash
# Supabase automatic backups (included)
# Additional backup script
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Monitoring Tools
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **Analytics**: Google Analytics, Mixpanel
- **Performance**: Lighthouse CI

---

**Happy Deploying! 🚀**
