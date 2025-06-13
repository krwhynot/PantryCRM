/**
 * Memory Usage Pattern Testing for PantryCRM
 * Tests memory consumption patterns under various load scenarios
 * Based on Next.js memory optimization best practices
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class MemoryUsageTest {
  constructor() {
    this.results = [];
    this.testStartTime = Date.now();
    this.memorySnapshots = [];
    this.gcEvents = [];
  }

  /**
   * Start memory monitoring for the Next.js application
   */
  async startMemoryMonitoring() {
    console.log('🔍 Starting memory usage monitoring...');
    
    // Start the Next.js app with memory profiling enabled
    const nextProcess = spawn('node', [
      '--heap-prof',
      '--heap-prof-interval=5000', // Take heap snapshot every 5 seconds
      '--experimental-worker', // Enable worker threads
      'node_modules/next/dist/bin/next',
      'dev'
    ], {
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=4096 --inspect',
        NODE_ENV: 'development'
      }
    });

    nextProcess.stdout.on('data', (data) => {
      console.log(`Next.js: ${data}`);
    });

    nextProcess.stderr.on('data', (data) => {
      console.error(`Next.js Error: ${data}`);
    });

    return nextProcess;
  }

  /**
   * Monitor memory usage during concurrent operations
   */
  async monitorConcurrentMemoryUsage() {
    console.log('📊 Monitoring memory during concurrent operations...');
    
    const memoryInterval = setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const timestamp = Date.now();
      
      this.memorySnapshots.push({
        timestamp,
        rss: memoryUsage.rss, // Resident Set Size
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      });

      // Log significant memory changes
      if (this.memorySnapshots.length > 1) {
        const previous = this.memorySnapshots[this.memorySnapshots.length - 2];
        const current = this.memorySnapshots[this.memorySnapshots.length - 1];
        
        const heapGrowth = current.heapUsed - previous.heapUsed;
        const rssGrowth = current.rss - previous.rss;
        
        if (heapGrowth > 10 * 1024 * 1024) { // 10MB increase
          console.warn(`⚠️  Significant heap growth: ${this.formatBytes(heapGrowth)}`);
        }
        
        if (rssGrowth > 20 * 1024 * 1024) { // 20MB increase
          console.warn(`⚠️  Significant RSS growth: ${this.formatBytes(rssGrowth)}`);
        }
      }
    }, 1000); // Monitor every second

    return memoryInterval;
  }

  /**
   * Test memory patterns for different food service CRM operations
   */
  async testOperationMemoryPatterns() {
    console.log('🧪 Testing memory patterns for CRM operations...');
    
    const operations = [
      {
        name: 'Organization List Loading',
        description: 'Loading paginated organization lists',
        testFunction: this.testOrganizationListMemory.bind(this)
      },
      {
        name: 'Search Operations',
        description: 'Memory usage during complex searches',
        testFunction: this.testSearchMemory.bind(this)
      },
      {
        name: 'Report Generation',
        description: 'Memory consumption during report generation',
        testFunction: this.testReportGenerationMemory.bind(this)
      },
      {
        name: 'Bulk Data Operations',
        description: 'Memory patterns during bulk data processing',
        testFunction: this.testBulkDataMemory.bind(this)
      },
      {
        name: 'API Concurrent Requests',
        description: 'Memory usage under concurrent API load',
        testFunction: this.testConcurrentAPIMemory.bind(this)
      }
    ];

    for (const operation of operations) {
      console.log(`\n🔬 Testing: ${operation.name}`);
      console.log(`   ${operation.description}`);
      
      const beforeMemory = process.memoryUsage();
      const startTime = Date.now();
      
      try {
        await operation.testFunction();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        const afterMemory = process.memoryUsage();
        const duration = Date.now() - startTime;
        
        const result = {
          operation: operation.name,
          duration,
          memoryBefore: beforeMemory,
          memoryAfter: afterMemory,
          memoryDelta: {
            rss: afterMemory.rss - beforeMemory.rss,
            heapTotal: afterMemory.heapTotal - beforeMemory.heapTotal,
            heapUsed: afterMemory.heapUsed - beforeMemory.heapUsed,
            external: afterMemory.external - beforeMemory.external
          }
        };
        
        this.results.push(result);
        this.logOperationResult(result);
        
      } catch (error) {
        console.error(`❌ Error in ${operation.name}:`, error.message);
      }
      
      // Wait between operations to allow memory stabilization
      await this.wait(2000);
    }
  }

  /**
   * Test memory usage for organization list operations
   */
  async testOrganizationListMemory() {
    const axios = require('axios');
    const baseURL = 'http://localhost:3000/api';
    
    // Simulate loading multiple pages of organizations
    const requests = [];
    for (let page = 1; page <= 10; page++) {
      requests.push(
        axios.get(`${baseURL}/organizations?page=${page}&limit=50`)
          .catch(err => ({ error: err.message }))
      );
    }
    
    await Promise.all(requests);
  }

  /**
   * Test memory usage for search operations
   */
  async testSearchMemory() {
    const axios = require('axios');
    const baseURL = 'http://localhost:3000/api';
    
    const searchTerms = ['restaurant', 'cafe', 'bistro', 'grill', 'kitchen'];
    const requests = [];
    
    for (const term of searchTerms) {
      // Multiple concurrent searches
      for (let i = 0; i < 5; i++) {
        requests.push(
          axios.get(`${baseURL}/organizations/search?q=${term}&page=${i + 1}`)
            .catch(err => ({ error: err.message }))
        );
      }
    }
    
    await Promise.all(requests);
  }

  /**
   * Test memory usage for report generation
   */
  async testReportGenerationMemory() {
    const axios = require('axios');
    const baseURL = 'http://localhost:3000/api';
    
    const reports = [
      'reports/sales/summary?period=current_month',
      'reports/commission/by-territory?period=current_quarter',
      'reports/interactions/frequency?period=last_month',
      'export/organizations/complete?format=csv'
    ];
    
    // Generate reports sequentially to measure individual impact
    for (const report of reports) {
      await axios.get(`${baseURL}/${report}`)
        .catch(err => ({ error: err.message }));
      await this.wait(1000); // Wait between reports
    }
  }

  /**
   * Test memory usage for bulk data operations
   */
  async testBulkDataMemory() {
    const axios = require('axios');
    const baseURL = 'http://localhost:3000/api';
    
    // Simulate bulk data creation
    const bulkData = Array.from({ length: 100 }, (_, i) => ({
      name: `Test Restaurant ${i}`,
      type: 'CASUAL_DINING',
      priority: 'B',
      contact: `test${i}@restaurant.com`
    }));
    
    await axios.post(`${baseURL}/organizations/bulk`, { organizations: bulkData })
      .catch(err => ({ error: err.message }));
  }

  /**
   * Test memory usage under concurrent API requests
   */
  async testConcurrentAPIMemory() {
    const axios = require('axios');
    const baseURL = 'http://localhost:3000/api';
    
    // Create 20 concurrent requests to different endpoints
    const requests = [];
    for (let i = 0; i < 20; i++) {
      const endpoints = [
        'organizations',
        'contacts',
        'interactions',
        'reports/sales/summary?period=current_month'
      ];
      
      const endpoint = endpoints[i % endpoints.length];
      requests.push(
        axios.get(`${baseURL}/${endpoint}`)
          .catch(err => ({ error: err.message }))
      );
    }
    
    await Promise.all(requests);
  }

  /**
   * Generate memory leak detection report
   */
  async detectMemoryLeaks() {
    console.log('🕵️  Analyzing memory patterns for potential leaks...');
    
    if (this.memorySnapshots.length < 10) {
      console.warn('⚠️  Insufficient memory snapshots for leak detection');
      return;
    }

    // Analyze heap growth patterns
    const heapGrowthTrend = this.analyzeHeapGrowth();
    const suspiciousPatterns = this.findSuspiciousPatterns();
    
    const leakReport = {
      heapGrowthTrend,
      suspiciousPatterns,
      recommendations: this.generateMemoryRecommendations()
    };

    this.saveReport('memory-leak-analysis.json', leakReport);
    console.log('📊 Memory leak analysis saved to memory-leak-analysis.json');
  }

  /**
   * Analyze heap growth patterns
   */
  analyzeHeapGrowth() {
    const samples = this.memorySnapshots.slice(-20); // Last 20 samples
    if (samples.length < 5) return null;

    const heapUsedValues = samples.map(s => s.heapUsed);
    const trend = this.calculateTrend(heapUsedValues);
    
    return {
      avgGrowthPerSecond: trend.slope,
      correlation: trend.correlation,
      isIncreasing: trend.slope > 1024 * 1024, // 1MB/second growth
      totalGrowth: heapUsedValues[heapUsedValues.length - 1] - heapUsedValues[0]
    };
  }

  /**
   * Find suspicious memory patterns
   */
  findSuspiciousPatterns() {
    const patterns = [];
    
    // Check for rapid heap growth
    for (let i = 1; i < this.memorySnapshots.length; i++) {
      const current = this.memorySnapshots[i];
      const previous = this.memorySnapshots[i - 1];
      
      const heapGrowth = current.heapUsed - previous.heapUsed;
      const timeSpan = current.timestamp - previous.timestamp;
      
      if (heapGrowth > 50 * 1024 * 1024) { // 50MB growth in one interval
        patterns.push({
          type: 'rapid_heap_growth',
          timestamp: current.timestamp,
          growth: heapGrowth,
          timeSpan
        });
      }
    }

    // Check for memory not being freed
    const recentSamples = this.memorySnapshots.slice(-10);
    const minHeap = Math.min(...recentSamples.map(s => s.heapUsed));
    const maxHeap = Math.max(...recentSamples.map(s => s.heapUsed));
    
    if ((maxHeap - minHeap) / maxHeap < 0.1) { // Less than 10% variation
      patterns.push({
        type: 'memory_not_freed',
        description: 'Memory usage remains consistently high without significant drops'
      });
    }

    return patterns;
  }

  /**
   * Generate memory optimization recommendations
   */
  generateMemoryRecommendations() {
    const recommendations = [];
    
    // Analyze current memory usage
    const latestSnapshot = this.memorySnapshots[this.memorySnapshots.length - 1];
    if (!latestSnapshot) return recommendations;

    const heapUsedMB = latestSnapshot.heapUsed / (1024 * 1024);
    const rssMB = latestSnapshot.rss / (1024 * 1024);

    if (heapUsedMB > 512) {
      recommendations.push({
        type: 'high_heap_usage',
        message: 'Heap usage is high (>512MB). Consider implementing object pooling or caching strategies.',
        priority: 'high'
      });
    }

    if (rssMB > 1024) {
      recommendations.push({
        type: 'high_rss',
        message: 'RSS usage is high (>1GB). Consider reducing the number of concurrent operations.',
        priority: 'medium'
      });
    }

    // Check for external memory usage
    const externalMB = latestSnapshot.external / (1024 * 1024);
    if (externalMB > 100) {
      recommendations.push({
        type: 'high_external_memory',
        message: 'High external memory usage detected. Check for large Buffer allocations or C++ addons.',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Utility functions
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  calculateTrend(values) {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return { slope, correlation: slope > 0 ? 1 : -1 };
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  logOperationResult(result) {
    console.log(`   ✅ Duration: ${result.duration}ms`);
    console.log(`   📈 Heap Used: ${this.formatBytes(result.memoryDelta.heapUsed)}`);
    console.log(`   💾 RSS: ${this.formatBytes(result.memoryDelta.rss)}`);
  }

  saveReport(filename, data) {
    const reportPath = path.join(__dirname, '../results', filename);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(data, null, 2));
  }

  /**
   * Generate comprehensive memory usage report
   */
  generateReport() {
    const report = {
      testSummary: {
        totalDuration: Date.now() - this.testStartTime,
        operationsTested: this.results.length,
        memorySnapshots: this.memorySnapshots.length
      },
      operationResults: this.results,
      memorySnapshots: this.memorySnapshots.slice(-50), // Last 50 snapshots
      recommendations: this.generateMemoryRecommendations()
    };

    this.saveReport('memory-usage-report.json', report);
    console.log('\n📊 Memory usage report generated: tests/results/memory-usage-report.json');
    
    return report;
  }
}

/**
 * Main execution function
 */
async function runMemoryUsageTests() {
  const tester = new MemoryUsageTest();
  
  console.log('🚀 Starting PantryCRM Memory Usage Testing');
  console.log('=========================================\n');
  
  try {
    // Start memory monitoring
    const monitoringInterval = await tester.monitorConcurrentMemoryUsage();
    
    // Run memory pattern tests
    await tester.testOperationMemoryPatterns();
    
    // Detect potential memory leaks
    await tester.detectMemoryLeaks();
    
    // Generate final report
    const report = tester.generateReport();
    
    // Stop monitoring
    clearInterval(monitoringInterval);
    
    console.log('\n✅ Memory usage testing completed successfully');
    console.log(`📊 Total operations tested: ${report.testSummary.operationsTested}`);
    console.log(`⏱️  Total test duration: ${Math.round(report.testSummary.totalDuration / 1000)}s`);
    
  } catch (error) {
    console.error('❌ Memory usage testing failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runMemoryUsageTests();
}

module.exports = { MemoryUsageTest, runMemoryUsageTests };