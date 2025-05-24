// Create admin user for testing
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU1NTU2NSwiZXhwIjoyMDYzMTMxNTY1fQ.R2IieQgCFPQ5sgEqPSJmF9uB1hZasJHg5enl2alJpn4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  console.log('🔧 Creating admin user...');

  try {
    // Create admin user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@hospital.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        full_name: 'Hospital Administrator',
        phone_number: '+84123456789'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('✅ Admin user already exists');
        return;
      }
      console.error('❌ Error creating admin user:', authError.message);
      return;
    }

    console.log('✅ Admin user created:', authData.user.email);

    // Wait for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if custom user was created
    const { data: customUser, error: customUserError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (customUserError) {
      console.error('❌ Error fetching custom user:', customUserError.message);
      return;
    }

    console.log('✅ Custom admin user created:', customUser.user_id);
    console.log('📋 Admin credentials:');
    console.log('Email: admin@hospital.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createAdmin();
