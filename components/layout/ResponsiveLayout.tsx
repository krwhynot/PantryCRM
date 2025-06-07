import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Optional padding for touch devices (default: "p-4 md:p-6")
   */
  touchPadding?: string;
  /**
   * Optional spacing between child elements (default: "space-y-6")
   */
  spacing?: string;
  /**
   * Optional max width for the container (default: "max-w-7xl")
   */
  maxWidth?: string;
}

/**
 * ResponsiveLayout component that adapts to both touch and mouse interfaces
 * Automatically detects touch capability and adjusts spacing, padding, and interactive elements
 */
const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className,
  touchPadding = "p-4 md:p-6",
  spacing = "space-y-6",
  maxWidth = "max-w-7xl",
}) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch capability on mount
  useEffect(() => {
    const hasTouchCapability = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      (navigator as any).msMaxTouchPoints > 0;
    
    setIsTouchDevice(hasTouchCapability);
    
    // Add touch class to body for global CSS targeting
    if (hasTouchCapability) {
      document.body.classList.add('touch-device');
    } else {
      document.body.classList.add('mouse-device');
    }
    
    return () => {
      document.body.classList.remove('touch-device', 'mouse-device');
    };
  }, []);

  return (
    <div
      className={cn(
        "w-full mx-auto",
        maxWidth,
        touchPadding,
        spacing,
        isTouchDevice ? "touch-layout" : "mouse-layout",
        className
      )}
      data-touch-device={isTouchDevice}
    >
      {children}
    </div>
  );
};

export default ResponsiveLayout;