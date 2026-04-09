import { useState, useMemo } from 'react';
import {
  Clock,
  User,
  ChevronDown,
  ChevronRight,
  FileJson,
  Lightbulb,
  MessageSquare,
  Link,
  Filter,
} from 'lucide-react';
import type { SchemaType } from '../../lib/types';
import { useAuditLog } from '../../hooks/useAuditLog';
import { COMPONENT_COLORS } from '../../lib/schema-relationships';

interface Props {
  schemaTypes: SchemaType[];
}

const ENTITY_TYPE_CONFIG: Record<string, { icon: typeof FileJson; label: string; color: string }> = {
  schema_type: { icon: FileJson, label: 'Schema', color: 'text-teal-600 bg-teal-50' },
  proposal: { icon: Lightbulb, label: 'Proposal', color: 'text-amber-600 bg-amber-50' },
  annotation: { icon: MessageSquare, label: 'Annotation', color: 'text-cyan-600 bg-cyan-50' },
  relationship: { icon: Link, label: 'Relationship', color: 'text-blue-600 bg-blue-50' },
};

const ACTION_LABELS: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  status_changed: 'Status Changed',
  imported: 'Imported',
};

export default function ChangelogPanel({ schemaTypes }: Props) {
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const { entries, loading } = useAuditLog({
    entityType: entityTypeFilter || undefined,
    action: actionFilter || undefined,
    limit: 200,
  });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const schemaMap = useMemo(() => {
    const m: Record<string, SchemaType> = {};
    schemaTypes.forEach((s) => { m[s.id] = s; });
    return m;
  }, [schemaTypes]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
        >
          <option value="">All entity types</option>
          <option value="schema_type">Schema Types</option>
          <option value="proposal">Proposals</option>
          <option value="annotation">Annotations</option>
          <option value="relationship">Relationships</option>
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
        >
          <option value="">All actions</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="deleted">Deleted</option>
          <option value="status_changed">Status Changed</option>
          <option value="imported">Imported</option>
        </select>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No activity yet</p>
          <p className="text-xs text-slate-400 mt-1">Changes will appear here as they happen</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
          <div className="space-y-1">
            {entries.map((entry) => {
              const config = ENTITY_TYPE_CONFIG[entry.entity_type] || ENTITY_TYPE_CONFIG.schema_type;
              const Icon = config.icon;
              const isExpanded = expandedIds.has(entry.id);
              const relatedSchema = entry.entity_id ? schemaMap[entry.entity_id] : null;

              return (
                <div key={entry.id} className="relative pl-12">
                  <div className={`absolute left-3 top-3 w-5 h-5 rounded-full flex items-center justify-center ${config.color}`}>
                    <Icon className="w-3 h-3" />
                  </div>

                  <div
                    className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(entry.id)}
                  >
                    <div className="flex items-center gap-2 px-4 py-3">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 truncate">{entry.change_summary}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-xs text-slate-500">{ACTION_LABELS[entry.action] || entry.action}</span>
                          {relatedSchema && (
                            <span className="flex items-center gap-1">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: COMPONENT_COLORS[relatedSchema.type_key] || '#64748b' }}
                              />
                              <span className="text-xs text-slate-400">{relatedSchema.display_name}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                        {entry.actor && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {entry.actor}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatTime(entry.created_at)}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (entry.old_value || entry.new_value) && (
                      <div className="px-4 pb-3 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {entry.old_value && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">Previous</p>
                              <pre className="text-xs font-mono bg-red-50/50 p-2 rounded-lg overflow-auto max-h-40 text-slate-600">
                                {JSON.stringify(entry.old_value, null, 2)}
                              </pre>
                            </div>
                          )}
                          {entry.new_value && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">New</p>
                              <pre className="text-xs font-mono bg-emerald-50/50 p-2 rounded-lg overflow-auto max-h-40 text-slate-600">
                                {JSON.stringify(entry.new_value, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
