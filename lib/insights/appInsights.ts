import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { createBrowserHistory } from 'history';

const browserHistory = createBrowserHistory();
const reactPlugin = new ReactPlugin();

// Initialize Application Insights with sampling and hydration monitoring
const appInsights = new ApplicationInsights({
  config: {
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || '',
    enableAutoRouteTracking: true, // Track route changes
    enableCorsCorrelation: true, // Enable cross-origin correlation
    enableRequestHeaderTracking: true, // Track request headers
    enableResponseHeaderTracking: true, // Track response headers
    samplingPercentage: parseInt(process.env.APPLICATIONINSIGHTS_SAMPLING_PERCENTAGE || '10', 10),
    extensions: [reactPlugin],
    extensionConfig: {
      [reactPlugin.identifier]: { 
        history: browserHistory,
        enableDebug: process.env.NODE_ENV !== 'production'
      }
    },
    // Azure B1 tier optimization: disable features that may cause overhead
    disablePageUnloadEvents: true,
    disablePageShowEvents: true,
    disableAjaxTracking: false, // Keep API call tracking
    disableFetchTracking: false, // Keep fetch tracking
    maxBatchInterval: 5000, // Send telemetry every 5 seconds in batches
    disableExceptionTracking: false, // Keep exception tracking
  },
});

// Only initialize in browser environment to avoid SSR issues
const initializeAppInsights = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    appInsights.loadAppInsights();
    
    // Track initial pageview
    appInsights.trackPageView();
    
    // Add custom hydration metrics tracking for React 19
    addHydrationMetricsTracking();
    
    return true;
  }
  return false;
};

// Track React 19 hydration performance
const addHydrationMetricsTracking = () => {
  if (typeof window === 'undefined' || !process.env.NEXT_METRICS_HYDRATION) {
    return;
  }
  
  // Use PerformanceObserver to track React 19 hydration metrics
  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Filter for React hydration metrics
        if (entry.name.includes('hydration') || entry.name.includes('react-render')) {
          console.debug(`[AppInsights] React metric: ${entry.name} - ${entry.duration}ms`);
          
          // Track as custom metric
          appInsights.trackMetric({
            name: `React.${entry.name}`,
            average: entry.duration,
            sampleCount: 1
          });
        }
      });
    });
    
    // Observe React 19 specific performance marks
    observer.observe({ 
      entryTypes: ['measure', 'mark'],
      buffered: true 
    });
    
    // Track time to hydration metrics using web vitals
    if ('web-vitals' in window) {
      import('web-vitals').then(({ getFID, getLCP, getCLS, getFCP, getTTFB }) => {
        getFID((metric) => trackVitalMetric('FID', metric));
        getLCP((metric) => trackVitalMetric('LCP', metric));
        getCLS((metric) => trackVitalMetric('CLS', metric));
        getFCP((metric) => trackVitalMetric('FCP', metric));
        getTTFB((metric) => trackVitalMetric('TTFB', metric));
      });
    }
  } catch (e) {
    console.warn('[AppInsights] Error setting up hydration metrics tracking:', e);
  }
};

// Helper to track web vitals
const trackVitalMetric = (name: string, metric: any) => {
  appInsights.trackMetric({
    name: `WebVitals.${name}`,
    average: name === 'CLS' ? metric.value * 1000 : metric.value, // Convert CLS to milliseconds for consistency
    sampleCount: 1
  });
  
  // Track as custom property too
  appInsights.trackEvent({
    name: 'WebVitalsMetric',
    properties: {
      metricName: name,
      value: metric.value,
      id: metric.id
    }
  });
};

export { reactPlugin, appInsights, initializeAppInsights };
