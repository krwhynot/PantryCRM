'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { Loader2Icon, SearchIcon, XIcon } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { cn } from '@/lib/utils';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'organization' | 'contact' | 'opportunity' | 'interaction' | 'setting' | 'other';
  url: string;
  icon?: React.ReactNode;
}

interface FulltextSearchProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => Promise<SearchResult[]>;
  searchDelay?: number;
  minChars?: number;
  maxResults?: number;
}

/**
 * FulltextSearch component for NextCRM
 * Provides global search functionality across all CRM entities
 */
export function FulltextSearch({
  placeholder = 'Search...',
  className,
  onSearch,
  searchDelay = 300,
  minChars = 2,
  maxResults = 10
}: FulltextSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, searchDelay);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };
    
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Default search function if none provided
  const defaultSearch = async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  };

  // Perform search when debounced query changes
  const performSearch = useCallback(async () => {
    if (debouncedQuery.length < minChars) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await (onSearch ? onSearch(debouncedQuery) : defaultSearch(debouncedQuery));
      setResults(searchResults.slice(0, maxResults));
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, minChars, maxResults, onSearch]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    router.push(result.url);
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  // Type labels for display
  const typeLabels: Record<string, string> = {
    organization: 'Organizations',
    contact: 'Contacts',
    opportunity: 'Opportunities',
    interaction: 'Interactions',
    setting: 'Settings',
    other: 'Other'
  };

  return (
    <>
      <div className={cn('relative', className)}>
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          className="pl-8 h-10"
          onClick={() => setOpen(true)}
          onFocus={() => setOpen(true)}
        />
        <kbd className="pointer-events-none absolute right-2.5 top-2.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={placeholder}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No results found.
              </p>
            )}
          </CommandEmpty>

          {Object.entries(groupedResults).map(([type, items], index) => (
            <div key={type}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={typeLabels[type] || type}>
                {items.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-2"
                  >
                    {result.icon}
                    <div>
                      <p>{result.title}</p>
                      {result.description && (
                        <p className="text-xs text-muted-foreground">
                          {result.description}
                        </p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

export default FulltextSearch;