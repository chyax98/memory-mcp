#!/usr/bin/env pwsh
# Start the Memory Browser web server with proper environment configuration

param(
    [string]$MemoryDb = $env:MEMORY_DB,
    [int]$Port = 3000
)

# Colors for output
$ESC = [char]27
$Green = "$ESC[32m"
$Blue = "$ESC[34m"
$Yellow = "$ESC[33m"
$Red = "$ESC[31m"
$Reset = "$ESC[0m"

Write-Host ""
Write-Host "${Blue}🧠 Simple Memory MCP - Web Server${Reset}"
Write-Host "${Blue}================================${Reset}"
Write-Host ""

# Check if MEMORY_DB is set
if (-not $MemoryDb) {
    Write-Host "${Red}❌ Error: MEMORY_DB environment variable is not set${Reset}"
    Write-Host ""
    Write-Host "${Yellow}Please set it using one of these methods:${Reset}"
    Write-Host ""
    Write-Host "  1. PowerShell session:"
    Write-Host "     ${Green}`$env:MEMORY_DB = 'C:/path/to/memory.db'${Reset}"
    Write-Host ""
    Write-Host "  2. Pass as parameter:"
    Write-Host "     ${Green}.\scripts\start-web-server.ps1 -MemoryDb 'C:/path/to/memory.db'${Reset}"
    Write-Host ""
    Write-Host "  3. System environment variable (permanent)"
    Write-Host ""
    exit 1
}

# Check if database exists
if (-not (Test-Path $MemoryDb)) {
    Write-Host "${Red}❌ Error: Database not found at: $MemoryDb${Reset}"
    Write-Host ""
    Write-Host "${Yellow}Please create the database first or check the path.${Reset}"
    Write-Host ""
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "${Yellow}⚠️  node_modules not found. Running npm install...${Reset}"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "${Red}❌ npm install failed${Reset}"
        exit 1
    }
}

# Check if dist folder exists
if (-not (Test-Path "dist")) {
    Write-Host "${Yellow}⚠️  dist folder not found. Running npm run build...${Reset}"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "${Red}❌ Build failed${Reset}"
        exit 1
    }
}

# Set environment and start server
Write-Host "${Green}✓ Configuration validated${Reset}"
Write-Host ""
Write-Host "  Database: ${Blue}$MemoryDb${Reset}"
Write-Host "  Port:     ${Blue}$Port${Reset}"
Write-Host ""
Write-Host "${Yellow}Starting server...${Reset}"
Write-Host ""

$env:MEMORY_DB = $MemoryDb
$env:WEB_PORT = $Port

# Start the server
node dist/web-server.js
