/**
 * Script to clean up incomplete user registrations
 * This script identifies and removes users who exist in Supabase Auth
 * but don't have complete profile data in the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function findIncompleteUsers() {
  console.log('🔍 Searching for incomplete user registrations...');
  
  try {
    // Get all users from auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw authError;
    }

    console.log(`📊 Found ${authUsers.users.length} users in auth`);

    const incompleteUsers = [];

    for (const authUser of authUsers.users) {
      const userId = authUser.id;
      
      // Check if user has profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.log(`⚠️ User ${userId} (${authUser.email}) has no profile`);
        incompleteUsers.push({
          authUser,
          reason: 'No profile'
        });
        continue;
      }

      // Check role-specific data
      if (profile.role === 'doctor') {
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('*')
          .eq('profile_id', userId)
          .single();

        if (doctorError || !doctorData) {
          console.log(`⚠️ Doctor ${userId} (${authUser.email}) has no doctor profile`);
          incompleteUsers.push({
            authUser,
            profile,
            reason: 'No doctor profile'
          });
        }
      } else if (profile.role === 'patient') {
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('profile_id', userId)
          .single();

        if (patientError || !patientData) {
          console.log(`⚠️ Patient ${userId} (${authUser.email}) has no patient profile`);
          incompleteUsers.push({
            authUser,
            profile,
            reason: 'No patient profile'
          });
        }
      } else if (profile.role === 'admin') {
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('profile_id', userId)
          .single();

        if (adminError || !adminData) {
          console.log(`⚠️ Admin ${userId} (${authUser.email}) has no admin profile`);
          incompleteUsers.push({
            authUser,
            profile,
            reason: 'No admin profile'
          });
        }
      }
    }

    return incompleteUsers;
  } catch (error) {
    console.error('❌ Error finding incomplete users:', error);
    throw error;
  }
}

async function cleanupIncompleteUser(incompleteUser) {
  const { authUser, profile, reason } = incompleteUser;
  const userId = authUser.id;
  
  console.log(`🧹 Cleaning up user ${userId} (${authUser.email}) - ${reason}`);

  try {
    // Delete profile if it exists
    if (profile) {
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileDeleteError) {
        console.error(`❌ Failed to delete profile for ${userId}:`, profileDeleteError);
      } else {
        console.log(`✅ Deleted profile for ${userId}`);
      }
    }

    // Delete auth user (requires service role key)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error(`❌ Failed to delete auth user ${userId}:`, authDeleteError);
      return false;
    } else {
      console.log(`✅ Deleted auth user ${userId}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error cleaning up user ${userId}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting cleanup of incomplete user registrations...');
  
  try {
    const incompleteUsers = await findIncompleteUsers();
    
    if (incompleteUsers.length === 0) {
      console.log('✅ No incomplete users found. All registrations are complete!');
      return;
    }

    console.log(`\n📋 Found ${incompleteUsers.length} incomplete user(s):`);
    incompleteUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.authUser.email} - ${user.reason}`);
    });

    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question('\n❓ Do you want to delete these incomplete users? (y/N): ', resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Cleanup cancelled by user');
      return;
    }

    console.log('\n🧹 Starting cleanup...');
    let successCount = 0;
    let failCount = 0;

    for (const incompleteUser of incompleteUsers) {
      const success = await cleanupIncompleteUser(incompleteUser);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log(`\n📊 Cleanup completed:`);
    console.log(`✅ Successfully cleaned up: ${successCount} users`);
    console.log(`❌ Failed to clean up: ${failCount} users`);

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().then(() => {
    console.log('🏁 Script completed');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Script crashed:', error);
    process.exit(1);
  });
}

module.exports = {
  findIncompleteUsers,
  cleanupIncompleteUser
};
