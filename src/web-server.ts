#!/usr/bin/env node

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MemoryService } from './services/memory-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.WEB_PORT || '3000', 10);
const dbPath = process.env.MEMORY_DB || './memory.db';

// Validate database exists
if (!existsSync(dbPath)) {
  console.error(`❌ Error: Database not found at: ${dbPath}`);
  console.error(`\nPlease set MEMORY_DB environment variable or create the database first.`);
  process.exit(1);
}

// Initialize memory service with error handling
let memoryService: MemoryService;
try {
  memoryService = new MemoryService(dbPath);
  memoryService.initialize();
  console.log(`✓ Database connected: ${dbPath}`);
} catch (error: any) {
  console.error(`❌ Failed to initialize database: ${error.message}`);
  process.exit(1);
}

console.log(`\n🧠 Memory Browser Server`);
console.log(`📊 Database: ${dbPath}`);
console.log(`🌐 Server: http://localhost:${PORT}`);
console.log(`\n💡 Press Ctrl+C to stop\n`);


// Helper to send JSON response
function sendJSON(res: ServerResponse, data: any, status = 200) {
  res.writeHead(status, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

// Helper to send error response
function sendError(res: ServerResponse, message: string, status = 500) {
  console.error(`[${new Date().toISOString()}] Error: ${message}`);
  sendJSON(res, { error: message }, status);
}

// Helper to parse URL query parameters
function parseQuery(url: string): URLSearchParams {
  const queryStart = url.indexOf('?');
  if (queryStart === -1) return new URLSearchParams();
  return new URLSearchParams(url.substring(queryStart));
}

// Request logger middleware
function logRequest(req: IncomingMessage) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  logRequest(req);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    if (!req.url) {
      sendError(res, 'Invalid request', 400);
      return;
    }

    // Serve HTML file
    if (req.url === '/' || req.url === '/index.html') {
      try {
        const htmlPath = join(__dirname, '..', 'web', 'memory-browser.html');
        
        if (!existsSync(htmlPath)) {
          sendError(res, 'HTML file not found', 404);
          return;
        }

        let html = readFileSync(htmlPath, 'utf-8');
        
        // Inject API configuration
        const configScript = `
        const DB_PATH = '${dbPath.replace(/\\/g, '/')}';
        const API_URL = 'http://localhost:${PORT}/api';`;
        
        html = html.replace(
          /const DB_PATH = ['"][^'"]*['"];/,
          configScript
        );
        
        // Replace loadMemories function to use API
        html = html.replace(
          /async function loadMemories\(\) \{[\s\S]*?^\s{8}\}/m,
          `async function loadMemories() {
            try {
                document.getElementById('loading').style.display = 'block';
                
                // Fetch stats
                const statsRes = await fetch(API_URL + '/stats');
                if (!statsRes.ok) throw new Error('Failed to fetch stats');
                dbStats = await statsRes.json();
                
                // Fetch all memories
                const memoriesRes = await fetch(API_URL + '/memories?limit=1000');
                if (!memoriesRes.ok) throw new Error('Failed to fetch memories');
                const data = await memoriesRes.json();
                
                allMemories = data.memories || [];
                displayedMemories = allMemories;
                
                extractTags();
                renderMemories();
                renderTagCloud();
                updateStats();
                
                // Clear any previous errors
                document.getElementById('error').style.display = 'none';
                
            } catch (error) {
                showError(\`Error loading memories: \${error.message}\`);
            } finally {
                document.getElementById('loading').style.display = 'none';
            }
        }`
        );
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      } catch (error: any) {
        sendError(res, `Failed to load HTML: ${error.message}`, 500);
        return;
      }
    }

    // API endpoints
    if (req.url.startsWith('/api/')) {
      const path = req.url.replace('/api', '');
      const pathWithoutQuery = path.split('?')[0];

      // GET /api/memories - Get all memories with optional filters
      if (pathWithoutQuery === '/memories') {
        try {
          const params = parseQuery(req.url);
          const limit = Math.min(parseInt(params.get('limit') || '100', 10), 10000);
          const query = params.get('query') || undefined;
          const tag = params.get('tag') || undefined;

          const memories = memoryService.search(
            query,
            tag ? [tag] : undefined,
            limit
          );

          sendJSON(res, { 
            memories,
            count: memories.length,
            limit 
          });
        } catch (error: any) {
          sendError(res, `Search failed: ${error.message}`, 500);
        }
        return;
      }

      // GET /api/stats - Get database statistics
      if (pathWithoutQuery === '/stats') {
        try {
          const stats = memoryService.stats();
          sendJSON(res, stats);
        } catch (error: any) {
          sendError(res, `Stats failed: ${error.message}`, 500);
        }
        return;
      }

      // GET /api/memory/:hash - Get memory by hash
      if (pathWithoutQuery.startsWith('/memory/')) {
        try {
          const hash = pathWithoutQuery.replace('/memory/', '');
          
          if (!hash || hash.length < 8) {
            sendError(res, 'Invalid memory hash', 400);
            return;
          }

          const memory = memoryService.getByHash(hash);
          
          if (!memory) {
            sendError(res, 'Memory not found', 404);
            return;
          }

          sendJSON(res, memory);
        } catch (error: any) {
          sendError(res, `Failed to fetch memory: ${error.message}`, 500);
        }
        return;
      }

      // Unknown API endpoint
      sendError(res, `API endpoint not found: ${pathWithoutQuery}`, 404);
      return;
    }

    // 404 for all other paths
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');

  } catch (error: any) {
    console.error('[FATAL] Unhandled error:', error);
    if (!res.headersSent) {
      sendError(res, 'Internal server error', 500);
    }
  }
});


// Error handling for server
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use`);
    console.error(`   Try a different port: WEB_PORT=3001 node dist/web-server.js\n`);
  } else {
    console.error(`\n❌ Server error: ${error.message}\n`);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`✓ Server started successfully`);
  console.log(`\n📖 Open in browser: http://localhost:${PORT}`);
  console.log(`\n🔧 Environment:`);
  console.log(`   MEMORY_DB=${dbPath}`);
  console.log(`   WEB_PORT=${PORT}`);
  console.log('');
});

// Graceful shutdown
let isShuttingDown = false;

function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('\n\n🛑 Shutting down gracefully...');
  
  server.close(() => {
    console.log('✓ HTTP server closed');
    
    try {
      memoryService.close();
      console.log('✓ Database connection closed');
    } catch (error: any) {
      console.error(`⚠️  Error closing database: ${error.message}`);
    }
    
    console.log('\n👋 Goodbye!\n');
    process.exit(0);
  });
  
  // Force shutdown after 5 seconds
  setTimeout(() => {
    console.error('\n⚠️  Forced shutdown after timeout\n');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});
