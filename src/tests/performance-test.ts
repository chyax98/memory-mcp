#!/usr/bin/env node

import { MemoryService } from '../services/memory-service.js';
import * as fs from 'fs';

async function performanceTest(): Promise<void> {
  console.log('🚀 Performance Test - Large Content Storage');
  console.log('==========================================\n');

  const service = new MemoryService('performance-test.db', 5 * 1024 * 1024); // 5MB limit
  await service.initialize();

  try {
    // Test with various content sizes
    const testSizes = [1000, 10000, 100000, 500000, 1000000]; // 1KB to 1MB

    for (const size of testSizes) {
      // Generate test content
      const content = 'A'.repeat(size) + ' - Performance test content with unique ending ' + Date.now();
      
      console.log(`Testing ${(size / 1000).toFixed(0)}KB content...`);
      const startTime = Date.now();
      
      const hash = service.store(content, ['performance-test']);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✓ Stored in ${duration}ms (hash: ${hash.substring(0, 8)}...)`);
      
      // Verify storage worked
      const retrieved = service.getByHash(hash);
      if (!retrieved || retrieved.content !== content) {
        throw new Error('Content verification failed');
      }
    }

    // Test size limit
    console.log('\nTesting size limit (6MB content - should exceed 5MB limit)...');
    try {
      const oversizedContent = 'X'.repeat(6 * 1024 * 1024);
      service.store(oversizedContent, ['oversize-test']);
      console.log('❌ Size limit test failed - should have thrown error');
    } catch (error: any) {
      console.log(`✓ Size limit enforced: ${error.message}`);
    }

    // Show final stats
    console.log('\n📊 Final Statistics:');
    const stats = await service.stats();
    console.log(`Total memories: ${stats.totalMemories}`);
    console.log(`Database size: ${(stats.dbSize / 1024).toFixed(1)}KB`);
    console.log(`Database path: ${stats.dbPath}`);
    console.log(`Resolved path: ${stats.resolvedPath}`);

  } finally {
    await service.close();
    
    // Clean up test database
    try {
      fs.unlinkSync('performance-test.db');
      fs.unlinkSync('performance-test.db-wal');
      fs.unlinkSync('performance-test.db-shm');
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  console.log('\n🎉 Performance test completed successfully!');
}

performanceTest().catch(console.error);
