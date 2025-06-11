# 📜 Scripts Reference - Hospital Management System

## 📋 Tổng Quan Scripts

Dự án có nhiều scripts để hỗ trợ development, testing, và database management. Document này cung cấp reference đầy đủ cho tất cả scripts.

## 🏠 Root Level Scripts

### check-progress.js
**Mục đích:** Kiểm tra tiến độ phát triển tổng thể
```bash
node check-progress.js
```
**Output:**
- Hiển thị tasks đã hoàn thành
- Tasks còn lại cần làm
- Recommendations cho bước tiếp theo
- Progress percentage

### test-all-roles.js
**Mục đích:** Test authentication cho tất cả user roles
```bash
node test-all-roles.js
```
**Test cases:**
- Admin login/logout
- Doctor registration/login
- Patient registration/login
- Role-based access control
- Permission verification

### create-admin-account.js
**Mục đích:** Tạo admin account mặc định
```bash
node create-admin-account.js
```
**Chức năng:**
- Tạo admin user với credentials mặc định
- Setup admin permissions
- Initialize admin profile

### check-database-direct.js
**Mục đích:** Kiểm tra kết nối database trực tiếp
```bash
node check-database-direct.js
```
**Kiểm tra:**
- Supabase connection
- Database accessibility
- Basic query execution
- Table existence

### check-patient-profile-link.js
**Mục đích:** Kiểm tra liên kết patient profile
```bash
node check-patient-profile-link.js
```
**Validation:**
- Patient-profile relationship
- Foreign key constraints
- Data consistency

### fix-patient-profile-auto.js
**Mục đích:** Tự động fix patient profile issues
```bash
node fix-patient-profile-auto.js
```
**Fixes:**
- Broken patient-profile links
- Missing profile records
- Data inconsistencies

### test-patient-id-direct.js
**Mục đích:** Test patient ID format trực tiếp
```bash
node test-patient-id-direct.js
```
**Validation:**
- Department-based ID format
- ID uniqueness
- Format compliance

### test-patient-id.js
**Mục đích:** Test patient ID generation
```bash
node test-patient-id.js
```
**Test cases:**
- ID generation logic
- Format validation
- Uniqueness check
- Department assignment

### test-patient-service.js
**Mục đích:** Test patient service functionality
```bash
node test-patient-service.js
```
**Test coverage:**
- Patient CRUD operations
- Service endpoints
- Data validation
- Error handling

### check-test-accounts.js
**Mục đích:** Kiểm tra test accounts
```bash
node check-test-accounts.js
```
**Verification:**
- Test account existence
- Account status
- Role assignments
- Login capabilities

## 🔧 Backend Scripts (backend/scripts/)

### deploy-complete-database.js
**Mục đích:** Deploy complete database schema
```bash
node backend/scripts/deploy-complete-database.js
```
**Deployment:**
- Create all tables
- Setup Department-Based ID system
- Deploy triggers và functions
- Insert initial data

### verify-complete-database.js
**Mục đích:** Verify database deployment
```bash
node backend/scripts/verify-complete-database.js
```
**Verification:**
- Table structure validation
- Constraint checking
- Relationship verification
- Data integrity check

### check-database-status.js
**Mục đích:** Monitor database health
```bash
node backend/scripts/check-database-status.js
```
**Monitoring:**
- Connection status
- Table counts
- Performance metrics
- Error detection

### check-sample-data.js
**Mục đích:** Verify sample data
```bash
node backend/scripts/check-sample-data.js
```
**Validation:**
- Sample data insertion
- Department-Based ID format
- Data relationships
- Referential integrity

### check-table-structure.js
**Mục đích:** Check database table structure
```bash
node backend/scripts/check-table-structure.js
```
**Analysis:**
- Table schema validation
- Column definitions
- Index verification
- Constraint checking

### find-patient-by-profile.js
**Mục đích:** Find patient by profile ID
```bash
node backend/scripts/find-patient-by-profile.js
```
**Search:**
- Profile-based patient lookup
- Relationship verification
- Data retrieval

### deploy-department-based-system.js
**Mục đích:** Deploy Department-Based ID system
```bash
node backend/scripts/deploy-department-based-system.js
```
**Deployment:**
- ID generation functions
- Department mappings
- Sequence management
- Validation rules

## 🔐 Auth Service Scripts (backend/services/auth-service/)

### test-unified-auth.js
**Mục đích:** Test unified authentication system
```bash
cd backend/services/auth-service
node test-unified-auth.js
```
**Test coverage:**
- All authentication methods
- Token generation/validation
- Session management
- Role-based access

### debug-auth.js
**Mục đích:** Debug authentication issues
```bash
cd backend/services/auth-service
node debug-auth.js
```
**Debugging:**
- Detailed error logging
- Step-by-step auth process
- Token inspection
- Session analysis

### test-doctor-registration.js
**Mục đích:** Test doctor registration flow
```bash
cd backend/services/auth-service
node test-doctor-registration.js
```
**Test cases:**
- Doctor-specific validation
- License number format
- Specialty assignment
- Profile creation

### test-patient-signin.js
**Mục đích:** Test patient sign-in process
```bash
cd backend/services/auth-service
node test-patient-signin.js
```
**Test scenarios:**
- Patient login flow
- Credential validation
- Session creation
- Profile linking

### populate-enum-tables.js
**Mục đích:** Populate enum tables
```bash
cd backend/services/auth-service
node populate-enum-tables.js
```
**Data insertion:**
- Specialties
- Departments
- Status values
- System constants

### test-auth-service.js
**Mục đích:** Comprehensive auth service testing
```bash
cd backend/services/auth-service
node test-auth-service.js
```
**Full test suite:**
- All auth endpoints
- Error handling
- Performance testing
- Security validation

### check-actual-schema.js
**Mục đích:** Check actual database schema
```bash
cd backend/services/auth-service
node check-actual-schema.js
```
**Schema analysis:**
- Current table structure
- Column definitions
- Constraint verification
- Schema comparison

### check-empty-tables.js
**Mục đích:** Check for empty tables
```bash
cd backend/services/auth-service
node check-empty-tables.js
```
**Analysis:**
- Table row counts
- Empty table identification
- Data distribution
- Missing data detection

### check-enum-tables.js
**Mục đích:** Check enum table data
```bash
cd backend/services/auth-service
node check-enum-tables.js
```
**Validation:**
- Enum table population
- Value consistency
- Reference integrity
- Missing enum values

### debug-patient-query.js
**Mục đích:** Debug patient query issues
```bash
cd backend/services/auth-service
node debug-patient-query.js
```
**Debugging:**
- Query execution analysis
- Performance profiling
- Result validation
- Error identification

### test-basic-auth.js
**Mục đích:** Test basic authentication
```bash
cd backend/services/auth-service
node test-basic-auth.js
```
**Basic tests:**
- Login/logout functionality
- Password validation
- Token generation
- Session management

### test-registration-simple.js
**Mục đích:** Simple registration testing
```bash
cd backend/services/auth-service
node test-registration-simple.js
```
**Simple test cases:**
- User registration
- Basic validation
- Account creation
- Initial setup

## 🧪 Testing Strategy

### Test Categories

**1. Unit Tests**
- Individual function testing
- Component isolation
- Mock data usage
- Fast execution

**2. Integration Tests**
- Service interaction testing
- Database integration
- API endpoint testing
- Real data usage

**3. End-to-End Tests**
- Complete workflow testing
- User journey simulation
- Cross-service communication
- Production-like environment

### Running Tests

**Run all tests:**
```bash
# Root level tests
npm test

# Service-specific tests
cd backend/services/auth-service
npm test
```

**Run specific test category:**
```bash
# Authentication tests
node test-all-roles.js

# Database tests
node backend/scripts/check-database-status.js

# Service tests
node test-patient-service.js
```

## 📊 Script Usage Patterns

### Development Workflow

1. **Start development:**
```bash
node check-progress.js
```

2. **Setup database:**
```bash
node backend/scripts/deploy-complete-database.js
node backend/scripts/verify-complete-database.js
```

3. **Test functionality:**
```bash
node test-all-roles.js
node test-patient-service.js
```

4. **Debug issues:**
```bash
cd backend/services/auth-service
node debug-auth.js
```

### Maintenance Tasks

**Daily checks:**
```bash
node check-database-direct.js
node backend/scripts/check-database-status.js
```

**Weekly maintenance:**
```bash
node check-test-accounts.js
node backend/scripts/check-sample-data.js
```

**Monthly cleanup:**
```bash
node fix-patient-profile-auto.js
cd backend/services/auth-service
node populate-enum-tables.js
```

## 🔍 Troubleshooting Scripts

### Common Issues & Solutions

**Database connection issues:**
```bash
node check-database-direct.js
node backend/scripts/check-database-status.js
```

**Authentication problems:**
```bash
cd backend/services/auth-service
node debug-auth.js
node test-basic-auth.js
```

**Patient profile issues:**
```bash
node check-patient-profile-link.js
node fix-patient-profile-auto.js
```

**ID format problems:**
```bash
node test-patient-id.js
node test-patient-id-direct.js
```

## 📚 Best Practices

### Script Development

1. **Always include error handling**
2. **Provide clear output messages**
3. **Use consistent naming conventions**
4. **Include help/usage information**
5. **Log important operations**

### Testing Guidelines

1. **Test both success and failure cases**
2. **Use realistic test data**
3. **Clean up after tests**
4. **Provide clear test results**
5. **Document test scenarios**

### Maintenance

1. **Run scripts regularly**
2. **Monitor script performance**
3. **Update scripts as system evolves**
4. **Document script dependencies**
5. **Version control all scripts**

---

*Để biết thêm chi tiết về specific scripts, check source code trong respective directories.*
