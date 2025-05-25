const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Use anon key like the frontend does
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

async function debugRegistration() {
  console.log('🐛 Debugging Registration Flow...\n');

  const testEmail = `debug-reg-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    console.log('1️⃣ Starting registration with auth.signUp...');
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Debug Test User',
          role: 'patient',
          phone_number: '+84123456789'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      return;
    }

    console.log('✅ Auth user created:', {
      id: authData.user?.id,
      email: authData.user?.email,
      session: !!authData.session,
      metadata: authData.user?.user_metadata
    });

    // Check current session
    console.log('\n2️⃣ Checking current session...');
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Session status:', {
      hasSession: !!sessionData.session,
      userId: sessionData.session?.user?.id,
      accessToken: sessionData.session?.access_token ? 'present' : 'missing'
    });

    // Wait for trigger
    console.log('\n3️⃣ Waiting for trigger to create profile...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try to query profile immediately after registration
    console.log('\n4️⃣ Attempting to query profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile query failed:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      });

      // Try with service role to see if profile exists
      console.log('\n5️⃣ Checking if profile exists with service role...');
      const serviceSupabase = createClient(
        supabaseUrl, 
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { data: serviceProfile, error: serviceError } = await serviceSupabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (serviceError) {
        console.error('❌ Profile not found even with service role:', serviceError);
      } else {
        console.log('✅ Profile exists in database:', {
          id: serviceProfile.id,
          email: serviceProfile.email,
          full_name: serviceProfile.full_name,
          role: serviceProfile.role
        });
        console.log('🔍 Issue is likely with RLS policies or session state');
      }
    } else {
      console.log('✅ Profile query successful:', {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role
      });
    }

    // Try signing in to get proper session
    console.log('\n6️⃣ Trying to sign in to get proper session...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError);
    } else {
      console.log('✅ Sign in successful');
      
      // Try profile query again after sign in
      console.log('\n7️⃣ Querying profile after sign in...');
      const { data: profileAfterSignIn, error: profileAfterSignInError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileAfterSignInError) {
        console.error('❌ Profile query still failed after sign in:', profileAfterSignInError);
      } else {
        console.log('✅ Profile query successful after sign in:', {
          id: profileAfterSignIn.id,
          email: profileAfterSignIn.email,
          full_name: profileAfterSignIn.full_name,
          role: profileAfterSignIn.role
        });
      }
    }

    // Sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugRegistration().then(() => {
  console.log('\n✅ Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug error:', error);
  process.exit(1);
});
