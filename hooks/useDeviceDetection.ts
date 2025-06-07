import { useState, useEffect } from 'react';

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

    const detectDevice = () => {
      // Touch capability detection
      const hasTouchCapability = 
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 || 
        (navigator as any).msMaxTouchPoints > 0;
      
      // Screen size detection
      const width = window.innerWidth;
      const isTablet = width >= 768 && width <= 1024;
      const isMobile = width < 768;
      const isDesktop = width > 1024;

      setDeviceInfo({
        isTouchDevice: hasTouchCapability,
        isTablet,
        isMobile,
        isDesktop,
      });
      
      // Add appropriate class to body
      document.body.classList.remove('touch-device', 'mouse-device', 'mobile', 'tablet', 'desktop');
      
      if (hasTouchCapability) {
        document.body.classList.add('touch-device');
      } else {
        document.body.classList.add('mouse-device');
      }
      
      if (isTablet) document.body.classList.add('tablet');
      if (isMobile) document.body.classList.add('mobile');
      if (isDesktop) document.body.classList.add('desktop');
    };

    // Initial detection
    detectDevice();
    
    // Re-detect on resize
    window.addEventListener('resize', detectDevice);
    
    return () => {
      window.removeEventListener('resize', detectDevice);
    };
  }, []);

  return deviceInfo;
}