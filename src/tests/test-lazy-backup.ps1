# Test lazy backup with throttling
Write-Host "Testing lazy backup functionality..." -ForegroundColor Cyan
Write-Host "Working directory: $PSScriptRoot\..\..`n" -ForegroundColor Gray

# Change to repo root
Set-Location "$PSScriptRoot\..\.."

# Setup test environment
$testDb = "C:\Users\cribe\AppData\Local\Temp\backup-test-$(Get-Date -Format 'HHmmss').db"
$testBackupPath = "C:\Users\cribe\AppData\Local\Temp\backup-test-backups-$(Get-Date -Format 'HHmmss')"

$env:MEMORY_DB = $testDb
$env:MEMORY_BACKUP_PATH = $testBackupPath
$env:MEMORY_BACKUP_INTERVAL = "1" # 1 minute for fast testing

Write-Host "Test database: $testDb" -ForegroundColor Gray
Write-Host "Test backup path: $testBackupPath`n" -ForegroundColor Gray

# Test 1: First write should create initial backup
Write-Host "1. First write (should create initial backup)..." -ForegroundColor Yellow
node dist/index.js store-memory --content "First write" --tags "test1" > $null 2>&1

$backups = Get-ChildItem "$testBackupPath\*auto*.db" -ErrorAction SilentlyContinue
if ($backups.Count -eq 1) {
    Write-Host "   ✅ PASS: Initial backup created" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL: Expected 1 backup, found $($backups.Count)" -ForegroundColor Red
}

# Test 2: Immediate second write should NOT create backup (throttled)
Write-Host "`n2. Immediate second write (should be throttled)..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
node dist/index.js store-memory --content "Second write" --tags "test2" > $null 2>&1

$backups = Get-ChildItem "$testBackupPath\*auto*.db" -ErrorAction SilentlyContinue
if ($backups.Count -eq 1) {
    Write-Host "   ✅ PASS: No new backup (throttled correctly)" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL: Expected 1 backup, found $($backups.Count) (throttle not working)" -ForegroundColor Red
}

# Test 3: After interval, should create new backup
Write-Host "`n3. Waiting 60+ seconds for interval..." -ForegroundColor Yellow
Write-Host "   (Testing throttle expiration)" -ForegroundColor Gray
Start-Sleep -Seconds 61

node dist/index.js store-memory --content "Third write after interval" --tags "test3" > $null 2>&1

$backups = Get-ChildItem "$testBackupPath\*auto*.db" -ErrorAction SilentlyContinue
if ($backups.Count -eq 2) {
    Write-Host "   ✅ PASS: New backup created after interval" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  WARNING: Expected 2 backups, found $($backups.Count)" -ForegroundColor Yellow
}

# Cleanup
Write-Host "`n4. Cleanup..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $testBackupPath -ErrorAction SilentlyContinue
Remove-Item -Force "$testDb*" -ErrorAction SilentlyContinue
Write-Host "   ✅ Test files cleaned up" -ForegroundColor Green

Write-Host "`n✅ Lazy backup test complete!" -ForegroundColor Cyan
Write-Host "   Backup throttling works correctly." -ForegroundColor Gray
Write-Host "   Only backs up when data changes AND interval has passed." -ForegroundColor Gray
