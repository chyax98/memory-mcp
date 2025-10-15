# SEARCH APOCALYPSE - Intensive search testing
# Tests FTS5 performance under various query patterns

$env:MEMORY_DB = "./stress-test.db"

Write-Host "🔍 SEARCH APOCALYPSE INITIATING! 🔍" -ForegroundColor Red

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

# Define various search patterns to stress test
$searchQueries = @(
    "performance optimization",
    "typescript react",
    "docker kubernetes",
    "azure functions",
    "database mongodb",
    "authentication oauth",
    "caching redis",
    "infrastructure terraform",
    "search elasticsearch",
    "microservices patterns",
    "distributed systems",
    "scalability reliability",
    "monitoring observability",
    "cloud native",
    "api graphql"
)

$tagSearches = @(
    "performance",
    "typescript",
    "docker", 
    "azure",
    "database",
    "security",
    "infrastructure",
    "react",
    "optimization",
    "synthetic"
)

$complexQueries = @(
    "typescript react performance optimization microservices",
    "docker kubernetes azure functions cloud",
    "database mongodb redis elasticsearch search",
    "authentication oauth security jwt tokens",
    "infrastructure terraform deployment scaling"
)

Write-Host "Testing $($searchQueries.Count) basic queries..." -ForegroundColor Yellow

$queryResults = @()
foreach ($query in $searchQueries) {
    $queryStart = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $result = node dist/index.js search-memory --query "$query" 2>&1
        $queryStart.Stop()
        
        if ($LASTEXITCODE -eq 0) {
            $queryResults += @{
                Query = $query
                Time = $queryStart.ElapsedMilliseconds
                Success = $true
            }
            Write-Host "✅ '$query': $($queryStart.ElapsedMilliseconds)ms" -ForegroundColor Green
        } else {
            $queryResults += @{
                Query = $query
                Time = $queryStart.ElapsedMilliseconds
                Success = $false
            }
            Write-Host "❌ '$query': FAILED" -ForegroundColor Red
        }
    } catch {
        $queryStart.Stop()
        Write-Host "❌ '$query': EXCEPTION" -ForegroundColor Red
    }
}

Write-Host "`nTesting $($tagSearches.Count) tag-based searches..." -ForegroundColor Yellow

$tagResults = @()
foreach ($tag in $tagSearches) {
    $tagStart = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $result = node dist/index.js search-memory --tags "$tag" 2>&1
        $tagStart.Stop()
        
        if ($LASTEXITCODE -eq 0) {
            $tagResults += @{
                Tag = $tag
                Time = $tagStart.ElapsedMilliseconds
                Success = $true
            }
            Write-Host "✅ Tag '$tag': $($tagStart.ElapsedMilliseconds)ms" -ForegroundColor Green
        } else {
            Write-Host "❌ Tag '$tag': FAILED" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Tag '$tag': EXCEPTION" -ForegroundColor Red
    }
}

Write-Host "`nTesting $($complexQueries.Count) complex multi-term queries..." -ForegroundColor Yellow

$complexResults = @()
foreach ($query in $complexQueries) {
    $complexStart = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $result = node dist/index.js search-memory --query "$query" 2>&1
        $complexStart.Stop()
        
        if ($LASTEXITCODE -eq 0) {
            $complexResults += @{
                Query = $query
                Time = $complexStart.ElapsedMilliseconds
                Success = $true
            }
            Write-Host "✅ Complex '$($query.Substring(0, [Math]::Min(30, $query.Length)))...': $($complexStart.ElapsedMilliseconds)ms" -ForegroundColor Green
        } else {
            Write-Host "❌ Complex query: FAILED" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Complex query: EXCEPTION" -ForegroundColor Red
    }
}

$stopwatch.Stop()

Write-Host "`n🎯 SEARCH APOCALYPSE RESULTS:" -ForegroundColor Cyan
Write-Host "Total Search Time: $($stopwatch.Elapsed.TotalSeconds) seconds" -ForegroundColor White

$successfulQueries = $queryResults | Where-Object { $_.Success }
if ($successfulQueries) {
    $avgQueryTime = ($successfulQueries | Measure-Object -Property Time -Average).Average
    $maxQueryTime = ($successfulQueries | Measure-Object -Property Time -Maximum).Maximum
    $minQueryTime = ($successfulQueries | Measure-Object -Property Time -Minimum).Minimum
    
    Write-Host "Query Performance:" -ForegroundColor Yellow
    Write-Host "  Average: $([math]::Round($avgQueryTime, 2))ms" -ForegroundColor White
    Write-Host "  Fastest: ${minQueryTime}ms" -ForegroundColor Green
    Write-Host "  Slowest: ${maxQueryTime}ms" -ForegroundColor Red
}

Write-Host "Search Success Rate: $($successfulQueries.Count)/$($queryResults.Count) queries" -ForegroundColor White