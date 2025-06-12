"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

// Define the context type
interface DeviceContextType {
  isTouchDevice: boolean;
  isTablet: boolean;
  isMobile: boolean;
  isDesktop: boolean;
}

// Create the context with default values
const DeviceContext = createContext<DeviceContextType>({
  isTouchDevice: false,
  isTablet: false,
  isMobile: false,
  isDesktop: true,
});

// Export the hook for consuming the context
export const useDevice = () => useContext(DeviceContext);

// Provider component
export function DeviceProvider({ children }: { children: ReactNode }) {
  const deviceInfo = useDeviceDetection();
  
  // Memoize the context value to prevent unnecessary re-renders of consuming components
  // Only update when the actual device properties change
  const contextValue = useMemo(() => ({
    isTouchDevice: deviceInfo.isTouchDevice,
    isTablet: deviceInfo.isTablet,
    isMobile: deviceInfo.isMobile,
    isDesktop: deviceInfo.isDesktop,
  }), [
    deviceInfo.isTouchDevice,
    deviceInfo.isTablet,
    deviceInfo.isMobile,
    deviceInfo.isDesktop,
  ]);
  
  return (
    <DeviceContext.Provider value={contextValue}>
      {children}
    </DeviceContext.Provider>
  );
}