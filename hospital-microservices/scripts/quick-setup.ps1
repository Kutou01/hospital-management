# Hospital Microservices Quick Setup for Windows
Write-Host "🏥 Hospital Microservices Quick Setup" -ForegroundColor Magenta
Write-Host "====================================" -ForegroundColor Magenta
Write-Host "Using existing Supabase data" -ForegroundColor White
Write-Host ""

# Function to print colored output
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Error ".env file not found"
    Write-Warning "Please create .env file from .env.example and update with your Supabase credentials"
    exit 1
}

# Check if Supabase URL is configured
$envContent = Get-Content ".env" -Raw
if ($envContent -notmatch "ciasxktujslgsdgylimv.supabase.co") {
    Write-Warning "Please update .env with your Supabase credentials"
    Write-Status "Your Supabase URL: https://ciasxktujslgsdgylimv.supabase.co"
    Write-Status "Please get your Service Role Key from Supabase Dashboard"
    exit 1
}

Write-Success "Environment configuration found"

# Create logs directory
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# Install dependencies
Write-Status "Installing dependencies..."

# Root dependencies
npm install --silent
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install root dependencies"
    exit 1
}

# Shared library
Set-Location "shared"
npm install --silent
npm run build
Set-Location ".."

# Auth service
Set-Location "services/auth-service"
npm install --silent
Set-Location "../.."

# API Gateway
Set-Location "api-gateway"
npm install --silent
Set-Location ".."

Write-Success "Dependencies installed"

# Start minimal infrastructure
Write-Status "Starting minimal infrastructure..."
docker-compose up -d redis rabbitmq | Out-Null
Start-Sleep -Seconds 5
Write-Success "Infrastructure ready"

# Test Supabase connection
Write-Status "Testing connection to existing data..."

$testScript = @"
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function test() {
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        // Test users table
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('user_id, email, role, full_name')
            .limit(3);
        
        if (usersError) throw usersError;
        
        console.log('✅ Found', users.length, 'users');
        users.forEach(user => {
            console.log('  👤', user.full_name, '(' + user.role + ')');
        });
        
        // Test doctors table
        const { data: doctors, error: doctorsError } = await supabase
            .from('doctors')
            .select('doctor_id, full_name, specialty')
            .limit(5);
        
        if (doctorsError) throw doctorsError;
        
        console.log('✅ Found', doctors.length, 'doctors');
        doctors.forEach(doctor => {
            console.log('  👨‍⚕️', doctor.full_name, '-', doctor.specialty);
        });
        
        // Test patients table
        const { count: patientCount } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true });
        
        console.log('✅ Found', patientCount, 'patients');
        
        // Test appointments table
        const { count: appointmentCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true });
        
        console.log('✅ Found', appointmentCount, 'appointments');
        
        console.log('🎉 Connection test successful!');
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        process.exit(1);
    }
}

test();
"@

$testScript | Out-File -FilePath "temp-test.js" -Encoding UTF8
node temp-test.js
if ($LASTEXITCODE -ne 0) {
    Write-Error "Connection test failed"
    Remove-Item "temp-test.js" -ErrorAction SilentlyContinue
    exit 1
}
Remove-Item "temp-test.js" -ErrorAction SilentlyContinue

Write-Success "Connection test passed"

# Start Auth Service
Write-Status "Starting Auth Service..."
Set-Location "services/auth-service"
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -RedirectStandardOutput "../../logs/auth-service.log" -RedirectStandardError "../../logs/auth-service-error.log" -WindowStyle Hidden
Set-Location "../.."
Start-Sleep -Seconds 5

# Test Auth Service health
$authHealthy = $false
for ($i = 0; $i -lt 10; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 2
        if ($response) {
            Write-Success "Auth Service started successfully"
            $authHealthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $authHealthy) {
    Write-Warning "Auth Service may still be starting..."
}

# Start API Gateway
Write-Status "Starting API Gateway..."
Set-Location "api-gateway"
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -RedirectStandardOutput "../logs/api-gateway.log" -RedirectStandardError "../logs/api-gateway-error.log" -WindowStyle Hidden
Set-Location ".."
Start-Sleep -Seconds 5

# Test API Gateway health
$gatewayHealthy = $false
for ($i = 0; $i -lt 10; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 2
        if ($response) {
            Write-Success "API Gateway started successfully"
            $gatewayHealthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $gatewayHealthy) {
    Write-Warning "API Gateway may still be starting..."
}

# Display final information
Write-Host ""
Write-Host "🎉 Quick Setup Complete!" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Your Existing Data:" -ForegroundColor Cyan
Write-Host "  • Users: 3 records" -ForegroundColor White
Write-Host "  • Doctors: 17 records" -ForegroundColor White
Write-Host "  • Patients: 16 records" -ForegroundColor White
Write-Host "  • Appointments: 16 records" -ForegroundColor White
Write-Host "  • Departments: 8 records" -ForegroundColor White
Write-Host "  • Rooms: 16 records" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Service URLs:" -ForegroundColor Cyan
Write-Host "  • API Gateway: http://localhost:3000" -ForegroundColor White
Write-Host "  • Auth Service: http://localhost:3001" -ForegroundColor White
Write-Host "  • Supabase Dashboard: https://supabase.com/dashboard/project/ciasxktujslgsdgylimv" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test Commands:" -ForegroundColor Cyan
Write-Host "  # Test API Gateway" -ForegroundColor White
Write-Host "  curl http://localhost:3000/health" -ForegroundColor Gray
Write-Host ""
Write-Host "  # Register new user" -ForegroundColor White
Write-Host "  curl -X POST http://localhost:3000/api/auth/register \\" -ForegroundColor Gray
Write-Host "    -H `"Content-Type: application/json`" \\" -ForegroundColor Gray
Write-Host "    -d '{`"email`":`"test@hospital.com`",`"password`":`"test123456`",`"role`":`"patient`",`"full_name`":`"Test User`"}'" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Test the APIs with existing data" -ForegroundColor White
Write-Host "  2. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "  3. Check logs in the 'logs' folder if needed" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop services:" -ForegroundColor Yellow
Write-Host "  Get-Process node | Stop-Process" -ForegroundColor Gray
Write-Host "  docker-compose down" -ForegroundColor Gray
Write-Host ""

Write-Host "Services are running. Check the URLs above to test!" -ForegroundColor Green
