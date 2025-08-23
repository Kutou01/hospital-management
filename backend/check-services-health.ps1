# Hospital Management System - Service Health Check
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   Hospital Management Service Health Check   " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name="API Gateway"; Port=3100; Endpoint="/health"},
    @{Name="Auth Service"; Port=3001; Endpoint="/health"},
    @{Name="Doctor Service"; Port=3002; Endpoint="/health"},
    @{Name="Patient Service"; Port=3003; Endpoint="/health"},
    @{Name="Appointment Service"; Port=3004; Endpoint="/health"},
    @{Name="Department Service"; Port=3005; Endpoint="/health"},
    @{Name="Receptionist Service"; Port=3006; Endpoint="/health"},
    @{Name="Medical Records"; Port=3007; Endpoint="/health"},
    @{Name="Payment Service"; Port=3009; Endpoint="/health"},
    @{Name="Notification Service"; Port=3011; Endpoint="/health"},
    @{Name="GraphQL Gateway"; Port=3200; Endpoint="/health"}
)

$healthy = 0
$unhealthy = 0
$results = @()

foreach ($service in $services) {
    Write-Host "Checking $($service.Name)..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)$($service.Endpoint)" -Method GET -TimeoutSec 3 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅ HEALTHY" -ForegroundColor Green
            $healthy++
            $results += @{
                Service = $service.Name
                Port = $service.Port
                Status = "✅ HEALTHY"
                Details = "Service is running and responding"
            }
        } else {
            Write-Host " ⚠️  DEGRADED" -ForegroundColor Yellow
            $unhealthy++
            $results += @{
                Service = $service.Name
                Port = $service.Port
                Status = "⚠️  DEGRADED"
                Details = "Service returned status code: $($response.StatusCode)"
            }
        }
    }
    catch {
        Write-Host " ❌ UNHEALTHY" -ForegroundColor Red
        $unhealthy++
        $results += @{
            Service = $service.Name
            Port = $service.Port
            Status = "❌ UNHEALTHY"
            Details = $_.Exception.Message
        }
    }
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "                  SUMMARY                      " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Display results in table format
$results | Format-Table -AutoSize @{Label="Service"; Expression={$_.Service}}, 
                                   @{Label="Port"; Expression={$_.Port}}, 
                                   @{Label="Status"; Expression={$_.Status}}

Write-Host ""
Write-Host "Total Services: $($services.Count)" -ForegroundColor White
Write-Host "Healthy: $healthy" -ForegroundColor Green
Write-Host "Unhealthy: $unhealthy" -ForegroundColor Red
Write-Host ""

# Overall system status
if ($healthy -eq $services.Count) {
    Write-Host "🎉 SYSTEM STATUS: ALL SERVICES OPERATIONAL" -ForegroundColor Green
} elseif ($healthy -ge ($services.Count * 0.7)) {
    Write-Host "⚠️  SYSTEM STATUS: PARTIALLY OPERATIONAL" -ForegroundColor Yellow
    Write-Host "Some services need attention" -ForegroundColor Yellow
} else {
    Write-Host "❌ SYSTEM STATUS: CRITICAL" -ForegroundColor Red
    Write-Host "Most services are not responding" -ForegroundColor Red
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan

# Test specific endpoints
Write-Host ""
Write-Host "Testing Key Endpoints..." -ForegroundColor Cyan
Write-Host ""

# Test API Gateway service discovery
try {
    $services_response = Invoke-RestMethod -Uri "http://localhost:3100/services" -Method GET -ErrorAction Stop
    Write-Host "✅ API Gateway Service Discovery: " -ForegroundColor Green -NoNewline
    Write-Host "$($services_response.availableServices.PSObject.Properties.Count) services registered"
}
catch {
    Write-Host "❌ API Gateway Service Discovery: Failed" -ForegroundColor Red
}

# Test GraphQL endpoint
try {
    $graphql_query = @{
        query = "{ __schema { queryType { name } } }"
    } | ConvertTo-Json
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    $graphql_response = Invoke-RestMethod -Uri "http://localhost:3100/graphql" -Method POST -Body $graphql_query -Headers $headers -ErrorAction Stop
    Write-Host "✅ GraphQL Gateway: Schema accessible" -ForegroundColor Green
}
catch {
    Write-Host "❌ GraphQL Gateway: Not accessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
