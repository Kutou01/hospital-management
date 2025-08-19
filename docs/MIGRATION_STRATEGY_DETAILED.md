# Migration Strategy & Planning - Hospital Authentication System

## 🎯 Migration Approach: Phased Zero-Downtime Strategy

### Strategy Overview
**Recommended**: **Blue-Green Deployment with Gradual Rollout**
- **Zero Downtime**: < 5 minutes total downtime
- **Risk Mitigation**: Instant rollback capability
- **User Impact**: Minimal disruption
- **Data Safety**: Multiple backup layers

## 📋 Pre-Migration Assessment

### Current System Inventory
```yaml
Database:
  - Users: ~100 active users
  - Profiles: Complete user profiles
  - Roles: 5 roles (patient, staff, doctor, admin, superadmin)
  - Sessions: Active user sessions
  - Audit Data: Limited logging

Infrastructure:
  - 11 Microservices running
  - Docker containers
  - Supabase PostgreSQL
  - API Gateway (ports 3100, 3200)

Dependencies:
  - Frontend: React/Next.js applications
  - External APIs: Payment, notification services
  - Third-party: Email providers, monitoring tools
```

### Migration Readiness Checklist
- [ ] **Database Backup**: Full backup completed
- [ ] **Service Inventory**: All microservices documented
- [ ] **API Mapping**: Current endpoints mapped
- [ ] **User Communication**: Migration notice sent
- [ ] **Rollback Plan**: Tested and verified
- [ ] **Monitoring**: Enhanced monitoring in place

## 🔄 Phase-by-Phase Migration Plan

### Phase 1: Foundation Setup (Week 1-2)
```yaml
Objective: Prepare new authentication infrastructure

Tasks:
  - Deploy new auth system in parallel
  - Set up database schema enhancements
  - Configure API gateway routing
  - Implement dual-write mechanism

Success Criteria:
  - New system deployed and accessible
  - Database schema updated
  - API routing configured
  - Monitoring active

Rollback: Simple - disable new routes
Risk Level: Low
```

#### Database Schema Migration
```sql
-- Phase 1: Add new columns to existing tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(2) DEFAULT 'vi';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_channel VARCHAR(10) DEFAULT 'email';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Create new tables for enhanced features
CREATE TABLE IF NOT EXISTS staff_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  invited_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  consumed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add audit logging table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 2: User Migration (Week 3-4)
```yaml
Objective: Migrate user accounts and authentication

Tasks:
  - Migrate user profiles to enhanced schema
  - Set up Supabase Auth for existing users
  - Implement session migration
  - Test authentication flows

Success Criteria:
  - All users can login with new system
  - User data integrity maintained
  - Sessions working correctly
  - Performance benchmarks met

Rollback: Restore user data, switch auth endpoints
Risk Level: Medium
```

#### User Data Migration Script
```typescript
// Migration script for user accounts
interface UserMigrationService {
  async migrateUsers() {
    const users = await this.getCurrentUsers()
    
    for (const user of users) {
      try {
        // Create Supabase Auth user
        const { data: authUser, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: this.generateTemporaryPassword(),
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
            role: user.role,
            migrated: true
          }
        })

        if (error) throw error

        // Update profile with new auth ID
        await supabase
          .from('profiles')
          .update({
            id: authUser.user.id,
            email_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('email', user.email)

        // Send password reset email
        await this.sendPasswordResetEmail(user.email)
        
        console.log(`✅ Migrated user: ${user.email}`)
      } catch (error) {
        console.error(`❌ Failed to migrate user: ${user.email}`, error)
        await this.logMigrationError(user.email, error)
      }
    }
  }
}
```

### Phase 3: Feature Enhancement (Week 5-6)
```yaml
Objective: Enable new authentication features

Tasks:
  - Deploy MFA system
  - Implement invitation system
  - Enable audit logging
  - Add rate limiting and CAPTCHA

Success Criteria:
  - MFA working for staff users
  - Invitation emails sent successfully
  - All actions logged
  - Security features active

Rollback: Disable new features, maintain core auth
Risk Level: Low
```

#### MFA Rollout Strategy
```typescript
// Gradual MFA enablement
const mfaRolloutPlan = {
  week1: ['superadmin', 'admin'], // Start with admins
  week2: ['doctor'],              // Add doctors
  week3: ['staff'],               // Add staff
  week4: ['patient']              // Optional for patients
}

async function enableMFAForRole(role: string) {
  const users = await getUsersByRole(role)
  
  for (const user of users) {
    // Send MFA setup instructions
    await sendMFASetupEmail(user.email, {
      setupUrl: `${APP_URL}/setup-mfa?token=${generateSetupToken(user.id)}`,
      deadline: addDays(new Date(), 7)
    })
  }
}
```

### Phase 4: Integration & Optimization (Week 7-8)
```yaml
Objective: Complete microservice integration

Tasks:
  - Update all microservices to use new auth
  - Optimize API performance
  - Complete user training
  - Decommission legacy auth components

Success Criteria:
  - All microservices integrated
  - API response times < 200ms
  - Users comfortable with new system
  - Legacy system safely removed

Rollback: Revert microservice configurations
Risk Level: Low
```

## 🔄 Dual-Write Strategy for Zero Downtime

### Implementation Pattern
```typescript
class DualWriteAuthService {
  constructor(
    private newAuthService: NewAuthService,
    private legacyAuthService: LegacyAuthService,
    private migrationConfig: MigrationConfig
  ) {}

  async authenticateUser(email: string, password: string) {
    // Always try new system first
    try {
      const result = await this.newAuthService.authenticate(email, password)
      
      // If successful, update legacy system asynchronously
      this.updateLegacySystemAsync(result.user)
      
      return result
    } catch (error) {
      // Fallback to legacy system if new system fails
      if (this.migrationConfig.allowFallback) {
        console.warn('New auth failed, falling back to legacy:', error)
        return await this.legacyAuthService.authenticate(email, password)
      }
      throw error
    }
  }

  async createUser(userData: UserData) {
    // Write to new system (primary)
    const newUser = await this.newAuthService.createUser(userData)
    
    try {
      // Write to legacy system (backup)
      await this.legacyAuthService.createUser(userData)
    } catch (error) {
      console.warn('Legacy write failed:', error)
      // Don't fail the operation - new system is primary
    }
    
    return newUser
  }

  private async updateLegacySystemAsync(user: User) {
    // Update legacy system in background
    setTimeout(async () => {
      try {
        await this.legacyAuthService.updateUser(user)
      } catch (error) {
        console.warn('Legacy update failed:', error)
      }
    }, 0)
  }
}
```

## 📊 Data Migration Strategy

### Migration Validation Framework
```typescript
interface MigrationValidator {
  async validateUserMigration(): Promise<ValidationResult> {
    const results = {
      userCount: await this.validateUserCount(),
      dataIntegrity: await this.validateDataIntegrity(),
      authFunctionality: await this.validateAuthFunctionality(),
      permissions: await this.validatePermissions()
    }
    
    return {
      success: Object.values(results).every(r => r.success),
      details: results
    }
  }

  private async validateUserCount(): Promise<ValidationResult> {
    const legacyCount = await this.legacyDB.users.count()
    const newCount = await this.newDB.profiles.count()
    
    return {
      success: legacyCount === newCount,
      message: `User count: Legacy=${legacyCount}, New=${newCount}`,
      critical: true
    }
  }

  private async validateDataIntegrity(): Promise<ValidationResult> {
    const sampleUsers = await this.legacyDB.users.findMany({ limit: 50 })
    let errors = 0
    
    for (const user of sampleUsers) {
      const migratedUser = await this.newDB.profiles.findByEmail(user.email)
      if (!this.compareUserData(user, migratedUser)) {
        errors++
      }
    }
    
    return {
      success: errors === 0,
      message: `Data integrity: ${errors} errors in ${sampleUsers.length} samples`,
      critical: true
    }
  }
}
```

### Rollback Procedures

#### Emergency Rollback (< 5 minutes)
```bash
#!/bin/bash
# emergency-rollback.sh

echo "🚨 EMERGENCY ROLLBACK INITIATED"

# 1. Switch load balancer to legacy system
kubectl patch service auth-service -p '{"spec":{"selector":{"version":"legacy"}}}'

# 2. Disable new authentication endpoints
kubectl scale deployment new-auth-service --replicas=0

# 3. Restore database if needed
if [ "$RESTORE_DB" = "true" ]; then
  psql $DATABASE_URL < backups/pre-migration-backup.sql
fi

# 4. Verify legacy system
curl -f http://legacy-auth/health || exit 1

echo "✅ Emergency rollback completed"
```

#### Planned Rollback (< 30 minutes)
```bash
#!/bin/bash
# planned-rollback.sh

echo "🔄 PLANNED ROLLBACK INITIATED"

# 1. Notify users
curl -X POST $NOTIFICATION_SERVICE/broadcast \
  -d '{"message":"System maintenance in progress","type":"warning"}'

# 2. Gracefully drain new system
kubectl drain new-auth-pods --grace-period=300

# 3. Restore database from backup
pg_restore -d $DATABASE_URL backups/pre-migration-backup.dump

# 4. Restart legacy services
kubectl apply -f legacy-auth-deployment.yaml

# 5. Update DNS/load balancer
kubectl patch ingress auth-ingress -p '{"spec":{"rules":[{"host":"auth.hospital.com","http":{"paths":[{"path":"/","backend":{"serviceName":"legacy-auth","servicePort":3000}}]}}]}}'

# 6. Verify all systems
./scripts/verify-legacy-system.sh

echo "✅ Planned rollback completed"
```

## 📈 Performance & Monitoring

### Migration Monitoring Dashboard
```typescript
interface MigrationMetrics {
  userMigrationProgress: {
    total: number
    migrated: number
    failed: number
    percentage: number
  }
  
  systemPerformance: {
    authResponseTime: number
    errorRate: number
    throughput: number
  }
  
  userExperience: {
    loginSuccessRate: number
    supportTickets: number
    userSatisfaction: number
  }
}

// Real-time monitoring
class MigrationMonitor {
  async trackMigrationProgress() {
    const metrics = await this.collectMetrics()
    
    // Alert if error rate > 5%
    if (metrics.systemPerformance.errorRate > 0.05) {
      await this.sendAlert('High error rate detected', metrics)
    }
    
    // Alert if user satisfaction < 80%
    if (metrics.userExperience.userSatisfaction < 0.8) {
      await this.sendAlert('User satisfaction below threshold', metrics)
    }
    
    return metrics
  }
}
```

### Success Criteria & KPIs

#### Technical KPIs
- **Uptime**: > 99.9% during migration
- **Response Time**: < 200ms for auth endpoints
- **Error Rate**: < 1% for all operations
- **Data Integrity**: 100% data consistency

#### Business KPIs
- **User Adoption**: > 95% successful logins
- **Support Tickets**: < 10% increase
- **User Satisfaction**: > 90% approval
- **Security Incidents**: 0 incidents

#### Migration KPIs
- **Migration Speed**: 100 users/hour
- **Rollback Time**: < 5 minutes if needed
- **Data Loss**: 0 tolerance
- **Downtime**: < 5 minutes total

## 🎯 Communication Plan

### Stakeholder Communication
```yaml
Pre-Migration (2 weeks before):
  - Executive briefing on benefits and timeline
  - IT team technical training sessions
  - User communication about upcoming changes

During Migration:
  - Real-time status updates
  - Immediate notification of any issues
  - Support team on standby

Post-Migration:
  - Success metrics report
  - User feedback collection
  - Lessons learned documentation
```

### User Training Program
```yaml
Week 1: Administrators
  - New admin features training
  - Invitation system walkthrough
  - Audit logging overview

Week 2: Medical Staff
  - Enhanced security features
  - MFA setup assistance
  - New login procedures

Week 3: Support Staff
  - User support procedures
  - Troubleshooting guide
  - Escalation processes

Week 4: All Users
  - General system overview
  - FAQ and common issues
  - Feedback collection
```

## ✅ Migration Checklist

### Pre-Migration
- [ ] Full system backup completed
- [ ] New system deployed and tested
- [ ] Migration scripts validated
- [ ] Rollback procedures tested
- [ ] Monitoring systems active
- [ ] Support team briefed
- [ ] Users notified

### During Migration
- [ ] Migration progress monitored
- [ ] Performance metrics tracked
- [ ] User feedback collected
- [ ] Issues documented and resolved
- [ ] Rollback readiness maintained

### Post-Migration
- [ ] All users successfully migrated
- [ ] System performance verified
- [ ] Security features active
- [ ] Legacy system decommissioned
- [ ] Documentation updated
- [ ] Success metrics reported
