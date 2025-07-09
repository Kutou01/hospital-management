#!/usr/bin/env node

/**
 * Security Setup Script
 * Hospital Management System
 * 
 * This script helps developers set up secure environment variables
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class SecuritySetup {
  constructor() {
    this.envPath = path.join(__dirname, '../.env');
    this.envExamplePath = path.join(__dirname, '../.env.example');
    this.frontendEnvPath = path.join(__dirname, '../../frontend/.env.local');
    this.frontendEnvExamplePath = path.join(__dirname, '../../frontend/.env.example');
  }

  async run() {
    console.log('🔒 Hospital Management System - Security Setup');
    console.log('='.repeat(50));
    
    try {
      // Check if .env files already exist
      await this.checkExistingFiles();
      
      // Generate secure keys
      const keys = this.generateSecureKeys();
      
      // Get user input for Supabase configuration
      const supabaseConfig = await this.getSupabaseConfig();
      
      // Create backend .env file
      await this.createBackendEnv(keys, supabaseConfig);
      
      // Create frontend .env.local file
      await this.createFrontendEnv(supabaseConfig);
      
      // Create docker-compose.override.yml
      await this.createDockerOverride(keys, supabaseConfig);
      
      // Show security recommendations
      this.showSecurityRecommendations();
      
      console.log('\n✅ Security setup completed successfully!');
      console.log('📝 Please review the generated files and update any placeholder values.');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    } finally {
      rl.close();
    }
  }

  async checkExistingFiles() {
    const files = [
      { path: this.envPath, name: 'backend/.env' },
      { path: this.frontendEnvPath, name: 'frontend/.env.local' }
    ];

    for (const file of files) {
      if (fs.existsSync(file.path)) {
        const overwrite = await this.askQuestion(
          `⚠️  ${file.name} already exists. Overwrite? (y/N): `
        );
        
        if (overwrite.toLowerCase() !== 'y') {
          console.log('Setup cancelled.');
          process.exit(0);
        }
        
        // Backup existing file
        const backupPath = `${file.path}.backup.${Date.now()}`;
        fs.copyFileSync(file.path, backupPath);
        console.log(`📋 Backed up existing file to ${backupPath}`);
      }
    }
  }

  generateSecureKeys() {
    console.log('\n🔑 Generating secure keys...');
    
    const keys = {
      jwtSecret: crypto.randomBytes(64).toString('hex'),
      sessionSecret: crypto.randomBytes(32).toString('hex'),
      redisPassword: crypto.randomBytes(16).toString('hex'),
      rabbitmqPassword: crypto.randomBytes(16).toString('hex')
    };

    console.log('✅ Secure keys generated');
    return keys;
  }

  async getSupabaseConfig() {
    console.log('\n🗄️  Supabase Configuration');
    console.log('Please provide your Supabase project details:');
    
    const supabaseUrl = await this.askQuestion('Supabase URL: ');
    const supabaseAnonKey = await this.askQuestion('Supabase Anon Key: ');
    const supabaseServiceKey = await this.askQuestion('Supabase Service Role Key: ');
    const supabaseJwtSecret = await this.askQuestion('Supabase JWT Secret (optional): ');

    // Validate inputs
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Supabase URL, Anon Key, and Service Role Key are required');
    }

    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      console.log('⚠️  Warning: Supabase URL format looks incorrect');
    }

    return {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceKey: supabaseServiceKey,
      jwtSecret: supabaseJwtSecret || ''
    };
  }

  async createBackendEnv(keys, supabaseConfig) {
    console.log('\n📝 Creating backend/.env file...');
    
    // Read template
    const template = fs.readFileSync(this.envExamplePath, 'utf8');
    
    // Replace placeholders
    let envContent = template
      .replace('your_supabase_project_url', supabaseConfig.url)
      .replace('your_supabase_service_role_key', supabaseConfig.serviceKey)
      .replace('your_supabase_anon_key', supabaseConfig.anonKey)
      .replace('your_super_secret_jwt_key_here_make_it_long_and_random', keys.jwtSecret)
      .replace('your_session_secret_key', keys.sessionSecret);

    // Add generated passwords
    envContent += `\n# Generated secure passwords\n`;
    envContent += `REDIS_PASSWORD=${keys.redisPassword}\n`;
    envContent += `RABBITMQ_PASSWORD=${keys.rabbitmqPassword}\n`;

    if (supabaseConfig.jwtSecret) {
      envContent += `SUPABASE_JWT_SECRET=${supabaseConfig.jwtSecret}\n`;
    }

    fs.writeFileSync(this.envPath, envContent);
    console.log('✅ Backend .env file created');
  }

  async createFrontendEnv(supabaseConfig) {
    console.log('📝 Creating frontend/.env.local file...');
    
    // Read template
    const template = fs.readFileSync(this.frontendEnvExamplePath, 'utf8');
    
    // Replace placeholders
    const envContent = template
      .replace('https://your-project-id.supabase.co', supabaseConfig.url)
      .replace('your_anon_key_here', supabaseConfig.anonKey);

    fs.writeFileSync(this.frontendEnvPath, envContent);
    console.log('✅ Frontend .env.local file created');
  }

  async createDockerOverride(keys, supabaseConfig) {
    const overridePath = path.join(__dirname, '../docker-compose.override.yml');
    const examplePath = path.join(__dirname, '../docker-compose.override.yml.example');
    
    if (fs.existsSync(overridePath)) {
      const overwrite = await this.askQuestion(
        '⚠️  docker-compose.override.yml already exists. Overwrite? (y/N): '
      );
      
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Skipping docker-compose.override.yml creation');
        return;
      }
    }

    console.log('📝 Creating docker-compose.override.yml file...');
    
    // Read template
    const template = fs.readFileSync(examplePath, 'utf8');
    
    // Replace placeholders
    const overrideContent = template
      .replace(/https:\/\/your-project-id\.supabase\.co/g, supabaseConfig.url)
      .replace(/your_actual_service_role_key_here/g, supabaseConfig.serviceKey)
      .replace(/your_actual_anon_key_here/g, supabaseConfig.anonKey)
      .replace(/your_actual_jwt_secret_here/g, supabaseConfig.jwtSecret || keys.jwtSecret)
      .replace(/your_actual_custom_jwt_secret_here/g, keys.jwtSecret)
      .replace(/your_redis_password/g, keys.redisPassword)
      .replace(/your_secure_admin_password/g, keys.rabbitmqPassword);

    fs.writeFileSync(overridePath, overrideContent);
    console.log('✅ Docker override file created');
  }

  showSecurityRecommendations() {
    console.log('\n🛡️  Security Recommendations:');
    console.log('='.repeat(40));
    console.log('1. 🔄 Rotate keys every 3-6 months');
    console.log('2. 🚫 Never commit .env files to git');
    console.log('3. 🔒 Use different keys for production');
    console.log('4. 📊 Monitor security events regularly');
    console.log('5. 🔍 Audit access logs periodically');
    console.log('6. 💾 Backup your .env files securely');
    console.log('7. 🌐 Use HTTPS in production');
    console.log('8. 🔐 Enable 2FA on all accounts');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Review generated .env files');
    console.log('2. Update any placeholder values');
    console.log('3. Test your services: npm run dev');
    console.log('4. Set up monitoring and alerts');
  }

  askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Run the setup
if (require.main === module) {
  const setup = new SecuritySetup();
  setup.run().catch(console.error);
}

module.exports = SecuritySetup;
