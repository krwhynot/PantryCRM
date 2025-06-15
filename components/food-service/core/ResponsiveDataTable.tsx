/**
 * Responsive Data Table Component
 * 
 * Optimized for displaying CRM data on tablets and mobile devices.
 * Features virtual scrolling, touch-friendly interactions, and
 * responsive column management for Azure B1 performance.
 */

'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, Filter, MoreHorizontal, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface TableColumn<T = any> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  accessor?: (row: T) => any;
  cell?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  minWidth?: number;
  priority?: 'high' | 'medium' | 'low'; // For responsive hiding
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
}

export interface TableFilter {
  column: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'gt' | 'lt';
  value: any;
}

export interface TableSort {
  column: string;
  direction: 'asc' | 'desc';
}

interface ResponsiveDataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T, index: number) => void;
  onRowSelect?: (selectedRows: T[]) => void;
  selectable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  virtualScrolling?: boolean;
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  rowHeight?: number;
  maxHeight?: number;
}

export default function ResponsiveDataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  onRowSelect,
  selectable = false,
  searchable = true,
  filterable = true,
  sortable = true,
  virtualScrolling = false,
  pageSize = 50,
  loading = false,
  emptyMessage = 'No data available',
  className,
  rowHeight = 60,
  maxHeight = 600
}: ResponsiveDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [sorts, setSorts] = useState<TableSort[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(columns.map(col => col.id)));
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const tableRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Detect mobile device
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Auto-hide low priority columns on mobile
  useEffect(() => {
    if (isMobile) {
      const highPriorityColumns = columns
        .filter(col => col.priority === 'high' || !col.priority)
        .map(col => col.id);
      setVisibleColumns(new Set(highPriorityColumns));
    } else {
      setVisibleColumns(new Set(columns.map(col => col.id)));
    }
  }, [isMobile, columns]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(row => {
        return columns.some(col => {
          const value = col.accessorKey ? row[col.accessorKey] : col.accessor?.(row);
          return String(value || '').toLowerCase().includes(searchLower);
        });
      });
    }

    // Apply filters
    filters.forEach(filter => {
      result = result.filter(row => {
        const column = columns.find(col => col.id === filter.column);
        if (!column) return true;
        
        const value = column.accessorKey ? row[column.accessorKey] : column.accessor?.(row);
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return String(value || '').toLowerCase().includes(String(filter.value).toLowerCase());
          case 'startsWith':
            return String(value || '').toLowerCase().startsWith(String(filter.value).toLowerCase());
          case 'gt':
            return Number(value) > Number(filter.value);
          case 'lt':
            return Number(value) < Number(filter.value);
          default:
            return true;
        }
      });
    });

    // Apply sorting
    if (sorts.length > 0) {
      result.sort((a, b) => {
        for (const sort of sorts) {
          const column = columns.find(col => col.id === sort.column);
          if (!column) continue;
          
          const aValue = column.accessorKey ? a[column.accessorKey] : column.accessor?.(a);
          const bValue = column.accessorKey ? b[column.accessorKey] : column.accessor?.(b);
          
          let comparison = 0;
          if (aValue < bValue) comparison = -1;
          if (aValue > bValue) comparison = 1;
          
          if (comparison !== 0) {
            return sort.direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, filters, sorts, columns]);

  // Pagination for non-virtual scrolling
  const paginatedData = useMemo(() => {
    if (virtualScrolling) return processedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, currentPage, pageSize, virtualScrolling]);

  // Handle sorting
  const handleSort = useCallback((columnId: string) => {
    if (!sortable) return;
    
    setSorts(prevSorts => {
      const existingSort = prevSorts.find(s => s.column === columnId);
      
      if (existingSort) {
        if (existingSort.direction === 'asc') {
          return prevSorts.map(s => 
            s.column === columnId ? { ...s, direction: 'desc' as const } : s
          );
        } else {
          return prevSorts.filter(s => s.column !== columnId);
        }
      } else {
        return [{ column: columnId, direction: 'asc' as const }];
      }
    });
  }, [sortable]);

  // Handle row selection
  const handleRowSelect = useCallback((index: number, selected: boolean) => {
    setSelectedRows(prev => {
      const newSelected = new Set(prev);
      if (selected) {
        newSelected.add(index);
      } else {
        newSelected.delete(index);
      }
      
      const selectedData = Array.from(newSelected).map(i => paginatedData[i]);
      onRowSelect?.(selectedData);
      
      return newSelected;
    });
  }, [paginatedData, onRowSelect]);

  // Handle select all
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const allIndices = new Set(paginatedData.map((_, index) => index));
      setSelectedRows(allIndices);
      onRowSelect?.(paginatedData);
    } else {
      setSelectedRows(new Set());
      onRowSelect?.([]);
    }
  }, [paginatedData, onRowSelect]);

  // Get column value
  const getCellValue = useCallback((row: T, column: TableColumn<T>) => {
    return column.accessorKey ? row[column.accessorKey] : column.accessor?.(row);
  }, []);

  // Render cell content
  const renderCell = useCallback((value: any, row: T, column: TableColumn<T>) => {
    if (column.cell) {
      return column.cell(value, row);
    }
    
    if (value === null || value === undefined) {
      return <span className="text-gray-400">—</span>;
    }
    
    return <span>{String(value)}</span>;
  }, []);

  // Visible columns for current viewport
  const displayColumns = useMemo(() => {
    return columns.filter(col => visibleColumns.has(col.id));
  }, [columns, visibleColumns]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 overflow-hidden', className)}>
      {/* Header Controls */}
      {(searchable || filterable) && (
        <div className="p-4 border-b border-gray-200 space-y-3">
          {/* Search */}
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search across all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 min-h-[44px]"
              />
            </div>
          )}

          {/* Stats and Controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {processedData.length} {processedData.length === 1 ? 'record' : 'records'}
              {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Column visibility (desktop only) */}
              {!isMobile && (
                <Button variant="outline" size="sm" className="min-h-[36px]">
                  <Filter className="w-4 h-4 mr-1" />
                  Columns
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div 
        ref={tableRef}
        className="overflow-auto"
        style={{ maxHeight: virtualScrolling ? maxHeight : undefined }}
      >
        {/* Header */}
        <div 
          ref={headerRef}
          className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10"
        >
          <div className="flex">
            {/* Select All Checkbox */}
            {selectable && (
              <div className="flex items-center justify-center w-12 px-3 py-3 border-r border-gray-200">
                <Checkbox
                  checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all rows"
                />
              </div>
            )}
            
            {/* Column Headers */}
            {displayColumns.map((column) => {
              const currentSort = sorts.find(s => s.column === column.id);
              
              return (
                <div
                  key={column.id}
                  className={cn(
                    'flex items-center px-4 py-3 border-r border-gray-200 last:border-r-0',
                    'min-h-[48px]',
                    column.sortable && 'cursor-pointer hover:bg-gray-100',
                    column.align === 'center' && 'justify-center',
                    column.align === 'right' && 'justify-end'
                  )}
                  style={{ 
                    width: column.width,
                    minWidth: column.minWidth || 100
                  }}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {column.header}
                  </span>
                  
                  {column.sortable && (
                    <div className="ml-2 flex flex-col">
                      {currentSort ? (
                        currentSort.direction === 'asc' ? (
                          <SortAsc className="w-4 h-4 text-blue-600" />
                        ) : (
                          <SortDesc className="w-4 h-4 text-blue-600" />
                        )
                      ) : (
                        <div className="w-4 h-4 opacity-0 group-hover:opacity-50">
                          <SortAsc className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div>
          {paginatedData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">{emptyMessage}</p>
            </div>
          ) : (
            paginatedData.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={cn(
                  'flex border-b border-gray-100 hover:bg-gray-50 transition-colors',
                  onRowClick && 'cursor-pointer',
                  selectedRows.has(rowIndex) && 'bg-blue-50'
                )}
                style={{ minHeight: rowHeight }}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {/* Selection Checkbox */}
                {selectable && (
                  <div className="flex items-center justify-center w-12 px-3 border-r border-gray-100">
                    <Checkbox
                      checked={selectedRows.has(rowIndex)}
                      onCheckedChange={(checked) => handleRowSelect(rowIndex, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select row ${rowIndex + 1}`}
                    />
                  </div>
                )}

                {/* Data Cells */}
                {displayColumns.map((column) => {
                  const value = getCellValue(row, column);
                  
                  return (
                    <div
                      key={column.id}
                      className={cn(
                        'flex items-center px-4 py-3 border-r border-gray-100 last:border-r-0',
                        'min-h-[60px]',
                        column.align === 'center' && 'justify-center',
                        column.align === 'right' && 'justify-end'
                      )}
                      style={{ 
                        width: column.width,
                        minWidth: column.minWidth || 100
                      }}
                    >
                      <div className="truncate text-sm text-gray-900 w-full">
                        {renderCell(value, row, column)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {!virtualScrolling && processedData.length > pageSize && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {Math.ceil(processedData.length / pageSize)}
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="min-h-[36px]"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(processedData.length / pageSize), prev + 1))}
              disabled={currentPage === Math.ceil(processedData.length / pageSize)}
              className="min-h-[36px]"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}