import { useVirtualizer } from '@tanstack/react-virtual';
import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type ComboboxOption = {
  value: string;
  label: string;
  searchText?: string;
};

type VirtualizedComboboxProps = {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  height?: string;
};

export const VirtualizedCombobox = ({
  options,
  value,
  onValueChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No option found.',
  className,
  disabled = false,
  height = '300px',
}: VirtualizedComboboxProps) => {
  const [open, setOpen] = React.useState(false);
  const [filteredOptions, setFilteredOptions] = React.useState<ComboboxOption[]>(options);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const [isKeyboardNavActive, setIsKeyboardNavActive] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const parentRef = React.useRef<HTMLDivElement>(null);
  const isInitializedRef = React.useRef(false);

  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  });

  const virtualOptions = virtualizer.getVirtualItems();

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const scrollToIndex = React.useCallback(
    (index: number) => {
      virtualizer.scrollToIndex(index, {
        align: 'center',
      });
    },
    [virtualizer]
  );

  const handleSearch = React.useCallback(
    (search: string) => {
      // Ignore the first empty call from CommandInput mount
      if (!isInitializedRef.current && search === '') {
        isInitializedRef.current = true;
        return;
      }

      setSearchValue(search);
      setIsKeyboardNavActive(false);
      const searchLower = search.toLowerCase();
      const filtered = options.filter((option) => {
        const searchIn = option.searchText || option.label;
        return searchIn.toLowerCase().includes(searchLower);
      });
      setFilteredOptions(filtered);
      setFocusedIndex(-1);
    },
    [options]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          setIsKeyboardNavActive(true);
          setFocusedIndex((prev) => {
            const newIndex = prev === -1 ? 0 : Math.min(prev + 1, filteredOptions.length - 1);
            scrollToIndex(newIndex);
            return newIndex;
          });
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          setIsKeyboardNavActive(true);
          setFocusedIndex((prev) => {
            const newIndex = prev === -1 ? filteredOptions.length - 1 : Math.max(prev - 1, 0);
            scrollToIndex(newIndex);
            return newIndex;
          });
          break;
        }
        case 'Enter': {
          event.preventDefault();
          if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
            onValueChange?.(filteredOptions[focusedIndex].value);
            setOpen(false);
          }
          break;
        }
        default: {
          break;
        }
      }
    },
    [filteredOptions, focusedIndex, onValueChange, scrollToIndex]
  );

  // Initialize and reset filtered options when options change or popup opens
  React.useEffect(() => {
    if (open) {
      setFilteredOptions(options);
      setSearchValue('');
      isInitializedRef.current = false;

      // Force virtualizer to recalculate after options are set
      setTimeout(() => {
        virtualizer.measure();
      }, 200);
    }
  }, [options, open, virtualizer]);

  // Scroll to selected option when opening
  React.useEffect(() => {
    if (open && value) {
      const index = filteredOptions.findIndex((option) => option.value === value);
      if (index !== -1) {
        setFocusedIndex(index);
        // Small delay to ensure virtualizer is ready
        setTimeout(() => scrollToIndex(index), 0);
      }
    }
  }, [open, value, filteredOptions, scrollToIndex]);

  return (
    <TooltipProvider delayDuration={300}>
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                  'flex items-center justify-between truncate max-w-full px-3 active:!scale-[unset]',
                  className
                )}
                disabled={disabled}
              >
                <span className="truncate max-w-[220px]">
                  {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          {selectedOption ? (
            <TooltipContent side="top">
              <p>{selectedOption.label}</p>
            </TooltipContent>
          ) : null}
        </Tooltip>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command shouldFilter={false} onKeyDown={handleKeyDown}>
            <CommandInput onValueChange={handleSearch} placeholder={searchPlaceholder} />
            <CommandList
              ref={parentRef}
              style={{
                height: height,
                width: '100%',
                overflow: 'auto',
              }}
              onMouseDown={() => setIsKeyboardNavActive(false)}
              onMouseMove={() => setIsKeyboardNavActive(false)}
            >
              {searchValue === '' ? null : <CommandEmpty>{emptyText}</CommandEmpty>}
              <CommandGroup>
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualOptions.map((virtualOption) => {
                    const option = filteredOptions[virtualOption.index];
                    const isSelected = value === option.value;
                    const isFocused = focusedIndex === virtualOption.index;

                    return (
                      <CommandItem
                        key={option.value}
                        disabled={isKeyboardNavActive}
                        className={cn(
                          'absolute left-0 top-0 w-full',
                          isFocused && 'bg-accent text-accent-foreground',
                          isKeyboardNavActive &&
                            !isFocused &&
                            'aria-selected:bg-transparent aria-selected:text-primary'
                        )}
                        style={{
                          height: `${virtualOption.size}px`,
                          transform: `translateY(${virtualOption.start}px)`,
                        }}
                        value={option.searchText || option.label}
                        keywords={[option.value]}
                        onMouseEnter={() =>
                          !isKeyboardNavActive && setFocusedIndex(virtualOption.index)
                        }
                        onMouseLeave={() => !isKeyboardNavActive && setFocusedIndex(-1)}
                        onSelect={() => {
                          onValueChange?.(option.value);
                          setOpen(false);
                        }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="truncate flex-1 flex items-center">{option.label}</div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>{option.label}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Check
                          className={cn(
                            'ml-2 h-4 w-4 shrink-0',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    );
                  })}
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};
