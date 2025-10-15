# BULK INSERT STORM - Rapid fire memory insertion
# Tests insertion performance under high load

$env:MEMORY_DB = "./stress-test.db"

Write-Host "🔥 BULK INSERT STORM COMMENCING! 🔥" -ForegroundColor Red

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

# Array of diverse content types for realistic testing
$contentTypes = @(
    @{content="Azure Function App with TypeScript: HTTP triggers, Timer triggers, Queue triggers, Blob triggers, Dependency injection with @azure/functions-core"; tags="azure,functions,typescript,triggers"},
    @{content="Docker multi-stage builds: FROM node:18-alpine AS builder, COPY package*.json, RUN npm ci --only=production, FROM node:18-alpine AS runtime, COPY --from=builder"; tags="docker,containers,multi-stage,nodejs"},
    @{content="Kubernetes deployment strategies: Rolling updates, Blue-green deployments, Canary deployments, A/B testing, Resource limits and requests, HPA configuration"; tags="kubernetes,deployment,scaling,devops"},
    @{content="GraphQL schema design: Type definitions, Resolvers, Query optimization, N+1 problem solutions, DataLoader pattern, Apollo Server configuration"; tags="graphql,schema,apollo,optimization"},
    @{content="Redis caching strategies: Cache-aside pattern, Write-through, Write-behind, Cache invalidation, TTL management, Redis Cluster configuration"; tags="redis,caching,patterns,performance"},
    @{content="OAuth 2.0 implementation: Authorization Code flow, PKCE, JWT tokens, Refresh tokens, Scope management, OIDC integration with Azure AD"; tags="oauth,security,jwt,azure-ad,authentication"},
    @{content="Terraform Infrastructure as Code: Provider configuration, Resource blocks, Data sources, Variables, Outputs, State management, Remote backends"; tags="terraform,iac,infrastructure,automation"},
    @{content="MongoDB aggregation pipelines: $match, $group, $project, $sort, $limit, Index optimization, Compound indexes, Text search indexes"; tags="mongodb,aggregation,indexes,database"},
    @{content="React Context API patterns: Provider pattern, useContext hook, Context composition, Performance considerations, State management alternatives"; tags="react,context,state-management,hooks"},
    @{content="Elasticsearch full-text search: Inverted indexes, Analyzers, Tokenizers, Query DSL, Bool queries, Aggregations, Mapping configuration"; tags="elasticsearch,search,indexing,queries"}
)

# Generate additional synthetic content for bulk testing
$syntheticContent = @()
for ($i = 1; $i -le 50; $i++) {
    $syntheticContent += @{
        content="Synthetic memory entry #$i`: Performance testing with varied content length and complexity. This entry contains technical information about distributed systems, microservices architecture, and cloud-native patterns. Keywords: scalability, reliability, performance, monitoring, observability, metrics, logging, tracing."
        tags="synthetic,performance-test,entry-$i,distributed-systems"
    }
}

$allContent = $contentTypes + $syntheticContent
$successCount = 0
$failureCount = 0

Write-Host "Inserting $($allContent.Count) memories as fast as possible..." -ForegroundColor Yellow

foreach ($item in $allContent) {
    try {
        $result = node dist/index.js store-memory --content "$($item.content)" --tags "$($item.tags)" 2>&1
        if ($LASTEXITCODE -eq 0) {
            $successCount++
            if ($successCount % 10 -eq 0) {
                Write-Host "✅ Inserted $successCount memories..." -ForegroundColor Green
            }
        } else {
            $failureCount++
            Write-Host "❌ Failed to insert memory: $result" -ForegroundColor Red
        }
    } catch {
        $failureCount++
        Write-Host "❌ Exception: $($_.Exception.Message)" -ForegroundColor Red
    }
}

$stopwatch.Stop()
$elapsed = $stopwatch.Elapsed

Write-Host "`n🎯 BULK INSERT STORM RESULTS:" -ForegroundColor Cyan
Write-Host "Total Time: $($elapsed.TotalSeconds) seconds" -ForegroundColor White
Write-Host "Successful Inserts: $successCount" -ForegroundColor Green
Write-Host "Failed Inserts: $failureCount" -ForegroundColor Red
Write-Host "Average per insert: $([math]::Round($elapsed.TotalMilliseconds / $allContent.Count, 2)) ms" -ForegroundColor Yellow

# Final stats check
Write-Host "`n📊 Final Database Stats:" -ForegroundColor Cyan
node dist/index.js memory-stats