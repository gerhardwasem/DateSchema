import { useState, useRef, useEffect } from 'react';
import { Filter, X, ChevronDown, Building2, Calendar, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { useFilters } from '../../contexts/FilterContext';

interface Props {
  availableVenues: string[];
  availableEventTypes: string[];
  dateMin?: string;
  dateMax?: string;
  showScope?: boolean;
}

function MultiSelect({
  label,
  icon: Icon,
  options,
  selected,
  onChange,
}: {
  label: string;
  icon: typeof Building2;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (val: string) => {
    onChange(
      selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
    );
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
          selected.length > 0
            ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{selected.length > 0 ? `${label} (${selected.length})` : label}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[200px] max-h-[240px] overflow-auto">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 text-left transition-colors"
            >
              <div
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                  selected.includes(opt)
                    ? 'bg-cyan-600 border-cyan-600'
                    : 'border-slate-300'
                }`}
              >
                {selected.includes(opt) && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12">
                    <path d="M3.5 6L5.5 8L8.5 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-slate-700">{opt}</span>
            </button>
          ))}
          {options.length === 0 && (
            <span className="px-3 py-2 text-xs text-slate-400 block">No options available</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function FilterBar({
  availableVenues,
  availableEventTypes,
  dateMin,
  dateMax,
  showScope = true,
}: Props) {
  const {
    selectedVenues,
    setSelectedVenues,
    dateRange,
    setDateRange,
    eventTypes,
    setEventTypes,
    scope,
    setScope,
    clearFilters,
    hasActiveFilters,
  } = useFilters();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="w-3.5 h-3.5 text-slate-400" />

      <MultiSelect
        label="Venues"
        icon={Building2}
        options={availableVenues}
        selected={selectedVenues}
        onChange={setSelectedVenues}
      />

      <MultiSelect
        label="Event Type"
        icon={Tag}
        options={availableEventTypes}
        selected={eventTypes}
        onChange={setEventTypes}
      />

      <div className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
        <input
          type="date"
          value={dateRange?.start || ''}
          min={dateMin}
          max={dateMax}
          onChange={(e) =>
            setDateRange(
              e.target.value
                ? { start: e.target.value, end: dateRange?.end || e.target.value }
                : null
            )
          }
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
        <span className="text-xs text-slate-400">to</span>
        <input
          type="date"
          value={dateRange?.end || ''}
          min={dateRange?.start || dateMin}
          max={dateMax}
          onChange={(e) =>
            setDateRange(
              e.target.value
                ? { start: dateRange?.start || e.target.value, end: e.target.value }
                : null
            )
          }
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
      </div>

      {showScope && (
        <button
          onClick={() => setScope(scope === 'event' ? 'venue' : 'event')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
            scope === 'venue'
              ? 'border-teal-300 bg-teal-50 text-teal-700'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {scope === 'venue' ? (
            <ToggleRight className="w-3.5 h-3.5" />
          ) : (
            <ToggleLeft className="w-3.5 h-3.5" />
          )}
          {scope === 'event' ? 'Per Event' : 'Per Venue'}
        </button>
      )}

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}
