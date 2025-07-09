# 🔒 Security Guide - Hospital Management System

## 📋 Table of Contents

1. [Environment Variables Security](#environment-variables-security)
2. [Key Management](#key-management)
3. [Authentication & Authorization](#authentication--authorization)
4. [API Security](#api-security)
5. [Database Security](#database-security)
6. [Docker Security](#docker-security)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [Security Checklist](#security-checklist)
9. [Emergency Response](#emergency-response)

---

## 🔐 Environment Variables Security

### ✅ Best Practices

1. **Never commit .env files to git**
   ```bash
   # Always in .gitignore
   .env*
   backend/.env*
   frontend/.env*
   ```

2. **Use .env.example templates**
   ```bash
   # Create templates for team members
   cp .env .env.example
   # Replace real values with placeholders
   ```

3. **Validate environment variables**
   ```typescript
   // Use SecurityValidator in all services
   import { SecurityValidator } from '@hospital/shared/dist/utils/securityValidator';
   SecurityValidator.validateOrExit();
   ```

### 🔧 Setup Commands

```bash
# Initial security setup
npm run setup:security

# Security audit
npm run security:audit

# Generate secure keys
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🔑 Key Management

### 🔄 Key Rotation Schedule

| Key Type | Rotation Frequency | Priority |
|----------|-------------------|----------|
| JWT_SECRET | 3 months | High |
| Database passwords | 6 months | High |
| API keys | 3 months | Medium |
| Service tokens | 1 month | Medium |

### 🛡️ Key Security Requirements

1. **JWT_SECRET**: Minimum 64 characters, cryptographically random
2. **Database keys**: Use Supabase service role keys
3. **API keys**: Scope to minimum required permissions
4. **Passwords**: Minimum 12 characters, mixed case, numbers, symbols

### 🔐 Key Generation

```bash
# Generate secure JWT secret
openssl rand -hex 64

# Generate secure password
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔒 Authentication & Authorization

### 🎯 Authentication Flow

1. **User Registration**
   - Email verification required
   - Strong password policy
   - Rate limiting on registration attempts

2. **Login Process**
   - JWT token generation
   - Refresh token mechanism
   - Failed login monitoring

3. **Token Validation**
   - JWT signature verification
   - Token expiration checks
   - Blacklist support

### 🛡️ Authorization Levels

```typescript
// Role-based access control
enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient',
  NURSE = 'nurse'
}

// Permission-based access
enum Permission {
  READ_PATIENT_DATA = 'read:patient_data',
  WRITE_MEDICAL_RECORDS = 'write:medical_records',
  MANAGE_APPOINTMENTS = 'manage:appointments'
}
```

---

## 🌐 API Security

### 🔒 Security Middleware Stack

1. **Helmet** - Security headers
2. **CORS** - Cross-origin protection
3. **Rate Limiting** - DDoS protection
4. **Input Validation** - SQL injection prevention
5. **Authentication** - JWT verification
6. **Authorization** - Role-based access

### 📊 Rate Limiting Configuration

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // requests per window
  message: "Too many requests",
  onLimitReached: (req) => {
    securityMonitor.logRateLimitExceeded(req.ip, 1000, 1001);
  }
});
```

### 🔍 Input Validation

```typescript
// Always validate and sanitize input
import { body, validationResult } from 'express-validator';

const validatePatientData = [
  body('email').isEmail().normalizeEmail(),
  body('phone').isMobilePhone('vi-VN'),
  body('name').trim().escape(),
];
```

---

## 🗄️ Database Security

### 🔐 Supabase Security

1. **Row Level Security (RLS)**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
   
   -- Create policies
   CREATE POLICY "Users can only see their own data" 
   ON patients FOR SELECT 
   USING (auth.uid() = user_id);
   ```

2. **Service Role vs Anon Key**
   - **Service Role**: Backend operations only
   - **Anon Key**: Frontend, public operations

3. **Database Functions**
   ```sql
   -- Use security definer functions
   CREATE OR REPLACE FUNCTION get_patient_data(patient_id UUID)
   RETURNS TABLE(...)
   SECURITY DEFINER
   SET search_path = public
   AS $$
   BEGIN
     -- Validate permissions
     IF NOT has_permission(auth.uid(), 'read:patient_data') THEN
       RAISE EXCEPTION 'Access denied';
     END IF;
     
     RETURN QUERY SELECT ...;
   END;
   $$ LANGUAGE plpgsql;
   ```

---

## 🐳 Docker Security

### 🔒 Container Security

1. **Non-root user**
   ```dockerfile
   # Create non-root user
   RUN addgroup -g 1001 -S nodejs
   RUN adduser -S nextjs -u 1001
   USER nextjs
   ```

2. **Minimal base images**
   ```dockerfile
   FROM node:18-alpine AS base
   # Use alpine for smaller attack surface
   ```

3. **Security scanning**
   ```bash
   # Scan images for vulnerabilities
   docker scan hospital/api-gateway:latest
   ```

### 🔐 Secrets Management

```yaml
# Use Docker secrets in production
services:
  api-gateway:
    secrets:
      - jwt_secret
      - db_password
    environment:
      - JWT_SECRET_FILE=/run/secrets/jwt_secret

secrets:
  jwt_secret:
    external: true
  db_password:
    external: true
```

---

## 📊 Monitoring & Alerting

### 🔍 Security Events

```typescript
// Log security events
securityMonitor.logAuthFailure(email, 'invalid_password');
securityMonitor.logSuspiciousActivity('Multiple failed logins', { ip, userAgent });
securityMonitor.logKeyCompromise('jwt_secret', { reason: 'exposed_in_logs' });
```

### 🚨 Alert Thresholds

| Event Type | Threshold | Action |
|------------|-----------|--------|
| Failed logins | 5 in 1 hour | Block IP |
| Rate limit exceeded | 3 times | Investigate |
| Key compromise | 1 occurrence | Immediate rotation |
| Suspicious activity | 1 occurrence | Manual review |

### 📈 Monitoring Dashboard

```typescript
// Get security statistics
const stats = securityMonitor.getSecurityStats(24); // Last 24 hours
console.log(`Total events: ${stats.totalEvents}`);
console.log(`Critical events: ${stats.eventsBySeverity.critical || 0}`);
```

---

## ✅ Security Checklist

### 🚀 Before Deployment

- [ ] All environment variables validated
- [ ] No hardcoded secrets in code
- [ ] Security audit passed
- [ ] Dependencies updated and audited
- [ ] Rate limiting configured
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Database RLS policies active
- [ ] Monitoring and alerting setup
- [ ] Backup and recovery tested

### 🔄 Regular Maintenance

- [ ] Rotate keys quarterly
- [ ] Update dependencies monthly
- [ ] Review access logs weekly
- [ ] Security audit monthly
- [ ] Penetration testing annually

### 🚨 Incident Response

- [ ] Incident response plan documented
- [ ] Emergency contacts updated
- [ ] Key rotation procedures tested
- [ ] Backup restoration verified
- [ ] Communication plan ready

---

## 🚨 Emergency Response

### 🔥 Key Compromise Response

1. **Immediate Actions**
   ```bash
   # Revoke compromised key
   # Generate new key
   NEW_KEY=$(openssl rand -hex 64)
   
   # Update all services
   # Restart all containers
   docker-compose restart
   ```

2. **Investigation**
   - Check access logs
   - Identify compromise source
   - Assess data exposure
   - Document timeline

3. **Recovery**
   - Deploy new keys
   - Verify system integrity
   - Monitor for suspicious activity
   - Update security measures

### 📞 Emergency Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| Security Lead | security@hospital.vn | Overall incident response |
| DevOps Lead | devops@hospital.vn | Infrastructure and deployment |
| Database Admin | dba@hospital.vn | Database security and recovery |

---

## 🔧 Tools and Scripts

### 📋 Available Commands

```bash
# Security setup
npm run setup:security

# Security audit
npm run security:audit

# Generate secure keys
npm run security:generate-keys

# Check environment
npm run security:check-env

# Rotate keys
npm run security:rotate-keys
```

### 🛠️ Manual Tools

```bash
# Check for secrets in code
grep -r "sk_\|pk_\|eyJ" --include="*.ts" --include="*.js" .

# Audit dependencies
npm audit --audit-level high

# Check file permissions
find . -name ".env*" -exec ls -la {} \;

# Monitor logs
tail -f logs/security.log | grep "CRITICAL\|HIGH"
```

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Supabase Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 📝 Security Policy

For reporting security vulnerabilities, please email: security@hospital.vn

**Do not** create public issues for security vulnerabilities.
