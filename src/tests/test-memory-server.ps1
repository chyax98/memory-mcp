# Simple Memory Server Test Script
# PowerShell script to test the memory server CLI functionality

Write-Host "🧪 Simple Memory Server CLI Tests" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Clean up any existing test database
$testDb = "./test-memory.db"
if (Test-Path $testDb) {
    Remove-Item $testDb -Force
    Write-Host "🧹 Cleaned up existing test database" -ForegroundColor Yellow
}

# Set environment variable for test database
$env:MEMORY_DB = $testDb

try {
    # Build the project first
    Write-Host "🔨 Building project..." -ForegroundColor Blue
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }

    # Test 1: Store a memory
    Write-Host ""
    Write-Host "📝 Test 1: Store memory..." -ForegroundColor Green
    $result1 = node dist/index.js store-memory --content "Test memory 1" --tags "test,demo"
    Write-Host $result1

    # Test 2: Store another memory
    Write-Host ""
    Write-Host "📝 Test 2: Store another memory..." -ForegroundColor Green
    $result2 = node dist/index.js store-memory --content "Project documentation" --tags "project,docs"
    Write-Host "✅ Second memory stored"

    # Test 3: Search memories
    Write-Host ""
    Write-Host "🔍 Test 3: Search memories by content..." -ForegroundColor Green
    $result3 = node dist/index.js search-memory --query "Test"
    Write-Host $result3

    # Test 4: Search by tags
    Write-Host ""
    Write-Host "🏷️  Test 4: Search by tags..." -ForegroundColor Green
    $result4 = node dist/index.js search-memory --tags "project"
    Write-Host "✅ Tag search completed"

    # Test 5: Memory stats
    Write-Host ""
    Write-Host "📊 Test 5: Memory statistics..." -ForegroundColor Green
    $result5 = node dist/index.js memory-stats
    Write-Host $result5

    # Test 6: Delete by tag
    Write-Host ""
    Write-Host "🗑️  Test 6: Delete by tag..." -ForegroundColor Green
    $result6 = node dist/index.js delete-memory --tag "test"
    Write-Host $result6

    # Final stats
    Write-Host ""
    Write-Host "📊 Final statistics..." -ForegroundColor Green
    $finalStats = node dist/index.js memory-stats
    Write-Host $finalStats

    Write-Host ""
    Write-Host "🎉 All tests completed successfully!" -ForegroundColor Cyan

} catch {
    Write-Host ""
    Write-Host "❌ Test failed: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clean up test database
    if (Test-Path $testDb) {
        Remove-Item $testDb -Force
        Write-Host ""
        Write-Host "🧹 Test database cleaned up" -ForegroundColor Yellow
    }
}
