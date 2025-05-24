// Quick test to create a simple user
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NTU1NjUsImV4cCI6MjA2MzEzMTU2NX0.fd7UdZk2mZsV1K0vKM8V9YWKcfyEY1fr4Q9OQvHd8UQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createQuickUser() {
  console.log('🧪 Creating quick test user...');

  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@hospital.com',
      password: 'admin123',
      options: {
        data: {
          role: 'admin',
          full_name: 'Hospital Administrator',
          phone_number: '+84123456789'
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ Admin user already exists');
        
        // Try to sign in to verify
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'admin@hospital.com',
          password: 'admin123'
        });

        if (signInError) {
          console.error('❌ Cannot sign in:', signInError.message);
        } else {
          console.log('✅ Admin can sign in successfully');
          await supabase.auth.signOut();
        }
        
        return;
      }
      console.error('❌ Error:', error.message);
      return;
    }

    console.log('✅ Admin user created:', data.user?.email);
    console.log('📋 Credentials: admin@hospital.com / admin123');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createQuickUser();
