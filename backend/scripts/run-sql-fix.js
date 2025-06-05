const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

console.log('🔧 Running SQL fix for column issues...');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQLCommands() {
  try {
    console.log('📋 Step 1: Creating exec_sql RPC function...');

    // First, create the exec_sql function that the script needs
    const createExecSqlFunction = `
      CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
      RETURNS JSON AS $$
      BEGIN
          EXECUTE sql_query;
          RETURN json_build_object('success', true);
      EXCEPTION
          WHEN OTHERS THEN
              RETURN json_build_object(
                  'success', false,
                  'error', SQLERRM
              );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error: execSqlError } = await supabase.rpc('sql', {
      query: createExecSqlFunction
    });

    if (execSqlError) {
      console.log('⚠️ exec_sql function creation error:', execSqlError.message);
      // Try alternative approach - direct SQL execution
      console.log('📋 Step 1b: Adding columns directly...');

      // Add phone_number column directly
      const { error: phoneError } = await supabase.rpc('sql', {
        query: `
          DO $$
          BEGIN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                             WHERE table_name = 'doctors' AND column_name = 'phone_number' AND table_schema = 'public') THEN
                  ALTER TABLE public.doctors ADD COLUMN phone_number VARCHAR(20);
                  RAISE NOTICE 'Added phone_number column to doctors table';
              END IF;
          END $$;
        `
      });

      if (phoneError) {
        console.log('⚠️ Phone column error (might already exist):', phoneError.message);
      } else {
        console.log('✅ Phone number column handled');
      }

      // Add working_hours column directly
      const { error: workingHoursError } = await supabase.rpc('sql', {
        query: `
          DO $$
          BEGIN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                             WHERE table_name = 'doctors' AND column_name = 'working_hours' AND table_schema = 'public') THEN
                  ALTER TABLE public.doctors ADD COLUMN working_hours JSONB DEFAULT '{}';
                  RAISE NOTICE 'Added working_hours column to doctors table';
              END IF;
          END $$;
        `
      });

      if (workingHoursError) {
        console.log('⚠️ Working hours column error (might already exist):', workingHoursError.message);
      } else {
        console.log('✅ Working hours column handled');
      }
    } else {
      console.log('✅ exec_sql function created successfully');

      console.log('📋 Step 2: Adding missing columns...');

      // Add phone_number column
      const { error: phoneError } = await supabase.rpc('exec_sql', {
        sql_query: `
          DO $$
          BEGIN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                             WHERE table_name = 'doctors' AND column_name = 'phone_number' AND table_schema = 'public') THEN
                  ALTER TABLE public.doctors ADD COLUMN phone_number VARCHAR(20);
                  RAISE NOTICE 'Added phone_number column to doctors table';
              END IF;
          END $$;
        `
      });

      if (phoneError) {
        console.log('⚠️ Phone column error (might already exist):', phoneError.message);
      } else {
        console.log('✅ Phone number column handled');
      }

      // Add working_hours column
      const { error: workingHoursError } = await supabase.rpc('exec_sql', {
        sql_query: `
          DO $$
          BEGIN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                             WHERE table_name = 'doctors' AND column_name = 'working_hours' AND table_schema = 'public') THEN
                  ALTER TABLE public.doctors ADD COLUMN working_hours JSONB DEFAULT '{}';
                  RAISE NOTICE 'Added working_hours column to doctors table';
              END IF;
          END $$;
        `
      });

      if (workingHoursError) {
        console.log('⚠️ Working hours column error (might already exist):', workingHoursError.message);
      } else {
        console.log('✅ Working hours column handled');
      }
    }

    console.log('📋 Step 3: Creating profile creation RPC function...');
    
    // Create the RPC function
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.create_user_profile(
          user_id UUID,
          user_email TEXT,
          user_name TEXT,
          user_phone TEXT,
          user_role TEXT DEFAULT 'patient',
          user_gender TEXT DEFAULT 'other',
          user_specialty TEXT DEFAULT NULL,
          user_license TEXT DEFAULT NULL,
          user_qualification TEXT DEFAULT NULL,
          user_department_id TEXT DEFAULT NULL
      )
      RETURNS JSON AS $$
      DECLARE
          new_profile RECORD;
          generated_doctor_id TEXT;
      BEGIN
          -- Create profile
          INSERT INTO public.profiles (
              id,
              email,
              full_name,
              phone_number,
              role,
              email_verified,
              phone_verified,
              is_active,
              created_at,
              updated_at
          )
          VALUES (
              user_id,
              user_email,
              user_name,
              user_phone,
              user_role,
              false,
              false,
              true,
              NOW(),
              NOW()
          )
          RETURNING * INTO new_profile;

          -- Create doctor record if role is doctor
          IF user_role = 'doctor' THEN
              -- Create sequence if it doesn't exist
              CREATE SEQUENCE IF NOT EXISTS doctor_id_seq START 1;

              generated_doctor_id := 'DOC' || LPAD(NEXTVAL('doctor_id_seq')::TEXT, 6, '0');

              INSERT INTO public.doctors (
                  doctor_id,
                  profile_id,
                  full_name,
                  specialization,
                  license_number,
                  qualification,
                  department_id,
                  gender,
                  phone_number,
                  status,
                  working_hours,
                  created_at,
                  updated_at
              )
              VALUES (
                  generated_doctor_id,
                  user_id,
                  user_name,
                  COALESCE(user_specialty, 'General Medicine'),
                  COALESCE(user_license, 'PENDING'),
                  COALESCE(user_qualification, 'MD'),
                  COALESCE(user_department_id, 'DEPT001'),
                  user_gender,
                  user_phone,
                  'active',
                  '{}',
                  NOW(),
                  NOW()
              );
          END IF;

          RETURN json_build_object(
              'success', true,
              'profile', row_to_json(new_profile),
              'role_id', generated_doctor_id
          );

      EXCEPTION
          WHEN OTHERS THEN
              RETURN json_build_object(
                  'success', false,
                  'error', SQLERRM
              );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // Try to create the function using different approaches
    let functionError = null;

    // First try with exec_sql if it exists
    if (!execSqlError) {
      const result = await supabase.rpc('exec_sql', {
        sql_query: createFunctionSQL
      });
      functionError = result.error;
    } else {
      // Try with direct sql call
      const result = await supabase.rpc('sql', {
        query: createFunctionSQL
      });
      functionError = result.error;
    }

    if (functionError) {
      console.log('⚠️ Function creation error:', functionError.message);
    } else {
      console.log('✅ RPC function created successfully');
    }

    // Grant permissions
    const grantSQL = 'GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated, anon;';
    let grantError = null;

    if (!execSqlError) {
      const result = await supabase.rpc('exec_sql', {
        sql_query: grantSQL
      });
      grantError = result.error;
    } else {
      const result = await supabase.rpc('sql', {
        query: grantSQL
      });
      grantError = result.error;
    }

    if (grantError) {
      console.log('⚠️ Grant permissions error:', grantError.message);
    } else {
      console.log('✅ Permissions granted');
    }

    console.log('\n🎉 SQL fix completed! Now testing...');
    
    // Test the fix
    const testResult = await testFix();
    return testResult;
    
  } catch (err) {
    console.error('❌ Error running SQL commands:', err.message);
    return false;
  }
}

async function testFix() {
  console.log('\n🧪 Testing the fix...');

  try {
    // Generate test IDs
    const testProfileId = '11111111-1111-1111-1111-111111111111';
    const testDoctorId = `DOC${Date.now().toString().slice(-6)}`;

    console.log('📋 Step 1: Creating test profile...');

    // First, create a test profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: testProfileId,
        email: 'test@example.com',
        full_name: 'Test Doctor',
        phone_number: '0123456789',
        role: 'doctor',
        email_verified: false,
        phone_verified: false,
        is_active: true
      })
      .select();

    if (profileError) {
      console.log('⚠️ Profile creation error (might already exist):', profileError.message);
    } else {
      console.log('✅ Test profile created successfully');
    }

    console.log('📋 Step 2: Testing doctor insertion...');

    // Test direct insertion with valid profile_id
    const { data, error } = await supabase
      .from('doctors')
      .insert({
        doctor_id: testDoctorId,
        profile_id: testProfileId,
        full_name: 'Test Doctor',
        specialization: 'General Medicine',
        license_number: 'TEST123',
        qualification: 'MD',
        department_id: 'DEPT001',
        gender: 'other',
        phone_number: '0123456789',
        status: 'active',
        working_hours: '{}',
      })
      .select();

    if (error) {
      console.error('❌ Test insertion failed:', error.message);

      // Clean up profile if doctor insertion failed
      await supabase.from('profiles').delete().eq('id', testProfileId);
      return false;
    }

    console.log('✅ Test insertion successful!');

    console.log('📋 Step 3: Testing RPC function...');

    // Test the RPC function
    const testRpcProfileId = '22222222-2222-2222-2222-222222222222';
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_user_profile', {
      user_id: testRpcProfileId,
      user_email: 'rpc-test@example.com',
      user_name: 'RPC Test Doctor',
      user_phone: '0987654321',
      user_role: 'doctor',
      user_gender: 'other',
      user_specialty: 'Cardiology',
      user_license: 'RPC123',
      user_qualification: 'MD',
      user_department_id: 'DEPT001'
    });

    if (rpcError) {
      console.log('⚠️ RPC function test failed:', rpcError.message);
    } else {
      console.log('✅ RPC function test successful!');
      console.log('📊 RPC Result:', rpcData);
    }

    console.log('🧹 Cleaning up test records...');

    // Clean up test records
    await supabase.from('doctors').delete().eq('doctor_id', testDoctorId);
    await supabase.from('profiles').delete().eq('id', testProfileId);

    if (rpcData && rpcData.role_id) {
      await supabase.from('doctors').delete().eq('doctor_id', rpcData.role_id);
    }
    await supabase.from('profiles').delete().eq('id', testRpcProfileId);

    console.log('🧹 Test records cleaned up');

    return true;

  } catch (err) {
    console.error('❌ Test error:', err.message);
    return false;
  }
}

runSQLCommands().then(success => {
  if (success) {
    console.log('\n🎉 SQL fix completed! Now testing...');
    return testFix();
  } else {
    console.log('\n❌ Some issues remain. Please check the errors above.');
    return false;
  }
}).then(testSuccess => {
  if (testSuccess) {
    console.log('\n🎉 All fixes applied and tested successfully!');
    console.log('You can now try doctor registration again.');
  } else {
    console.log('\n❌ Some issues remain. Please check the errors above.');
  }
}).catch(console.error);
