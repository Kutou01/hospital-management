# Hospital Management System - Database Recreation Guide

## Overview
This guide explains how to use the `complete-hospital-database-recreation.sql` script to recreate your entire hospital management database from scratch on a fresh Supabase instance.

## Prerequisites
- Fresh Supabase project
- Database access with superuser privileges
- PostgreSQL 14+ (Supabase default)

## What the Script Creates

### 🏗️ Core Tables (17 tables total)
1. **profiles** - Base user profiles for all system users
2. **departments** - Hospital departments with hierarchy support
3. **doctors** - Doctor profiles with professional information
4. **patients** - Patient records with medical information
5. **appointments** - Appointment scheduling and management
6. **medical_records** - Patient medical records and history
7. **payments** - Payment processing and billing

### 👨‍⚕️ Doctor Enhancement Tables (6 tables)
8. **doctor_work_schedules** - Weekly work schedules
9. **doctor_work_experiences** - Professional work history
10. **doctor_reviews** - Patient reviews and ratings
11. **doctor_emergency_contacts** - Emergency contact information
12. **doctor_settings** - Personal preferences and settings
13. **doctor_statistics** - Daily performance metrics

### 📄 Medical Records Enhancement Tables (4 tables)
14. **medical_record_attachments** - File attachments to records
15. **lab_results** - Laboratory test results
16. **vital_signs_history** - Vital signs tracking
17. **medical_record_templates** - Reusable record templates

## How to Use

### Step 1: Execute the Script
```sql
-- Run the complete script in your Supabase SQL editor
-- The script is designed to be idempotent (safe to run multiple times)
```

### Step 2: Verify Installation
```sql
-- Check all tables were created
SELECT * FROM verify_hospital_database();

-- Check all functions were created
SELECT * FROM verify_hospital_functions();
```

### Step 3: Verify Seed Data
```sql
-- Check departments were inserted
SELECT department_id, department_name, department_code FROM departments ORDER BY department_id;

-- Check templates were inserted
SELECT template_id, template_name, specialty FROM medical_record_templates;
```

## Key Features

### 🔑 ID Generation System
- **Department-based IDs**: Doctors and appointments include department codes
- **Timestamp-based**: All IDs include YYYYMM timestamp
- **Unique sequences**: 3-digit sequence numbers prevent collisions
- **Examples**:
  - Doctor: `CARD-DOC-202506-001`
  - Patient: `PAT-202506-001`
  - Appointment: `CARD-APT-202506-001`

### 🛡️ Security Features
- **Row Level Security (RLS)** enabled on all sensitive tables
- **Role-based access control**:
  - `service_role`: Full access for backend services
  - `authenticated`: Limited access for logged-in users
  - `anon`: Read-only access to public data
- **User isolation**: Users can only access their own records

### 📊 Performance Optimization
- **Comprehensive indexing** on all foreign keys and frequently queried columns
- **Optimized queries** for common operations
- **Efficient joins** between related tables

### 🔄 Automatic Features
- **Timestamp triggers**: `updated_at` automatically updated on record changes
- **Foreign key constraints**: Data integrity enforced at database level
- **Check constraints**: Data validation for enums and ranges

## Database Schema Highlights

### User Management
- Unified `profiles` table for all user types (admin, doctor, patient, staff)
- Two-factor authentication support
- Login tracking and verification status

### Medical Workflow
- Complete patient journey from registration to medical records
- Appointment scheduling with time slot management
- Comprehensive medical record keeping with attachments

### Financial Management
- Integrated payment processing with PayOS support
- Billing views and receipt generation
- Payment statistics and reporting

### Vietnamese Hospital Context
- Department names in Vietnamese
- Vietnamese language support in templates
- Local timezone configuration (Asia/Ho_Chi_Minh)

## Maintenance

### Regular Tasks
```sql
-- Update department statistics
UPDATE departments SET updated_at = CURRENT_TIMESTAMP WHERE is_active = true;

-- Clean up old payment records (optional)
DELETE FROM payments WHERE created_at < NOW() - INTERVAL '2 years' AND status = 'failed';
```

### Backup Recommendations
```sql
-- Create regular backups of critical tables
pg_dump --table=profiles --table=doctors --table=patients your_database > backup.sql
```

## Troubleshooting

### Common Issues
1. **Permission Errors**: Ensure you're running as superuser or service_role
2. **Constraint Violations**: Check foreign key relationships in seed data
3. **RLS Blocking Queries**: Use service_role for administrative operations

### Reset Database
```sql
-- To completely reset (DANGER: This deletes all data!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then re-run the recreation script
```

## Support
For issues or questions about the database structure, refer to:
- The inline comments in the SQL script
- The verification functions for troubleshooting
- The hospital management system documentation

---
**Created**: 2025-06-29  
**Version**: 1.0  
**Compatible with**: Supabase PostgreSQL 14+
