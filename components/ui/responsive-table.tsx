"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useDevice } from "@/app/providers/DeviceProvider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLTableElement> {
  headers: string[];
  data: any[][];
  onRowClick?: (index: number) => void;
}

/**
 * ResponsiveTable component that adapts to both touch and mouse interfaces
 * Automatically adjusts row height, padding, and spacing based on device
 * @param props ResponsiveTableProps
 */
const ResponsiveTable = React.forwardRef<HTMLTableElement, ResponsiveTableProps>(
  ({ className, headers, data, onRowClick, ...props }, ref) => {
    const { isTouchDevice } = useDevice();
    
    return (
      <div className={cn("w-full overflow-auto", className)}>
        <Table ref={ref} {...props}>
          <TableHeader>
            <TableRow className={isTouchDevice ? "h-14" : ""}>
              {headers.map((header, index) => (
                <TableHead 
                  key={index} 
                  className={isTouchDevice ? "text-base py-4 px-4" : ""}
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow 
                key={rowIndex} 
                className={cn(
                  isTouchDevice ? "h-16 touch-target" : "",
                  onRowClick ? "cursor-pointer hover:bg-muted/50" : ""
                )}
                onClick={() => onRowClick && onRowClick(rowIndex)}
                data-touch-device={isTouchDevice}
              >
                {row.map((cell, cellIndex) => (
                  <TableCell 
                    key={cellIndex}
                    className={isTouchDevice ? "py-4 px-4 text-base" : ""}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
);

ResponsiveTable.displayName = "ResponsiveTable";

export { ResponsiveTable };