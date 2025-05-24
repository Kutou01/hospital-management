require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testDatabaseConnection() {
  console.log('=== Database Connection Debug ===');
  
  // Check environment variables
  console.log('Environment variables:');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  
  // Test Supabase connection
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && supabaseServiceKey) {
    console.log('\n=== Testing Supabase Connection ===');
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      console.log('Supabase client created successfully');
      
      // Test the connection
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      console.log('Supabase test result:');
      console.log('Data:', data);
      console.log('Error:', error);
      
      if (error && error.code !== 'PGRST116') {
        console.log('❌ Supabase connection test failed');
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        return false;
      } else {
        console.log('✅ Supabase connection successful');
        return true;
      }
    } catch (err) {
      console.log('❌ Supabase connection error:', err.message);
      return false;
    }
  } else {
    console.log('❌ Supabase credentials not available');
    return false;
  }
}

testDatabaseConnection().then(success => {
  console.log('\n=== Final Result ===');
  console.log('Supabase available:', success);
  process.exit(0);
}).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
