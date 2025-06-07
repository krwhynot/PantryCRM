"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useDevice } from "@/app/providers/DeviceProvider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ResponsiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  interactive?: boolean;
  children?: React.ReactNode;
}

/**
 * ResponsiveCard component that adapts to both touch and mouse interfaces
 * Automatically adjusts padding, spacing, and interactive elements based on device
 * @param props ResponsiveCardProps
 */
const ResponsiveCard = React.forwardRef<HTMLDivElement, ResponsiveCardProps>(
  ({ className, title, description, footer, interactive = false, children, ...props }, ref) => {
    const { isTouchDevice } = useDevice();
    
    return (
      <Card
        ref={ref}
        className={cn(
          interactive && "transition-all hover:shadow-md",
          isTouchDevice && interactive && "card-touch",
          isTouchDevice && "p-4",
          !isTouchDevice && "p-3",
          className
        )}
        {...props}
      >
        {(title || description) && (
          <CardHeader className={cn(isTouchDevice && "pb-4", !isTouchDevice && "pb-3")}>
            {title && <CardTitle className={cn(isTouchDevice && "text-xl", !isTouchDevice && "text-lg")}>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className={cn(isTouchDevice && "py-3", !isTouchDevice && "py-2")}>
          {children}
        </CardContent>
        {footer && (
          <CardFooter className={cn(isTouchDevice && "pt-4", !isTouchDevice && "pt-3")}>
            {footer}
          </CardFooter>
        )}
      </Card>
    );
  }
);

ResponsiveCard.displayName = "ResponsiveCard";

export { ResponsiveCard };