-- Fix infinite recursion in admin policies
-- This script removes the problematic policies and creates new ones

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Super admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Admins can view own data" ON admins;

-- Recreate policies without recursion
CREATE POLICY "Admins can view own data" ON admins
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Admins can update own data" ON admins
  FOR UPDATE USING (profile_id = auth.uid());

-- Allow INSERT for admin creation (no recursion check)
CREATE POLICY "Allow admin creation" ON admins
  FOR INSERT WITH CHECK (true);

-- Allow super admins to view all admins (check profiles table directly to avoid recursion)
CREATE POLICY "Super admins can view all admins" ON admins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Allow super admins to manage all admins
CREATE POLICY "Super admins can manage all admins" ON admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

SELECT 'Admin policies fixed successfully!' as status;
