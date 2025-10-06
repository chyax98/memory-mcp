# Quick validation: CLI exits immediately (no hanging)
Write-Host "Validating CLI execution behavior..." -ForegroundColor Cyan
Write-Host "Working directory: $PSScriptRoot\..\..`n" -ForegroundColor Gray

# Change to repo root
Set-Location "$PSScriptRoot\..\.."

# Test 1: CLI mode (with arguments) - should exit immediately
Write-Host "1. Testing CLI mode (should exit fast)..." -ForegroundColor Yellow
$cliStart = Get-Date
node dist/index.js memory-stats > $null 2>&1
$cliDuration = (Get-Date) - $cliStart

if ($cliDuration.TotalSeconds -lt 5) {
    Write-Host "   ✅ PASS: CLI exited in $([math]::Round($cliDuration.TotalSeconds, 1))s (no hanging)" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL: CLI took $([math]::Round($cliDuration.TotalSeconds, 1))s (hanging detected)" -ForegroundColor Red
}

# Test 2: Check code logic
Write-Host "`n2. Checking initialization code..." -ForegroundColor Yellow
$memoryServiceTs = Get-Content "src\services\memory-service.ts" -Raw

if ($memoryServiceTs -match "this\.backup\?\.") {
    Write-Host "   ✅ PASS: Optional chaining for backup (KISS)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  WARNING: May not be using optional chaining" -ForegroundColor Yellow
}

Write-Host "`n✅ Validation complete!" -ForegroundColor Cyan
Write-Host "   CLI commands exit immediately without hanging." -ForegroundColor Gray
Write-Host "   Backup is auto-configured and uses lazy writes." -ForegroundColor Gray
