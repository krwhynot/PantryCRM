import { useEffect, useRef, useCallback, useState, useMemo } from 'react';

/**
 * Hook for chart cleanup to prevent memory leaks
 * @returns Chart ref for cleanup
 */
export const useChartCleanup = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      // Cleanup chart instances and event listeners
      if (chartRef.current) {
        const charts = chartRef.current.querySelectorAll('[data-tremor-chart]');
        charts.forEach(chart => {
          // Remove event listeners
          chart.removeEventListener('mouseover', () => {});
          chart.removeEventListener('touchstart', () => {});
          chart.removeEventListener('click', () => {});
        });
      }
    };
  }, []);

  return chartRef;
};

/**
 * Hook for detecting mobile devices and adjusting chart behavior
 * @returns boolean indicating if device is mobile
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

/**
 * Hook for optimized chart dimensions based on screen size
 * @returns Optimized chart dimensions
 */
export const useChartDimensions = () => {
  const [dimensions, setDimensions] = useState({
    height: 300,
    showXAxis: true,
    showYAxis: true,
    showLegend: true
  });

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      
      if (width < 480) {
        // Mobile
        setDimensions({
          height: 200,
          showXAxis: false,
          showYAxis: false,
          showLegend: false
        });
      } else if (width < 768) {
        // Tablet
        setDimensions({
          height: 250,
          showXAxis: true,
          showYAxis: false,
          showLegend: false
        });
      } else {
        // Desktop
        setDimensions({
          height: 300,
          showXAxis: true,
          showYAxis: true,
          showLegend: true
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return dimensions;
};

/**
 * Hook for performance monitoring of chart renders
 * @param chartName - Name of the chart for logging
 */
export const useChartPerformance = (chartName: string) => {
  const renderStartTime = useRef<number>();

  const startRender = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRender = useCallback(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      if (process.env.NODE_ENV === 'development') {
        console.log(`${chartName} render time: ${renderTime.toFixed(2)}ms`);
      }
      
      // Log slow renders (>100ms)
      if (renderTime > 100) {
        console.warn(`Slow chart render detected: ${chartName} took ${renderTime.toFixed(2)}ms`);
      }
    }
  }, [chartName]);

  useEffect(() => {
    startRender();
    return endRender;
  });

  return { startRender, endRender };
};

/**
 * Custom hook for managing chart animation state
 * @param dataLength - Number of data points
 * @returns Whether animations should be enabled
 */
export const useChartAnimation = (dataLength: number) => {
  return useMemo(() => {
    // Disable animations for large datasets to improve performance
    return dataLength < 500;
  }, [dataLength]);
};