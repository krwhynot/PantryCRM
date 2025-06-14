import { useEffect, useState } from 'react';
import { reactPlugin, appInsights, initializeAppInsights } from './appInsights';
import { useAppInsightsContext, useTrackEvent, useTrackMetric } from '@microsoft/applicationinsights-react-js';

/**
 * Custom React hook for Azure Application Insights in PantryCRM
 * Optimized for React 19 and Azure B1 tier performance constraints
 * 
 * @returns Object containing tracking functions and initialized status
 */
export const useAppInsights = () => {
  const [initialized, setInitialized] = useState(false);
  const appInsightsContext = useAppInsightsContext(reactPlugin);
  const trackEvent = useTrackEvent(appInsightsContext);
  const trackMetric = useTrackMetric(appInsightsContext);
  
  useEffect(() => {
    if (!initialized) {
      const init = initializeAppInsights();
      setInitialized(init);
    }
  }, [initialized]);
  
  /**
   * Track React component render time
   * @param componentName Name of the component
   * @param startTime Performance mark start time
   */
  const trackComponentRender = (componentName: string, startTime: number = performance.now()) => {
    if (!initialized || typeof window === 'undefined') return;
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    trackMetric({ name: `Component.${componentName}.RenderTime`, average: duration });
    
    // For critical components, add more detailed tracking
    if (componentName.includes('DataGrid') || 
        componentName.includes('Chart') || 
        componentName.includes('Dashboard')) {
      appInsights.trackMetric({
        name: `CriticalComponent.${componentName}`,
        average: duration,
        sampleCount: 1,
        properties: {
          timestamp: new Date().toISOString(),
          phase: 'render'
        }
      });
    }
    
    return duration;
  };
  
  /**
   * Track React 19 hydration metrics for a component
   * @param componentName Component name for identification
   */
  const trackHydration = (componentName: string) => {
    if (!initialized || typeof window === 'undefined' || !process.env.NEXT_METRICS_HYDRATION) return;
    
    const markName = `hydration-${componentName}`;
    const measureName = `hydration-duration-${componentName}`;
    
    try {
      // Create performance marks and measures for the component hydration
      performance.mark(`${markName}-start`);
      
      // Use requestAnimationFrame to capture after hydration completes
      requestAnimationFrame(() => {
        performance.mark(`${markName}-end`);
        performance.measure(measureName, `${markName}-start`, `${markName}-end`);
        
        const entries = performance.getEntriesByName(measureName);
        if (entries.length > 0) {
          const duration = entries[0].duration;
          
          if (duration > 100) {
            // Report slow hydration
            console.debug(`[AppInsights] Slow hydration detected in ${componentName}: ${duration}ms`);
          }
          
          trackMetric({
            name: `Hydration.${componentName}`,
            average: duration
          });
        }
        
        // Clean up performance entries to avoid memory leaks
        performance.clearMarks(`${markName}-start`);
        performance.clearMarks(`${markName}-end`);
        performance.clearMeasures(measureName);
      });
    } catch (e) {
      console.warn(`[AppInsights] Error tracking hydration for ${componentName}:`, e);
    }
  };
  
  /**
   * Track data operation performance (API calls, database interactions)
   * Optimized for Azure B1 tier by batching telemetry
   */
  const trackDataOperation = (
    operationName: string, 
    startTime: number, 
    success: boolean, 
    rowCount?: number,
    properties?: Record<string, any>
  ) => {
    if (!initialized) return;
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // For B1 tier, only track operations taking over 100ms to reduce telemetry volume
    if (duration < 100 && process.env.NODE_ENV === 'production') {
      return duration;
    }
    
    trackEvent({
      name: 'DataOperation',
      properties: {
        operationName,
        durationMs: duration,
        success,
        rowCount: rowCount || 0,
        timestamp: new Date().toISOString(),
        ...properties
      }
    });
    
    // Track DTU-intensive operations separately for correlation with SQL alerts
    if (duration > 500 && operationName.includes('Query')) {
      trackMetric({
        name: 'DTU.IntensiveOperation',
        average: duration,
        properties: {
          operation: operationName,
          rowCount: rowCount || 0
        }
      });
    }
    
    return duration;
  };
  
  /**
   * Track user interactions with timestamps
   * Useful for workflow optimizations and usability studies
   */
  const trackUserAction = (
    action: string,
    target: string,
    properties?: Record<string, any>
  ) => {
    if (!initialized) return;
    
    trackEvent({
      name: 'UserAction',
      properties: {
        action,
        target,
        timestamp: new Date().toISOString(),
        ...properties
      }
    });
  };
  
  return {
    initialized,
    trackEvent,
    trackMetric,
    trackComponentRender,
    trackHydration,
    trackDataOperation,
    trackUserAction,
    appInsights: initialized ? appInsights : null
  };
};
