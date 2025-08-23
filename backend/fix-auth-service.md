# Fix Auth Service - Supabase RLS Issue

## Problem
Auth Service crashes với error: "infinite recursion detected in policy for relation profiles"

## Root Cause
RLS policies trong Supabase có circular dependency giữa các tables.

## Solutions

### Option 1: Disable RLS Temporarily (Quick Fix)
```sql
-- Run in Supabase SQL Editor
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### Option 2: Fix RLS Policies (Proper Fix)
```sql
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Enable read access for users" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### Option 3: Use Service Role Key (Bypass RLS)
Modify Auth Service to use service role key instead of anon key for internal operations.

```javascript
// In auth-service/src/config/supabase.ts
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

## Immediate Action Required
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Run Option 1 or Option 2 SQL commands
4. Restart Auth Service

## Test After Fix
```bash
docker restart backend-auth-service-1
docker logs backend-auth-service-1 --tail 20
```
