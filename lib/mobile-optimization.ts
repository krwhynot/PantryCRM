/**
 * Mobile and 3G network optimization utilities
 * 
 * Optimizes page load times to meet <3 seconds on 3G requirement
 * Implements aggressive caching, compression, and resource prioritization
 */

import { logger } from './monitoring';

interface MobileOptimizationConfig {
  enableServiceWorker: boolean;
  enableImageOptimization: boolean;
  enableResourceHints: boolean;
  enableCriticalCSS: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
  maxBundleSize: number; // KB
  prefetchStrategy: 'aggressive' | 'conservative' | 'none';
}

interface NetworkInfo {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

interface ResourcePriority {
  critical: string[];
  important: string[];
  lazy: string[];
}

class MobileOptimizer {
  private config: MobileOptimizationConfig = {
    enableServiceWorker: true,
    enableImageOptimization: true,
    enableResourceHints: true,
    enableCriticalCSS: true,
    compressionLevel: 'high',
    maxBundleSize: 200, // 200KB for 3G optimization
    prefetchStrategy: 'conservative',
  };

  private networkInfo: NetworkInfo | null = null;
  private resourcePriority: ResourcePriority = {
    critical: [
      '/api/auth/session',
      '/css/critical.css',
      '/js/critical.js',
    ],
    important: [
      '/api/organizations',
      '/api/contacts',
      '/css/main.css',
    ],
    lazy: [
      '/api/dashboard/stats',
      '/images/',
      '/js/analytics.js',
    ],
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeNetworkMonitoring();
      this.setupIntersectionObserver();
      this.enableResourceHints();
    }
  }

  /**
   * Initialize network monitoring for adaptive optimization
   */
  private initializeNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      this.networkInfo = {
        effectiveType: connection.effectiveType || '3g',
        downlink: connection.downlink || 1.5,
        rtt: connection.rtt || 300,
        saveData: connection.saveData || false,
      };

      // Listen for network changes
      connection.addEventListener('change', () => {
        this.networkInfo = {
          effectiveType: connection.effectiveType || '3g',
          downlink: connection.downlink || 1.5,
          rtt: connection.rtt || 300,
          saveData: connection.saveData || false,
        };

        logger.info(
          'Network conditions changed',
          'MOBILE_OPTIMIZATION',
          this.networkInfo
        );

        this.adaptToNetworkConditions();
      });

      this.adaptToNetworkConditions();
    }
  }

  /**
   * Adapt optimization strategy based on network conditions
   */
  private adaptToNetworkConditions(): void {
    if (!this.networkInfo) return;

    const { effectiveType, saveData, downlink } = this.networkInfo;

    // Aggressive optimization for slow networks
    if (effectiveType === '2g' || effectiveType === 'slow-2g' || saveData) {
      this.config.compressionLevel = 'high';
      this.config.maxBundleSize = 100; // 100KB for 2G
      this.config.prefetchStrategy = 'none';
      this.enableDataSaverMode();
    } 
    // Moderate optimization for 3G
    else if (effectiveType === '3g' || downlink < 2) {
      this.config.compressionLevel = 'high';
      this.config.maxBundleSize = 200; // 200KB for 3G
      this.config.prefetchStrategy = 'conservative';
    }
    // Standard optimization for 4G+
    else {
      this.config.compressionLevel = 'medium';
      this.config.maxBundleSize = 400; // 400KB for 4G+
      this.config.prefetchStrategy = 'aggressive';
    }

    logger.info(
      'Adapted optimization config for network',
      'MOBILE_OPTIMIZATION',
      { networkInfo: this.networkInfo, config: this.config }
    );
  }

  /**
   * Enable data saver mode for extremely slow connections
   */
  private enableDataSaverMode(): void {
    // Disable non-essential images
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      img.removeAttribute('data-src');
    });

    // Remove non-critical stylesheets
    const nonCriticalCSS = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])');
    nonCriticalCSS.forEach(link => {
      link.remove();
    });

    // Disable animations
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup intersection observer for lazy loading
   */
  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          
          // Lazy load images
          if (element.tagName === 'IMG' && element.dataset.src) {
            const img = element as HTMLImageElement;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
          
          // Lazy load components
          if (element.dataset.component) {
            this.loadComponent(element.dataset.component);
            observer.unobserve(element);
          }
        }
      });
    }, {
      rootMargin: '50px 0px', // Start loading 50px before entering viewport
      threshold: 0.1,
    });

    // Observe all lazy-loadable elements
    document.querySelectorAll('[data-src], [data-component]').forEach(el => {
      observer.observe(el);
    });
  }

  /**
   * Enable resource hints for better 3G performance
   */
  private enableResourceHints(): void {
    if (!this.config.enableResourceHints) return;

    const head = document.head;

    // DNS prefetch for external domains
    const dnsPrefetch = [
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net',
    ];

    dnsPrefetch.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      head.appendChild(link);
    });

    // Preconnect for critical resources
    const preconnect = [
      '/api',
    ];

    preconnect.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      head.appendChild(link);
    });

    // Prefetch critical resources based on strategy
    if (this.config.prefetchStrategy !== 'none') {
      this.prefetchCriticalResources();
    }
  }

  /**
   * Prefetch critical resources based on current strategy
   */
  private prefetchCriticalResources(): void {
    const strategy = this.config.prefetchStrategy;
    let resourcesToPrefetch: string[] = [];

    switch (strategy) {
      case 'aggressive':
        resourcesToPrefetch = [
          ...this.resourcePriority.critical,
          ...this.resourcePriority.important,
        ];
        break;
      case 'conservative':
        resourcesToPrefetch = this.resourcePriority.critical;
        break;
      default:
        return;
    }

    resourcesToPrefetch.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  /**
   * Dynamically load components for code splitting
   */
  private async loadComponent(componentName: string): Promise<void> {
    try {
      const startTime = performance.now();
      
      // Dynamic import with error handling
      const module = await import(`../components/${componentName}`);
      
      const loadTime = performance.now() - startTime;
      
      logger.info(
        `Component loaded: ${componentName} in ${loadTime.toFixed(2)}ms`,
        'MOBILE_OPTIMIZATION',
        { componentName, loadTime }
      );

    } catch (error) {
      logger.error(
        `Failed to load component: ${componentName}`,
        'MOBILE_OPTIMIZATION',
        error
      );
    }
  }

  /**
   * Optimize images for mobile and 3G
   */
  optimizeImage(img: HTMLImageElement): void {
    if (!this.config.enableImageOptimization) return;

    const networkType = this.networkInfo?.effectiveType || '3g';
    
    // Choose appropriate image format and quality based on network
    const src = img.src;
    let optimizedSrc = src;

    if (networkType === '2g' || networkType === 'slow-2g') {
      // Ultra-low quality for 2G
      optimizedSrc = src.replace(/\.(jpg|jpeg|png)/, '_q30.$1');
    } else if (networkType === '3g') {
      // Medium quality for 3G
      optimizedSrc = src.replace(/\.(jpg|jpeg|png)/, '_q60.$1');
    }

    if (optimizedSrc !== src) {
      img.src = optimizedSrc;
    }

    // Add loading="lazy" for modern browsers
    if ('loading' in HTMLImageElement.prototype) {
      img.loading = 'lazy';
    }
  }

  /**
   * Compress and optimize API responses
   */
  optimizeAPIResponse(data: any): any {
    if (!data) return data;

    const networkType = this.networkInfo?.effectiveType || '3g';
    
    // Reduce data for slow networks
    if (networkType === '2g' || networkType === 'slow-2g') {
      return this.compressData(data, 'high');
    } else if (networkType === '3g') {
      return this.compressData(data, 'medium');
    }

    return data;
  }

  /**
   * Compress data by removing non-essential fields
   */
  private compressData(data: any, level: 'low' | 'medium' | 'high'): any {
    if (Array.isArray(data)) {
      return data.map(item => this.compressData(item, level));
    }

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const compressed = { ...data };

    // Remove fields based on compression level
    const fieldsToRemove = {
      low: ['description', 'notes'],
      medium: ['description', 'notes', 'metadata', 'audit'],
      high: ['description', 'notes', 'metadata', 'audit', 'updatedAt', 'createdBy'],
    };

    fieldsToRemove[level].forEach(field => {
      delete compressed[field];
    });

    // Truncate long strings
    Object.keys(compressed).forEach(key => {
      if (typeof compressed[key] === 'string' && compressed[key].length > 100) {
        compressed[key] = compressed[key].substring(0, 100) + '...';
      }
    });

    return compressed;
  }

  /**
   * Performance monitoring for 3G optimization
   */
  measurePageLoad(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.navigationStart;
      
      const metrics = {
        loadTime,
        meetsSLA: loadTime <= 3000, // 3 second SLA for 3G
        networkType: this.networkInfo?.effectiveType || 'unknown',
        connectionSpeed: this.networkInfo?.downlink || 0,
        rtt: this.networkInfo?.rtt || 0,
      };

      logger.info(
        `Page load completed in ${loadTime}ms`,
        'MOBILE_PERFORMANCE',
        metrics
      );

      // Alert if page load is too slow for 3G
      if (loadTime > 3000) {
        logger.warn(
          `Page load exceeded 3s requirement for 3G: ${loadTime}ms`,
          'B1_PERFORMANCE',
          metrics
        );
      }

      // Send to performance monitoring
      this.reportPerformanceMetrics(metrics);
    });
  }

  /**
   * Report performance metrics
   */
  private reportPerformanceMetrics(metrics: any): void {
    // Send to analytics or monitoring service
    if (typeof window !== 'undefined' && 'sendBeacon' in navigator) {
      const data = JSON.stringify({
        type: 'mobile_performance',
        timestamp: Date.now(),
        ...metrics,
      });

      navigator.sendBeacon('/api/analytics/performance', data);
    }
  }

  /**
   * Get current optimization configuration
   */
  getConfig(): MobileOptimizationConfig {
    return { ...this.config };
  }

  /**
   * Update optimization configuration
   */
  updateConfig(updates: Partial<MobileOptimizationConfig>): void {
    this.config = { ...this.config, ...updates };
    
    if (typeof window !== 'undefined') {
      this.adaptToNetworkConditions();
    }
  }

  /**
   * Get network information
   */
  getNetworkInfo(): NetworkInfo | null {
    return this.networkInfo;
  }

  /**
   * Check if device is likely mobile
   */
  isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.networkInfo?.effectiveType === '2g' || this.networkInfo?.effectiveType === 'slow-2g') {
      recommendations.push('Enable aggressive data compression for 2G networks');
      recommendations.push('Reduce image quality and disable animations');
    }
    
    if (this.networkInfo?.effectiveType === '3g') {
      recommendations.push('Optimize bundle size to stay under 200KB for 3G networks');
      recommendations.push('Implement critical CSS inlining');
    }
    
    if (this.networkInfo?.saveData) {
      recommendations.push('User has data saver enabled - minimize data usage');
    }
    
    if (this.networkInfo?.rtt && this.networkInfo.rtt > 500) {
      recommendations.push('High latency detected - implement request batching');
    }

    return recommendations;
  }
}

// Global mobile optimizer instance
const mobileOptimizer = new MobileOptimizer();

// Export utility functions
export function initializeMobileOptimization(): void {
  if (typeof window !== 'undefined') {
    mobileOptimizer.measurePageLoad();
  }
}

export function optimizeImage(img: HTMLImageElement): void {
  mobileOptimizer.optimizeImage(img);
}

export function optimizeAPIResponse(data: any): any {
  return mobileOptimizer.optimizeAPIResponse(data);
}

export function isMobileDevice(): boolean {
  return mobileOptimizer.isMobileDevice();
}

export function getNetworkInfo(): NetworkInfo | null {
  return mobileOptimizer.getNetworkInfo();
}

export function getMobileOptimizationRecommendations(): string[] {
  return mobileOptimizer.getOptimizationRecommendations();
}

// React hook for mobile optimization
export function useMobileOptimization() {
  return {
    networkInfo: mobileOptimizer.getNetworkInfo(),
    config: mobileOptimizer.getConfig(),
    isMobile: mobileOptimizer.isMobileDevice(),
    recommendations: mobileOptimizer.getOptimizationRecommendations(),
    updateConfig: (updates: Partial<MobileOptimizationConfig>) => 
      mobileOptimizer.updateConfig(updates),
  };
}

export { mobileOptimizer, type MobileOptimizationConfig, type NetworkInfo };