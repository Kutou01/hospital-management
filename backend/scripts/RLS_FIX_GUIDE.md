# RLS Policies Fix Guide

## Problem Analysis

The error you're seeing:
```
Error creating patient profile:
{ code: '42501', details: null, hint: null, message: 'new row violates row-level security policy for table "patients"' }
```

**Root Cause**: The `patients` table has Row Level Security (RLS) enabled but **no policies defined**. When RLS is enabled without policies, it blocks all access by default.

## Solution Steps

### Step 1: Apply RLS Policies (REQUIRED)

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `simple-rls-fix.sql`
4. Run the SQL script

### Step 2: Verify the Fix

After running the SQL, verify that policies were created:

```sql
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('patients', 'doctors', 'admins')
ORDER BY tablename, policyname;
```

You should see policies like:
- `Enable insert for all users` for each table
- `Users can view own patient record`
- `Public can view active doctors`

### Step 3: Test Patient Registration

Try registering a new patient through your frontend. The registration should now work without the RLS error.

## What the Fix Does

1. **Creates INSERT policies** that allow authenticated and anonymous users to insert records
2. **Creates SELECT policies** that allow users to view their own records
3. **Creates UPDATE policies** that allow users to update their own records
4. **Grants table permissions** to authenticated and anonymous users
5. **Ensures RLS is enabled** on all role tables

## Security Considerations

The current fix uses permissive policies for INSERT operations to resolve the immediate registration issue. For production, you may want to:

1. **Restrict INSERT policies** to only authenticated users
2. **Add role-based policies** for admins to manage all records
3. **Add specific policies** for doctors to view patient records for appointments

## Alternative Approach (If RLS is not needed)

If you don't need RLS for your current use case, you can disable it:

```sql
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
```

**Note**: This removes all access restrictions, so only use this for development/testing.

## Troubleshooting

If the fix doesn't work:

1. **Check if policies exist**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'patients';
   ```

2. **Check RLS status**:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE tablename IN ('patients', 'doctors', 'admins');
   ```

3. **Check permissions**:
   ```sql
   SELECT grantee, privilege_type FROM information_schema.table_privileges 
   WHERE table_name = 'patients';
   ```

## Next Steps

After fixing the RLS issue:

1. Test patient registration thoroughly
2. Test doctor registration
3. Test admin registration
4. Consider implementing more granular RLS policies for production
5. Update your authentication flow to handle RLS properly
