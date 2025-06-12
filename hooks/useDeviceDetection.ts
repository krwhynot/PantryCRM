import { useState, useEffect, useCallback } from 'react';

interface DeviceInfo {
  isTouchDevice: boolean;
  isTablet: boolean;
  isMobile: boolean;
  isDesktop: boolean;
}

/**
 * Hook to detect device type and capabilities
 * @returns DeviceInfo object with device type flags
 */
export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isTouchDevice: false,
    isTablet: false,
    isMobile: false,
    isDesktop: true,
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const detectDevice = useCallback(() => {
      // Touch capability detection with proper type checking
      const hasTouchCapability = 
        'ontouchstart' in window || 
        (navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 0) || 
        (typeof (navigator as any).msMaxTouchPoints === 'number' && (navigator as any).msMaxTouchPoints > 0);
      
      // Screen size detection
      const width = window.innerWidth;
      const isTablet = width >= 768 && width <= 1024;
      const isMobile = width < 768;
      const isDesktop = width > 1024;

      // Only update state if values have actually changed to prevent unnecessary re-renders
      setDeviceInfo((prevState) => {
        if (
          prevState.isTouchDevice === hasTouchCapability &&
          prevState.isTablet === isTablet &&
          prevState.isMobile === isMobile &&
          prevState.isDesktop === isDesktop
        ) {
          return prevState; // No change, return same reference
        }

        // Update body classes only when device info changes and DOM is available
        if (typeof document !== 'undefined' && document.body) {
          // Remove all device classes first
          document.body.classList.remove('touch-device', 'mouse-device', 'mobile', 'tablet', 'desktop');
          
          // Add appropriate classes
          if (hasTouchCapability) {
            document.body.classList.add('touch-device');
          } else {
            document.body.classList.add('mouse-device');
          }
          
          if (isTablet) document.body.classList.add('tablet');
          if (isMobile) document.body.classList.add('mobile');
          if (isDesktop) document.body.classList.add('desktop');
        }

        return {
          isTouchDevice: hasTouchCapability,
          isTablet,
          isMobile,
          isDesktop,
        };
      });
    }, []);

    // Debounce resize events to improve performance
    let timeoutId: NodeJS.Timeout;
    const debouncedDetectDevice = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(detectDevice, 150);
    };

    // Initial detection
    detectDevice();
    
    // Re-detect on resize with debouncing
    window.addEventListener('resize', debouncedDetectDevice);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedDetectDevice);
    };
  }, []);

  return deviceInfo;
}