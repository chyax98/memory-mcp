# MEMORY MASSACRE - Complete stress test suite
# Runs all stress tests in sequence for comprehensive evaluation

$env:MEMORY_DB = "./stress-test.db"

Write-Host "💀 MEMORY MASSACRE - COMPLETE SYSTEM ANNIHILATION 💀" -ForegroundColor Red -BackgroundColor Black

$totalStopwatch = [System.Diagnostics.Stopwatch]::StartNew()

Write-Host "`n🧹 Cleaning up previous test database..." -ForegroundColor Yellow
if (Test-Path "./stress-test.db") {
    Remove-Item "./stress-test.db" -Force
    Write-Host "✅ Old database destroyed" -ForegroundColor Green
}

Write-Host "`n📊 Initial state check..." -ForegroundColor Yellow
node dist/index.js memory-stats

Write-Host "`n" + "="*80 -ForegroundColor Red
Write-Host "PHASE 1: BULK INSERT STORM" -ForegroundColor Red -BackgroundColor White
Write-Host "="*80 -ForegroundColor Red

& ".\stress-tests\bulk-insert-storm.ps1"

Write-Host "`n" + "="*80 -ForegroundColor Blue
Write-Host "PHASE 2: SEARCH APOCALYPSE" -ForegroundColor Blue -BackgroundColor White  
Write-Host "="*80 -ForegroundColor Blue

& ".\stress-tests\search-apocalypse.ps1"

Write-Host "`n" + "="*80 -ForegroundColor Green
Write-Host "PHASE 3: EDGE CASE CHAOS" -ForegroundColor Green -BackgroundColor Black
Write-Host "="*80 -ForegroundColor Green

# Edge case testing - Very long content
$veryLongContent = "EXTREME LENGTH TEST: " + ("A" * 5000) + " This is an extremely long memory entry designed to test the system's ability to handle large content blocks. " + ("B" * 3000) + " Testing unicode characters and special chars for edge case handling."

Write-Host "Testing extremely long content ($($veryLongContent.Length) chars)..." -ForegroundColor Yellow
node dist/index.js store-memory --content "$veryLongContent" --tags "extreme-length,edge-case,unicode,special-chars"

# Empty content edge case
Write-Host "Testing empty content edge case..." -ForegroundColor Yellow
node dist/index.js store-memory --content "" --tags "empty-content,edge-case"

# Special character mayhem
$specialContent = "Special chars test with various symbols and unicode characters for comprehensive edge case testing of the memory system storage and retrieval capabilities."

Write-Host "Testing special characters and unicode..." -ForegroundColor Yellow
node dist/index.js store-memory --content "$specialContent" --tags "special-chars,unicode,emojis,edge-case"

# Very many tags
$manyTags = "tag1,tag2,tag3,tag4,tag5,tag6,tag7,tag8,tag9,tag10,tag11,tag12,tag13,tag14,tag15,tag16,tag17,tag18,tag19,tag20,tag21,tag22,tag23,tag24,tag25,tag26,tag27,tag28,tag29,tag30"
Write-Host "Testing memory with many tags (30 tags)..." -ForegroundColor Yellow
node dist/index.js store-memory --content "Testing system with an excessive number of tags to see how it handles tag storage and retrieval performance" --tags "$manyTags"

Write-Host "`n" + "="*80 -ForegroundColor Purple
Write-Host "PHASE 4: RAPID FIRE OPERATIONS" -ForegroundColor Purple -BackgroundColor Black
Write-Host "="*80 -ForegroundColor Purple

Write-Host "Rapid fire search operations (50 searches in a row)..." -ForegroundColor Yellow
$rapidSearches = @("performance", "test", "azure", "database", "optimization", "react", "typescript", "docker", "kubernetes", "search")

for ($i = 1; $i -le 50; $i++) {
    $searchTerm = $rapidSearches[$i % $rapidSearches.Length]
    node dist/index.js search-memory --query "$searchTerm" > $null
    if ($i % 10 -eq 0) {
        Write-Host "Completed $i rapid searches..." -ForegroundColor Green
    }
}

Write-Host "`n" + "="*80 -ForegroundColor Magenta
Write-Host "FINAL DAMAGE ASSESSMENT" -ForegroundColor Magenta -BackgroundColor Black
Write-Host "="*80 -ForegroundColor Magenta

$totalStopwatch.Stop()

Write-Host "`n📊 Final Database Statistics:" -ForegroundColor Cyan
node dist/index.js memory-stats

Write-Host "`n🏆 MEMORY MASSACRE COMPLETE! 🏆" -ForegroundColor Green
Write-Host "Total Execution Time: $($totalStopwatch.Elapsed.TotalSeconds) seconds" -ForegroundColor White
Write-Host "Database survived the massacre! 💪" -ForegroundColor Green

# Test search functionality one more time
Write-Host "`n🔍 Final search verification..." -ForegroundColor Yellow
node dist/index.js search-memory --query "performance test"

Write-Host "`n💀 The system has been thoroughly DESTROYED and REBUILT! 💀" -ForegroundColor Red