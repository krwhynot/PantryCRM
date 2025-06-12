"use client";
import * as React from "react";
const { memo, useMemo } = React;

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDevice } from "@/app/providers/DeviceProvider";

import {
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getFilteredRowModel,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  search: string;
}

export const DataTable = memo(<TData, TValue>({
  columns,
  data,
  search,
}: DataTableProps<TData, TValue>) => {
  const { isTouchDevice } = useDevice();
  //This is for filtering the columns
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  //This is for hiding the columns
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    //For pagination
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    //For filtering
    getFilteredRowModel: getFilteredRowModel(),
    //For visibility
    onColumnVisibilityChange: setColumnVisibility,

    state: {
      columnFilters,
      columnVisibility,
    },
  });

  // Memoize conditional class names to prevent inline object creation
  const touchRowClass = useMemo(() => 
    isTouchDevice ? "h-16 touch-target" : "", 
    [isTouchDevice]
  );

  const touchCellClass = useMemo(() => 
    isTouchDevice ? "py-4 px-4" : "", 
    [isTouchDevice]
  );

  const touchButtonClass = useMemo(() => 
    isTouchDevice ? "button-touch" : "", 
    [isTouchDevice]
  );

  const touchButtonSize = useMemo(() => 
    isTouchDevice ? "default" as const : "sm" as const, 
    [isTouchDevice]
  );

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Search in Titles ..."
          value={(table.getColumn(search)?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn(search)?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        {/* Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {useMemo(() => 
              table
                .getAllColumns()
                .filter((column) => column.getCanHide()),
              [table]
            ).map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Visibility */}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={touchRowClass}
                  data-touch-device={isTouchDevice}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      className={touchCellClass}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-4 py-4">
        <Button
          variant="outline"
          size={touchButtonSize}
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className={touchButtonClass}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size={touchButtonSize}
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className={touchButtonClass}
        >
          Next
        </Button>
      </div>
    </div>
  );
}) as <TData, TValue>(props: DataTableProps<TData, TValue>) => JSX.Element;

// Add display name for React Developer Tools
DataTable.displayName = 'DataTable';
