"use client";

import React, { createContext, useContext, ReactNode } from 'react';
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
  
  return (
    <DeviceContext.Provider value={deviceInfo}>
      {children}
    </DeviceContext.Provider>
  );
}