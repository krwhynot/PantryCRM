#!/usr/bin/env node

/**
 * PantryCRM Performance Testing Suite Runner
 * Executes all performance tests in sequence and generates comprehensive reports
 * 
 * Based on Artillery and Node.js performance testing best practices
 * 
 * Usage:
 *   node run-all-performance-tests.js [options]
 *   
 * Options:
 *   --skip-memory    Skip memory usage testing
 *   --skip-load      Skip load testing  
 *   --skip-search    Skip search performance testing
 *   --skip-reports   Skip report generation testing
 *   --output-dir     Specify output directory for results
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { program } = require('commander');

class PerformanceTestRunner {
  constructor(options = {}) {
    this.options = {
      skipMemory: false,
      skipLoad: false,
      skipSearch: false,
      skipReports: false,
      outputDir: './tests/results',
      ...options
    };
    
    this.results = {
      startTime: new Date(),
      tests: [],
      summary: {}
    };
    
    this.setupOutputDirectory();
  }

  setupOutputDirectory() {
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  async runAllTests() {
    console.log('🚀 Starting PantryCRM Performance Testing Suite');
    console.log('=============================================\n');
    
    const testSuite = [
      {
        name: 'Load Testing (4 Concurrent Users)',
        command: 'artillery',
        args: ['run', 'tests/performance/load-testing-4-users.yml'],
        enabled: !this.options.skipLoad,
        timeout: 300000 // 5 minutes
      },
      {
        name: 'Search Performance Testing',
        command: 'artillery',
        args: ['run', 'tests/performance/search-performance-test.yml'],
        enabled: !this.options.skipSearch,
        timeout: 240000 // 4 minutes
      },
      {
        name: 'Report Generation Testing',
        command: 'artillery',
        args: ['run', 'tests/performance/report-generation-test.yml'],
        enabled: !this.options.skipReports,
        timeout: 600000 // 10 minutes
      },
      {
        name: 'Memory Usage Pattern Testing',
        command: 'node',
        args: ['tests/performance/memory-usage-test.js'],
        enabled: !this.options.skipMemory,
        timeout: 300000 // 5 minutes
      }
    ];

    for (const test of testSuite) {
      if (!test.enabled) {
        console.log(`⏭️  Skipping: ${test.name}`);
        continue;
      }

      try {
        console.log(`\n🧪 Running: ${test.name}`);
        console.log(`   Command: ${test.command} ${test.args.join(' ')}`);
        
        const result = await this.runTest(test);
        this.results.tests.push(result);
        
        if (result.success) {
          console.log(`   ✅ Completed in ${result.duration}ms`);
        } else {
          console.log(`   ❌ Failed: ${result.error}`);
        }
        
      } catch (error) {
        console.error(`❌ Error running ${test.name}:`, error.message);
        this.results.tests.push({
          name: test.name,
          success: false,
          error: error.message,
          duration: 0
        });
      }
    }

    await this.generateComprehensiveReport();
    this.printSummary();
  }

  async runTest(test) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Set environment variables for consistent testing
      const env = {
        ...process.env,
        NODE_ENV: 'test',
        PERFORMANCE_TEST: 'true'
      };

      const childProcess = spawn(test.command, test.args, { 
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        
        // Show real-time output for important metrics
        if (output.includes('rps:') || output.includes('response time:') || output.includes('Memory:')) {
          process.stdout.write(`   📊 ${output.trim()}\n`);
        }
      });

      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      childProcess.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        if (code === 0) {
          resolve({
            name: test.name,
            success: true,
            duration,
            stdout,
            stderr,
            metrics: this.parseTestMetrics(stdout, test.name)
          });
        } else {
          resolve({
            name: test.name,
            success: false,
            duration,
            error: `Process exited with code ${code}`,
            stdout,
            stderr
          });
        }
      });

      childProcess.on('error', (error) => {
        reject(error);
      });

      // Set timeout
      setTimeout(() => {
        childProcess.kill('SIGTERM');
        reject(new Error(`Test timed out after ${test.timeout}ms`));
      }, test.timeout);
    });
  }

  parseTestMetrics(stdout, testName) {
    const metrics = {};

    try {
      if (testName.includes('Load Testing')) {
        // Parse Artillery load test metrics
        const rpsMatch = stdout.match(/http\.requests:\s+(\d+)/);
        const responseTimeMatch = stdout.match(/http\.response_time:\s+min=(\d+\.?\d*)\s+max=(\d+\.?\d*)\s+median=(\d+\.?\d*)\s+p95=(\d+\.?\d*)\s+p99=(\d+\.?\d*)/);
        
        if (rpsMatch) metrics.requestsPerSecond = parseInt(rpsMatch[1]);
        if (responseTimeMatch) {
          metrics.responseTime = {
            min: parseFloat(responseTimeMatch[1]),
            max: parseFloat(responseTimeMatch[2]),
            median: parseFloat(responseTimeMatch[3]),
            p95: parseFloat(responseTimeMatch[4]),
            p99: parseFloat(responseTimeMatch[5])
          };
        }
      }

      if (testName.includes('Memory')) {
        // Parse memory usage metrics
        const heapMatch = stdout.match(/Heap Used:\s+([0-9.]+\s+[A-Z]+)/);
        const rssMatch = stdout.match(/RSS:\s+([0-9.]+\s+[A-Z]+)/);
        
        if (heapMatch) metrics.heapUsed = heapMatch[1];
        if (rssMatch) metrics.rss = rssMatch[1];
      }

    } catch (error) {
      console.warn(`⚠️  Could not parse metrics for ${testName}:`, error.message);
    }

    return metrics;
  }

  async generateComprehensiveReport() {
    console.log('\n📊 Generating comprehensive performance report...');
    
    const report = {
      testSuite: 'PantryCRM Performance Testing',
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.results.startTime.getTime(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpus: require('os').cpus().length,
        totalMemory: require('os').totalmem(),
        freeMemory: require('os').freemem()
      },
      testResults: this.results.tests,
      summary: this.generateSummary(),
      recommendations: this.generateRecommendations()
    };

    // Save main report
    const reportPath = path.join(this.options.outputDir, 'performance-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    await this.generateHTMLReport(report);
    
    console.log(`   📄 JSON report: ${reportPath}`);
    console.log(`   🌐 HTML report: ${reportPath.replace('.json', '.html')}`);
  }

  generateSummary() {
    const totalTests = this.results.tests.length;
    const passedTests = this.results.tests.filter(t => t.success).length;
    const failedTests = totalTests - passedTests;
    
    const avgDuration = this.results.tests.reduce((sum, test) => sum + test.duration, 0) / totalTests;
    
    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: ((passedTests / totalTests) * 100).toFixed(1),
      averageDuration: Math.round(avgDuration),
      totalDuration: Date.now() - this.results.startTime.getTime()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Analyze test results for recommendations
    const loadTest = this.results.tests.find(t => t.name.includes('Load Testing'));
    if (loadTest && loadTest.success && loadTest.metrics) {
      if (loadTest.metrics.responseTime && loadTest.metrics.responseTime.p95 > 2000) {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          message: 'P95 response time exceeds 2 seconds. Consider optimizing database queries and API endpoints.',
          metric: `P95: ${loadTest.metrics.responseTime.p95}ms`
        });
      }
      
      if (loadTest.metrics.requestsPerSecond && loadTest.metrics.requestsPerSecond < 100) {
        recommendations.push({
          type: 'throughput',
          priority: 'medium',
          message: 'Request throughput is below optimal levels. Consider implementing connection pooling and caching.',
          metric: `RPS: ${loadTest.metrics.requestsPerSecond}`
        });
      }
    }

    const memoryTest = this.results.tests.find(t => t.name.includes('Memory'));
    if (memoryTest && memoryTest.success) {
      recommendations.push({
        type: 'memory',
        priority: 'low',
        message: 'Monitor memory usage patterns for potential leaks during extended operations.',
        metric: 'See memory usage report for details'
      });
    }

    // Add food service specific recommendations
    recommendations.push({
      type: 'food_service',
      priority: 'medium',
      message: 'For field operations, ensure mobile endpoints have <1s response time for offline-first experience.',
      metric: 'Mobile performance critical for food brokers'
    });

    return recommendations;
  }

  async generateHTMLReport(report) {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PantryCRM Performance Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e1e5e9; padding-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; }
        .metric-label { font-size: 0.9em; opacity: 0.9; }
        .test-results { margin-bottom: 30px; }
        .test-item { border: 1px solid #e1e5e9; border-radius: 6px; margin-bottom: 15px; overflow: hidden; }
        .test-header { background: #f8f9fa; padding: 15px; font-weight: 600; }
        .test-success { border-left: 4px solid #28a745; }
        .test-failure { border-left: 4px solid #dc3545; }
        .test-details { padding: 15px; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; }
        .recommendation { margin-bottom: 10px; padding: 10px; border-left: 3px solid #f39c12; background: white; }
        .high-priority { border-left-color: #e74c3c; }
        .medium-priority { border-left-color: #f39c12; }
        .low-priority { border-left-color: #27ae60; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🍽️ PantryCRM Performance Test Report</h1>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="metric-card">
                <div class="metric-value">${report.summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.summary.successRate}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(report.summary.totalDuration / 1000)}s</div>
                <div class="metric-label">Total Duration</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(report.summary.averageDuration / 1000)}s</div>
                <div class="metric-label">Avg Test Duration</div>
            </div>
        </div>

        <div class="test-results">
            <h2>📋 Test Results</h2>
            ${report.testResults.map(test => `
                <div class="test-item ${test.success ? 'test-success' : 'test-failure'}">
                    <div class="test-header">
                        ${test.success ? '✅' : '❌'} ${test.name}
                    </div>
                    <div class="test-details">
                        <p><strong>Duration:</strong> ${Math.round(test.duration / 1000)}s</p>
                        ${test.metrics ? `<p><strong>Metrics:</strong> ${JSON.stringify(test.metrics, null, 2)}</p>` : ''}
                        ${test.error ? `<p><strong>Error:</strong> ${test.error}</p>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="recommendations">
            <h2>💡 Recommendations</h2>
            ${report.recommendations.map(rec => `
                <div class="recommendation ${rec.priority}-priority">
                    <strong>[${rec.priority.toUpperCase()}] ${rec.type.toUpperCase()}:</strong> ${rec.message}
                    <br><small>📊 ${rec.metric}</small>
                </div>
            `).join('')}
        </div>

        <div style="margin-top: 30px; text-align: center; color: #666;">
            <p>Environment: Node.js ${report.environment.nodeVersion} | ${report.environment.platform} | ${report.environment.cpus} CPUs</p>
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(this.options.outputDir, 'performance-test-report.html');
    fs.writeFileSync(htmlPath, htmlTemplate);
  }

  printSummary() {
    const summary = this.generateSummary();
    
    console.log('\n📈 Performance Testing Summary');
    console.log('============================');
    console.log(`Tests Run:     ${summary.totalTests}`);
    console.log(`Passed:        ${summary.passedTests} ✅`);
    console.log(`Failed:        ${summary.failedTests} ❌`);
    console.log(`Success Rate:  ${summary.successRate}%`);
    console.log(`Total Time:    ${Math.round(summary.totalDuration / 1000)}s`);
    console.log(`Avg Test Time: ${Math.round(summary.averageDuration / 1000)}s`);
    
    if (summary.failedTests > 0) {
      console.log('\n⚠️  Failed Tests:');
      this.results.tests
        .filter(t => !t.success)
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.error}`);
        });
    }
    
    console.log(`\n📊 Reports saved to: ${this.options.outputDir}`);
    console.log('\n🎉 Performance testing completed!');
  }
}

// CLI Setup
program
  .name('performance-test-runner')
  .description('Run PantryCRM performance testing suite')
  .option('--skip-memory', 'Skip memory usage testing')
  .option('--skip-load', 'Skip load testing')
  .option('--skip-search', 'Skip search performance testing')
  .option('--skip-reports', 'Skip report generation testing')
  .option('--output-dir <path>', 'Output directory for results', './tests/results')
  .parse();

// Run tests if this file is executed directly
if (require.main === module) {
  const options = program.opts();
  const runner = new PerformanceTestRunner(options);
  
  runner.runAllTests().catch(error => {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  });
}

module.exports = { PerformanceTestRunner };