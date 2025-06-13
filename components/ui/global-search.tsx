'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, Users, Clock, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PriorityBadge } from '@/components/food-service/PriorityBadge';
import { useDebounce } from 'use-debounce';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'organization' | 'contact';
  title: string;
  subtitle?: string;
  priority?: 'A' | 'B' | 'C' | 'D';
  lastContactDays?: number;
  isFavorite?: boolean;
  url: string;
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  onResultSelect?: (result: SearchResult) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  className,
  placeholder = "Quick search organizations, contacts...",
  onResultSelect
}) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search/global?q=${encodeURIComponent(debouncedQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    onResultSelect?.(result);
    
    // Navigate to the result
    window.location.href = result.url;
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'organization':
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'contact':
        return <Users className="h-4 w-4 text-green-600" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatLastContact = (days?: number) => {
    if (!days) return null;
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}m ago`;
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="pl-10 h-12 touch-target"
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-14 left-0 right-0 z-50 max-h-96 overflow-y-auto shadow-lg border-2">
          <CardContent className="p-0">
            {results.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {isLoading ? 'Searching...' : 'No results found'}
              </div>
            ) : (
              <div className="space-y-0">
                {results.map((result, index) => (
                  <Button
                    key={result.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start p-4 h-auto text-left hover:bg-gray-50 rounded-none touch-target",
                      selectedIndex === index && "bg-blue-50 hover:bg-blue-50"
                    )}
                    onClick={() => handleResultSelect(result)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-shrink-0 mt-0.5">
                        {getResultIcon(result.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">
                            {result.title}
                          </span>
                          {result.isFavorite && (
                            <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                          )}
                          {result.priority && (
                            <PriorityBadge priority={result.priority} />
                          )}
                        </div>
                        
                        {result.subtitle && (
                          <div className="text-sm text-gray-500 truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0 text-right">
                        {result.lastContactDays !== undefined && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatLastContact(result.lastContactDays)}</span>
                          </div>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {result.type}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
            
            {/* Search Tips */}
            {query.length > 0 && query.length < 2 && (
              <div className="px-4 py-3 text-xs text-gray-400 border-t">
                Type at least 2 characters to search
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GlobalSearch;