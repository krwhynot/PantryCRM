"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useDevice } from "@/app/providers/DeviceProvider";

interface ResponsiveFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  spacing?: "default" | "compact" | "relaxed";
  children: React.ReactNode;
}

/**
 * ResponsiveForm component that adapts to both touch and mouse interfaces
 * Automatically adjusts spacing between form elements based on device
 */
const ResponsiveForm = React.forwardRef<HTMLFormElement, ResponsiveFormProps>(
  ({ className, spacing = "default", children, ...props }, ref) => {
    const { isTouchDevice, isTablet } = useDevice();
    
    // Determine spacing class based on device and specified spacing
    const getSpacingClass = () => {
      if (spacing === "compact") {
        return isTouchDevice ? "space-y-4" : "space-y-3";
      }
      if (spacing === "relaxed") {
        return isTouchDevice ? "space-y-6" : "space-y-5";
      }
      // Default spacing
      return isTouchDevice ? "space-y-5" : "space-y-4";
    };
    
    return (
      <form
        ref={ref}
        className={cn(
          getSpacingClass(),
          "form-spacing",
          isTouchDevice && "touch-form",
          isTablet && "tablet-form",
          className
        )}
        {...props}
      >
        {children}
      </form>
    );
  }
);

ResponsiveForm.displayName = "ResponsiveForm";

export { ResponsiveForm };