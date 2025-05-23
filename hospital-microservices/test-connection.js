const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Testing Supabase Connection...');
console.log('================================');

// Check environment variables
console.log('📋 Environment Check:');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\n❌ Missing Supabase credentials in .env file');
    console.log('Please update .env with:');
    console.log('  SUPABASE_URL=https://ciasxktujslgsdgylimv.supabase.co');
    console.log('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    process.exit(1);
}

async function testConnection() {
    try {
        console.log('\n🔗 Connecting to Supabase...');
        
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        console.log('✅ Supabase client created');
        
        // Test users table
        console.log('\n👥 Testing users table...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('user_id, email, role, full_name')
            .limit(5);
        
        if (usersError) {
            console.log('❌ Users table error:', usersError.message);
        } else {
            console.log(`✅ Found ${users.length} users:`);
            users.forEach(user => {
                console.log(`  👤 ${user.full_name} (${user.email}) - ${user.role}`);
            });
        }
        
        // Test doctors table
        console.log('\n👨‍⚕️ Testing doctors table...');
        const { data: doctors, error: doctorsError } = await supabase
            .from('doctors')
            .select('doctor_id, full_name, specialty')
            .limit(5);
        
        if (doctorsError) {
            console.log('❌ Doctors table error:', doctorsError.message);
        } else {
            console.log(`✅ Found ${doctors.length} doctors:`);
            doctors.forEach(doctor => {
                console.log(`  👨‍⚕️ ${doctor.full_name} - ${doctor.specialty}`);
            });
        }
        
        // Test patients table
        console.log('\n🏥 Testing patients table...');
        const { count: patientCount, error: patientsError } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true });
        
        if (patientsError) {
            console.log('❌ Patients table error:', patientsError.message);
        } else {
            console.log(`✅ Found ${patientCount} patients`);
        }
        
        // Test appointments table
        console.log('\n📅 Testing appointments table...');
        const { count: appointmentCount, error: appointmentsError } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true });
        
        if (appointmentsError) {
            console.log('❌ Appointments table error:', appointmentsError.message);
        } else {
            console.log(`✅ Found ${appointmentCount} appointments`);
        }
        
        console.log('\n🎉 Connection test completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`  • Users: ${users ? users.length : 'Error'}`);
        console.log(`  • Doctors: ${doctors ? doctors.length : 'Error'}`);
        console.log(`  • Patients: ${patientCount || 'Error'}`);
        console.log(`  • Appointments: ${appointmentCount || 'Error'}`);
        
        console.log('\n🚀 Ready for microservices setup!');
        
    } catch (error) {
        console.log('\n❌ Connection test failed:', error.message);
        
        if (error.message.includes('Invalid API key')) {
            console.log('\n🔑 Please check your SUPABASE_SERVICE_ROLE_KEY');
            console.log('   Get it from: https://supabase.com/dashboard/project/ciasxktujslgsdgylimv/settings/api');
        }
        
        process.exit(1);
    }
}

testConnection();
