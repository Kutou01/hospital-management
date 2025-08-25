const { chromium } = require('@playwright/test');
const { createClient } = require('@supabase/supabase-js');

/**
 * Global setup for admin tests
 * - Initialize test database
 * - Create test admin users
 * - Setup test data
 */
async function globalSetup(config) {
  console.log('🚀 Starting Global Setup for Admin Tests...');

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
  );

  try {
    // Create test admin users
    await createTestAdminUsers(supabase);
    
    // Setup test data
    await setupTestData(supabase);
    
    // Verify services are running
    await verifyServices();
    
    console.log('✅ Global Setup completed successfully');
  } catch (error) {
    console.error('❌ Global Setup failed:', error);
    throw error;
  }
}

async function createTestAdminUsers(supabase) {
  console.log('👤 Creating test admin users...');
  
  const testAdmins = [
    {
      email: 'admin.test@hospital.com',
      password: 'AdminTest123!@#',
      full_name: 'Test Admin User',
      role: 'admin'
    },
    {
      email: 'superadmin.test@hospital.com', 
      password: 'SuperAdminTest123!@#',
      full_name: 'Test Super Admin User',
      role: 'superadmin'
    }
  ];

  for (const admin of testAdmins) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(admin.email);
      
      if (!existingUser.user) {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: admin.email,
          password: admin.password,
          email_confirm: true,
          user_metadata: { role: admin.role },
          app_metadata: { role: admin.role }
        });

        if (authError) throw authError;

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: admin.email,
            full_name: admin.full_name,
            role: admin.role,
            is_active: true,
            email_verified: true,
            onboarding_completed: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) throw profileError;
        
        console.log(`✅ Created test admin: ${admin.email}`);
      } else {
        console.log(`ℹ️  Test admin already exists: ${admin.email}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create admin ${admin.email}:`, error);
    }
  }
}

async function setupTestData(supabase) {
  console.log('📊 Setting up test data...');
  
  try {
    // Create test departments
    const departments = [
      { name: 'Khoa Tim Mạch', description: 'Chuyên khoa tim mạch', status: 'active' },
      { name: 'Khoa Nhi', description: 'Chuyên khoa nhi', status: 'active' },
      { name: 'Khoa Phẫu Thuật', description: 'Chuyên khoa phẫu thuật', status: 'active' }
    ];

    for (const dept of departments) {
      const { error } = await supabase
        .from('departments')
        .upsert(dept, { onConflict: 'name' });
      
      if (error && !error.message.includes('duplicate')) {
        console.error('Error creating department:', error);
      }
    }

    // Create test rooms
    const rooms = [
      { room_number: 'TEST-001', room_type: 'patient_room', status: 'available', department_id: 1 },
      { room_number: 'TEST-002', room_type: 'operating_room', status: 'occupied', department_id: 3 },
      { room_number: 'TEST-003', room_type: 'consultation_room', status: 'maintenance', department_id: 2 }
    ];

    for (const room of rooms) {
      const { error } = await supabase
        .from('rooms')
        .upsert(room, { onConflict: 'room_number' });
      
      if (error && !error.message.includes('duplicate')) {
        console.error('Error creating room:', error);
      }
    }

    console.log('✅ Test data setup completed');
  } catch (error) {
    console.error('❌ Failed to setup test data:', error);
  }
}

async function verifyServices() {
  console.log('🔍 Verifying services are running...');
  
  const services = [
    { name: 'Frontend', url: 'http://localhost:3000' },
    { name: 'API Gateway', url: 'http://localhost:3100' },
    { name: 'Auth Service', url: 'http://localhost:3001' }
  ];

  for (const service of services) {
    try {
      const response = await fetch(`${service.url}/health`);
      if (response.ok) {
        console.log(`✅ ${service.name} is running`);
      } else {
        console.log(`⚠️  ${service.name} returned status ${response.status}`);
      }
    } catch (error) {
      console.log(`⚠️  ${service.name} is not responding`);
    }
  }
}

module.exports = globalSetup;
