# Hospital Management System - Development Environment Setup (PowerShell)
# This script helps set up the development environment on Windows

param(
    [switch]$SkipDependencies,
    [switch]$SkipSupabase,
    [switch]$AutoStart
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
    Magenta = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-Prerequisites {
    Write-ColorOutput "`n🔍 Checking Prerequisites..." $Colors.Cyan
    
    $allGood = $true
    
    # Check Node.js
    if (Test-Command "node") {
        $nodeVersion = node --version
        $majorVersion = [int]($nodeVersion -replace "v(\d+)\..*", '$1')
        
        if ($majorVersion -ge 18) {
            Write-ColorOutput "✅ Node.js $nodeVersion (OK)" $Colors.Green
        } else {
            Write-ColorOutput "❌ Node.js $nodeVersion (Requires >= 18.0.0)" $Colors.Red
            $allGood = $false
        }
    } else {
        Write-ColorOutput "❌ Node.js not found. Please install Node.js 18+" $Colors.Red
        $allGood = $false
    }
    
    # Check npm
    if (Test-Command "npm") {
        $npmVersion = npm --version
        Write-ColorOutput "✅ npm $npmVersion" $Colors.Green
    } else {
        Write-ColorOutput "❌ npm not found" $Colors.Red
        $allGood = $false
    }
    
    # Check git
    if (Test-Command "git") {
        $gitVersion = git --version
        Write-ColorOutput "✅ $gitVersion" $Colors.Green
    } else {
        Write-ColorOutput "❌ Git not found. Please install Git" $Colors.Red
        $allGood = $false
    }
    
    if (-not $allGood) {
        Write-ColorOutput "`n❌ Please install missing prerequisites and run the script again." $Colors.Red
        exit 1
    }
}

function Setup-EnvironmentFiles {
    Write-ColorOutput "`n📝 Setting up Environment Files..." $Colors.Cyan
    
    $envFiles = @(
        @{
            Example = "frontend\.env.example"
            Target = "frontend\.env.local"
            Name = "Frontend"
        },
        @{
            Example = "backend\.env.example"
            Target = "backend\.env"
            Name = "Backend"
        },
        @{
            Example = "backend\api-gateway\.env.example"
            Target = "backend\api-gateway\.env"
            Name = "API Gateway"
        }
    )
    
    foreach ($envFile in $envFiles) {
        if (-not (Test-Path $envFile.Target)) {
            if (Test-Path $envFile.Example) {
                Copy-Item $envFile.Example $envFile.Target
                Write-ColorOutput "✅ Created $($envFile.Name) environment file" $Colors.Green
            } else {
                Write-ColorOutput "⚠️  $($envFile.Example) not found" $Colors.Yellow
            }
        } else {
            Write-ColorOutput "✅ $($envFile.Name) environment file exists" $Colors.Green
        }
    }
}

function Get-SupabaseCredentials {
    Write-ColorOutput "`n🔐 Supabase Configuration" $Colors.Cyan
    Write-ColorOutput "Please provide your Supabase project credentials:" $Colors.Yellow
    Write-ColorOutput "You can find these in your Supabase project dashboard > Settings > API" $Colors.Yellow
    
    $supabaseUrl = Read-Host "Supabase URL (https://your-project.supabase.co)"
    $supabaseAnonKey = Read-Host "Supabase Anon Key"
    $supabaseServiceKey = Read-Host "Supabase Service Role Key"
    
    return @{
        Url = $supabaseUrl
        AnonKey = $supabaseAnonKey
        ServiceKey = $supabaseServiceKey
    }
}

function Update-EnvironmentFile {
    param(
        [string]$FilePath,
        [hashtable]$Updates
    )
    
    if (-not (Test-Path $FilePath)) {
        Write-ColorOutput "⚠️  $FilePath not found" $Colors.Yellow
        return
    }
    
    $content = Get-Content $FilePath -Raw
    
    foreach ($key in $Updates.Keys) {
        $value = $Updates[$key]
        $pattern = "^$key=.*$"
        
        if ($content -match $pattern) {
            $content = $content -replace $pattern, "$key=$value"
        } else {
            $content += "`n$key=$value"
        }
    }
    
    Set-Content -Path $FilePath -Value $content
}

function Update-SupabaseCredentials {
    param([hashtable]$Credentials)
    
    Write-ColorOutput "`n📝 Updating environment files with Supabase credentials..." $Colors.Cyan
    
    # Update frontend environment
    Update-EnvironmentFile "frontend\.env.local" @{
        "NEXT_PUBLIC_SUPABASE_URL" = $Credentials.Url
        "NEXT_PUBLIC_SUPABASE_ANON_KEY" = $Credentials.AnonKey
    }
    
    # Update backend environment
    Update-EnvironmentFile "backend\.env" @{
        "SUPABASE_URL" = $Credentials.Url
        "SUPABASE_ANON_KEY" = $Credentials.AnonKey
        "SUPABASE_SERVICE_ROLE_KEY" = $Credentials.ServiceKey
    }
    
    # Update API Gateway environment
    Update-EnvironmentFile "backend\api-gateway\.env" @{
        "SUPABASE_URL" = $Credentials.Url
        "SUPABASE_ANON_KEY" = $Credentials.AnonKey
        "SUPABASE_SERVICE_ROLE_KEY" = $Credentials.ServiceKey
    }
    
    Write-ColorOutput "✅ Environment files updated with Supabase credentials" $Colors.Green
}

function Install-Dependencies {
    Write-ColorOutput "`n📦 Installing Dependencies..." $Colors.Cyan
    
    try {
        Write-ColorOutput "Installing root dependencies..." $Colors.Yellow
        npm install
        
        Write-ColorOutput "Installing frontend dependencies..." $Colors.Yellow
        Set-Location frontend
        npm install
        Set-Location ..
        
        Write-ColorOutput "Installing backend dependencies..." $Colors.Yellow
        Set-Location backend
        npm run install:all
        Set-Location ..
        
        Write-ColorOutput "✅ All dependencies installed successfully" $Colors.Green
    }
    catch {
        Write-ColorOutput "❌ Failed to install dependencies: $($_.Exception.Message)" $Colors.Red
        exit 1
    }
}

function Start-DevelopmentServers {
    Write-ColorOutput "`n🚀 Starting Development Servers..." $Colors.Cyan
    
    if (-not $AutoStart) {
        $startServers = Read-Host "Would you like to start the development servers now? (y/n)"
        if ($startServers -notmatch "^[Yy]") {
            return
        }
    }
    
    Write-ColorOutput "Starting servers..." $Colors.Yellow
    
    # Start development servers
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    
    Write-ColorOutput "`n🎉 Development servers started!" $Colors.Green
    Write-ColorOutput "Frontend: http://localhost:3000" $Colors.Cyan
    Write-ColorOutput "API Gateway: http://localhost:3100" $Colors.Cyan
    Write-ColorOutput "`nPress Ctrl+C in the new window to stop the servers" $Colors.Yellow
}

# Main execution
try {
    Write-ColorOutput "🏥 Hospital Management System - Development Setup" "White"
    Write-ColorOutput ("=" * 50) $Colors.Cyan
    
    Test-Prerequisites
    Setup-EnvironmentFiles
    
    if (-not $SkipSupabase) {
        $setupSupabase = Read-Host "`nWould you like to configure Supabase credentials now? (y/n)"
        
        if ($setupSupabase -match "^[Yy]") {
            $credentials = Get-SupabaseCredentials
            Update-SupabaseCredentials $credentials
        }
    }
    
    if (-not $SkipDependencies) {
        Install-Dependencies
    }
    
    Start-DevelopmentServers
    
    Write-ColorOutput "`n✅ Setup completed successfully!" $Colors.Green
    Write-ColorOutput "You can now start developing your Hospital Management System!" $Colors.Cyan
}
catch {
    Write-ColorOutput "`n❌ Setup failed: $($_.Exception.Message)" $Colors.Red
    exit 1
}

# Usage examples:
# .\scripts\setup-dev-environment.ps1                    # Full setup with prompts
# .\scripts\setup-dev-environment.ps1 -SkipSupabase     # Skip Supabase configuration
# .\scripts\setup-dev-environment.ps1 -AutoStart        # Auto-start servers without prompt
# .\scripts\setup-dev-environment.ps1 -SkipDependencies # Skip dependency installation
