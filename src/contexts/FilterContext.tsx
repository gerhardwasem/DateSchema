import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface FilterState {
  selectedVenues: string[];
  dateRange: { start: string; end: string } | null;
  eventTypes: string[];
  scope: 'event' | 'venue';
}

interface FilterContextValue extends FilterState {
  setSelectedVenues: (venues: string[]) => void;
  setDateRange: (range: { start: string; end: string } | null) => void;
  setEventTypes: (types: string[]) => void;
  setScope: (scope: 'event' | 'venue') => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const defaults: FilterState = {
  selectedVenues: [],
  dateRange: null,
  eventTypes: [],
  scope: 'event',
};

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedVenues, setSelectedVenues] = useState<string[]>(defaults.selectedVenues);
  const [dateRange, setDateRange] = useState<FilterState['dateRange']>(defaults.dateRange);
  const [eventTypes, setEventTypes] = useState<string[]>(defaults.eventTypes);
  const [scope, setScope] = useState<FilterState['scope']>(defaults.scope);

  const clearFilters = useCallback(() => {
    setSelectedVenues(defaults.selectedVenues);
    setDateRange(defaults.dateRange);
    setEventTypes(defaults.eventTypes);
    setScope(defaults.scope);
  }, []);

  const hasActiveFilters =
    selectedVenues.length > 0 ||
    dateRange !== null ||
    eventTypes.length > 0 ||
    scope !== 'event';

  return (
    <FilterContext.Provider
      value={{
        selectedVenues,
        dateRange,
        eventTypes,
        scope,
        setSelectedVenues,
        setDateRange,
        setEventTypes,
        setScope,
        clearFilters,
        hasActiveFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
