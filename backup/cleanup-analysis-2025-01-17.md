# Cleanup Analysis - Hospital Management System
Date: 2025-01-17

## Current Structure Issues

### Duplicate Structures
1. **app/ directory at root** - Legacy Next.js structure
   - Contains: (auth), api routes
   - Status: LEGACY - should be removed
   - Reason: Conflicts with frontend/app/ structure

2. **middleware.ts at root** - Next.js middleware
   - Contains: Authentication, role-based access control
   - Status: ACTIVE but misplaced
   - Should be: frontend/middleware.ts

3. **lib/ at root** - Shared libraries
   - Contains: auth, security, supabase, validations
   - Status: ACTIVE but misplaced  
   - Should be: frontend/lib/

### Current Working Structure
- **backend/services/** - 11 microservices (WORKING)
- **frontend/app/** - Next.js App Router (WORKING)
- **frontend/lib/** - Already exists, may need merge

### Files to Backup Before Cleanup
- middleware.ts (root)
- lib/ directory (root)
- app/ directory (root) - for reference

### Dependencies Analysis
- Root package.json: Basic dependencies for testing
- Frontend package.json: Complete Next.js dependencies
- Backend services: Individual package.json files

## Cleanup Plan
1. Backup important files
2. Remove duplicate structures
3. Move misplaced files to correct locations
4. Update import paths
5. Test all services
