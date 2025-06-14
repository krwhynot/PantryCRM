const fetch = require('node-fetch');

module.exports = async function (context, myTimer) {
    // Get timestamp for logging
    const timestamp = new Date().toISOString();
    
    // Log function execution
    context.log('App Ping Function executed at:', timestamp);
    
    // App Service URLs to ping (main app + health endpoint)
    const endpoints = [
        'https://pantry-crm-prod-app.azurewebsites.net',
        'https://pantry-crm-prod-app.azurewebsites.net/api/health'
    ];
    
    // Track results for all pings
    const results = [];
    
    // Ping each endpoint
    for (const endpoint of endpoints) {
        try {
            const startTime = Date.now();
            
            // Add custom headers to identify the source of the request
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Azure-Function-AppPing/1.0',
                    'X-Ping-Source': 'KeepAlive-Service',
                    'Cache-Control': 'no-store'
                },
                timeout: 10000 // 10 second timeout
            });
            
            const duration = Date.now() - startTime;
            
            results.push({
                endpoint,
                status: response.status,
                duration: `${duration}ms`,
                success: response.status >= 200 && response.status < 300
            });
            
            context.log(`Pinged ${endpoint} - Status: ${response.status}, Duration: ${duration}ms`);
            
            // Log warning for slow responses (potential cold start detected)
            if (duration > 3000) {
                context.log.warn(`Slow response detected: ${endpoint} responded in ${duration}ms - potential cold start`);
            }
        } catch (error) {
            context.log.error(`Error pinging ${endpoint}: ${error.message}`);
            
            results.push({
                endpoint,
                status: 'Error',
                errorMessage: error.message,
                success: false
            });
        }
    }
    
    // Log summary
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    if (failed > 0) {
        context.log.warn(`Ping summary: ${successful} successful, ${failed} failed`);
    } else {
        context.log(`Ping summary: All ${successful} endpoints responded successfully`);
    }
    
    // Output results for Azure Monitor
    context.bindings.outputBlob = JSON.stringify({
        timestamp,
        results,
        summary: { successful, failed }
    });
};
