import { useState } from 'react';
import { ChevronDown, ChevronRight, Search, GripVertical, Lightbulb } from 'lucide-react';
import type { Metric } from '../../lib/types';
import { COMPONENT_COLORS } from '../../lib/schema-relationships';

interface Props {
  metricsByType: Record<string, Metric[]>;
  onDragStart: (metric: Metric) => void;
}

export default function MetricPalette({ metricsByType, onDragStart }: Props) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['event', 'budget']));
  const [search, setSearch] = useState('');

  const toggleType = (type: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filteredTypes = Object.entries(metricsByType)
    .map(([type, metrics]) => {
      if (!search) return { type, metrics };
      const filtered = metrics.filter(
        (m) =>
          m.display_name.toLowerCase().includes(search.toLowerCase()) ||
          m.field_path.toLowerCase().includes(search.toLowerCase())
      );
      return { type, metrics: filtered };
    })
    .filter((t) => t.metrics.length > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter metrics..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredTypes.map(({ type, metrics }) => {
          const color = COMPONENT_COLORS[type] || '#64748b';
          const isExpanded = expandedTypes.has(type) || !!search;
          const confirmedCount = metrics.filter((m) => !m.proposed).length;
          const proposedCount = metrics.filter((m) => m.proposed).length;

          return (
            <div key={type}>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors"
                onClick={() => toggleType(type)}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs font-semibold text-slate-700 flex-1 text-left capitalize">
                  {type.replace(/-/g, ' ')}
                </span>
                <span className="text-xs text-slate-400">{confirmedCount}</span>
                {proposedCount > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-amber-500">
                    <Lightbulb className="w-3 h-3" />
                    {proposedCount}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isExpanded && (
                <div className="pb-1">
                  {metrics.map((m) => (
                    <div
                      key={m.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('metric', JSON.stringify(m));
                        e.dataTransfer.effectAllowed = 'copy';
                        onDragStart(m);
                      }}
                      title={m.proposed ? `Proposed (${m.proposal_status}) — ${m.description || ''}` : m.description || m.display_name}
                      className={`metric-chip mx-3 mb-1.5 w-[calc(100%-24px)] ${
                        m.proposed ? 'border-dashed opacity-80' : ''
                      }`}
                      style={{
                        borderColor: m.proposed ? color + '70' : color + '40',
                        backgroundColor: m.proposed ? color + '05' : color + '08',
                        color: color,
                      }}
                    >
                      <GripVertical className="w-3 h-3 opacity-40 shrink-0" />
                      <span className="truncate flex-1">{m.display_name}</span>
                      {m.proposed && (
                        <span className="shrink-0 text-[9px] font-semibold px-1 py-0.5 rounded bg-amber-100 text-amber-600 border border-amber-200">
                          {m.proposal_status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
