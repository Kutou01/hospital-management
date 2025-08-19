# 🚨 SECURITY WARNINGS & BEST PRACTICES

## ⚠️ CRITICAL SECURITY NOTICES

### 🔐 **NEVER COMMIT SENSITIVE DATA**

**ABSOLUTELY FORBIDDEN:**
- ❌ Real passwords in code/docs
- ❌ Production API keys
- ❌ Database credentials
- ❌ Real email addresses
- ❌ Personal information
- ❌ Production URLs/endpoints

### 📝 **TEST DATA GUIDELINES**

#### ✅ **SAFE for Testing:**
```javascript
// Good - Environment variables
const testEmail = process.env.TEST_EMAIL || 'test@example.com'
const testPassword = process.env.TEST_PASSWORD || generateRandomPassword()

// Good - Clearly marked test data
const TEST_USER = {
  email: 'test-user@localhost.test',
  password: 'TestPassword123!', // Clearly test-only
  domain: 'localhost.test' // Non-real domain
}

// Good - Generated/random data
const generateTestEmail = () => `test-${Date.now()}@example.com`
const generateTestPassword = () => `Test${Math.random().toString(36)}!`
```

#### ❌ **DANGEROUS - Never Do This:**
```javascript
// Bad - Real-looking credentials
const ADMIN_EMAIL = 'admin@hospital.com'
const ADMIN_PASSWORD = 'Admin123!'

// Bad - Production-like data
const API_KEY = 'sk_live_...'
const DATABASE_URL = 'postgresql://user:pass@prod-db.com'

// Bad - Real personal info
const USER_DATA = {
  email: 'john.doe@gmail.com',
  phone: '+1234567890',
  ssn: '123-45-6789'
}
```

## 🛡️ **SECURE DEVELOPMENT PRACTICES**

### 1. **Environment Variables**
```bash
# .env.local (NEVER commit this file)
TEST_ADMIN_EMAIL=test-admin@localhost.test
TEST_ADMIN_PASSWORD=SecureTestPassword123!
TEST_DATABASE_URL=postgresql://localhost:5432/test_db

# .env.example (Safe to commit)
TEST_ADMIN_EMAIL=your-test-admin@example.com
TEST_ADMIN_PASSWORD=your-secure-test-password
TEST_DATABASE_URL=your-test-database-url
```

### 2. **Test Data Generation**
```javascript
// Secure test data generation
class SecureTestDataGenerator {
  static generateEmail(prefix = 'test') {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${prefix}-${timestamp}-${random}@localhost.test`
  }

  static generatePassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  static generateTestUser(role = 'patient') {
    return {
      email: this.generateEmail(role),
      password: this.generatePassword(),
      full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      role: role
    }
  }
}
```

### 3. **Documentation Security**
```markdown
<!-- Good - Generic examples -->
Email: your-test-email@example.com
Password: [Your secure test password]
API Key: [Your test API key]

<!-- Bad - Specific values -->
Email: admin@hospital.com
Password: Admin123!
API Key: sk_test_1234567890
```

## 🔍 **SECURITY AUDIT CHECKLIST**

### Before Committing Code:
- [ ] No hardcoded passwords
- [ ] No real email addresses
- [ ] No API keys or tokens
- [ ] No database credentials
- [ ] No production URLs
- [ ] All test data clearly marked
- [ ] Environment variables used for sensitive data
- [ ] .env files in .gitignore

### Before Sharing Documentation:
- [ ] No real credentials in examples
- [ ] Test data uses example.com domains
- [ ] Clear warnings about test-only data
- [ ] No personal information
- [ ] No production configuration details

### Before Deployment:
- [ ] All test credentials removed
- [ ] Production environment variables set
- [ ] Test endpoints disabled
- [ ] Debug modes turned off
- [ ] Logging sanitized

## 🚨 **INCIDENT RESPONSE**

### If Sensitive Data is Accidentally Committed:

1. **Immediate Actions:**
   ```bash
   # Remove from latest commit
   git reset --soft HEAD~1
   git reset HEAD <file-with-sensitive-data>
   git checkout -- <file-with-sensitive-data>
   git commit -m "Remove sensitive data"
   
   # If already pushed
   git push --force-with-lease
   ```

2. **Change All Exposed Credentials:**
   - Rotate API keys
   - Change passwords
   - Update database credentials
   - Revoke access tokens

3. **Notify Team:**
   - Alert security team
   - Document incident
   - Review access logs
   - Update security procedures

## 📚 **SECURE TESTING GUIDELINES**

### Test Environment Setup:
```bash
# Use separate test database
TEST_DATABASE_URL=postgresql://localhost:5432/hospital_test

# Use test email service
TEST_SMTP_HOST=smtp.mailtrap.io
TEST_SMTP_USER=test-user
TEST_SMTP_PASS=test-pass

# Use test payment gateway
TEST_PAYMENT_API_KEY=pk_test_...
```

### Test Data Management:
```javascript
// Cleanup test data after tests
afterEach(async () => {
  await cleanupTestUsers()
  await cleanupTestInvitations()
  await clearTestEmails()
})

// Use test-specific prefixes
const TEST_EMAIL_PREFIX = 'test-hospital-'
const TEST_DOMAIN = 'localhost.test'
```

## 🔒 **PRODUCTION SECURITY**

### Environment Separation:
- **Development**: `localhost`, test data, debug enabled
- **Staging**: Production-like, sanitized data, limited debug
- **Production**: Real data, no debug, full security

### Access Control:
- Separate credentials for each environment
- Role-based access to production
- Audit logs for all production access
- Regular credential rotation

## 📞 **SECURITY CONTACTS**

If you discover a security vulnerability:

1. **DO NOT** commit the fix immediately
2. **DO NOT** discuss in public channels
3. **DO** report to security team privately
4. **DO** follow responsible disclosure

---

## ⚡ **QUICK REFERENCE**

### ✅ **Safe Test Patterns:**
```javascript
// Environment-based
const testEmail = process.env.TEST_EMAIL || 'test@example.com'

// Generated
const testEmail = `test-${Date.now()}@localhost.test`

// Clearly marked
const TEST_CREDENTIALS = { /* test only */ }
```

### ❌ **Dangerous Patterns:**
```javascript
// Hardcoded real-looking data
const email = 'admin@hospital.com'
const password = 'Admin123!'
const apiKey = 'sk_live_...'
```

---

**Remember: When in doubt, ask the security team! 🛡️**
