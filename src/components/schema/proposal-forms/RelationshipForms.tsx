import { useState } from 'react';
import { ArrowRight, Trash2 } from 'lucide-react';
import type { SchemaType } from '../../../lib/types';
import { SCHEMA_RELATIONSHIPS, COMPONENT_COLORS } from '../../../lib/schema-relationships';

interface AddRelProps {
  schema: SchemaType;
  schemaTypes: SchemaType[];
  onChange: (data: { toTypeKey: string; label: string } | null) => void;
}

export function AddRelationshipForm({ schema, schemaTypes, onChange }: AddRelProps) {
  const [toTypeKey, setToTypeKey] = useState('');
  const [label, setLabel] = useState('');

  const existing = new Set(
    SCHEMA_RELATIONSHIPS
      .filter((r) => r.from === schema.type_key)
      .map((r) => r.to)
  );

  const available = schemaTypes.filter(
    (s) => s.type_key !== schema.type_key && !existing.has(s.type_key)
  );

  const update = (patch: { toTypeKey?: string; label?: string }) => {
    const next = { toTypeKey: patch.toTypeKey ?? toTypeKey, label: patch.label ?? label };
    if (patch.toTypeKey !== undefined) setToTypeKey(patch.toTypeKey);
    if (patch.label !== undefined) setLabel(patch.label);
    if (next.toTypeKey && next.label) {
      onChange(next);
    } else {
      onChange(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COMPONENT_COLORS[schema.type_key] || '#64748b' }} />
          <span className="text-sm font-medium text-slate-700">{schema.display_name}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400" />
        {toTypeKey ? (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COMPONENT_COLORS[toTypeKey] || '#64748b' }} />
            <span className="text-sm font-medium text-slate-700">
              {schemaTypes.find((s) => s.type_key === toTypeKey)?.display_name || toTypeKey}
            </span>
          </div>
        ) : (
          <span className="text-sm text-slate-400">Select target...</span>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Target Component</label>
        <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-auto rounded-lg border border-slate-200 p-2">
          {available.map((s) => (
            <button
              key={s.type_key}
              onClick={() => update({ toTypeKey: s.type_key })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                toTypeKey === s.type_key
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                  : 'hover:bg-slate-50 border border-transparent text-slate-700'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COMPONENT_COLORS[s.type_key] || '#64748b' }} />
              <span className="truncate">{s.display_name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Relationship Label</label>
        <input
          type="text"
          value={label}
          onChange={(e) => update({ label: e.target.value })}
          placeholder='e.g. "has billing", "belongs to"'
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
      </div>
    </div>
  );
}

interface RemoveRelProps {
  schema: SchemaType;
  schemaTypes: SchemaType[];
  onChange: (data: { from: string; to: string; label: string } | null) => void;
}

export function RemoveRelationshipForm({ schema, schemaTypes, onChange }: RemoveRelProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const related = SCHEMA_RELATIONSHIPS.filter(
    (r) => r.from === schema.type_key || r.to === schema.type_key
  );

  const handleSelect = (key: string) => {
    const next = selected === key ? null : key;
    setSelected(next);
    if (next) {
      const rel = related.find((r) => `${r.from}-${r.to}` === next);
      onChange(rel || null);
    } else {
      onChange(null);
    }
  };

  const getName = (typeKey: string) => {
    return schemaTypes.find((s) => s.type_key === typeKey)?.display_name || typeKey;
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Select the relationship to propose for removal.</p>
      <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-64 overflow-auto">
        {related.length === 0 && (
          <p className="px-4 py-6 text-xs text-slate-400 text-center">No existing relationships found</p>
        )}
        {related.map((r) => {
          const key = `${r.from}-${r.to}`;
          const isSelected = selected === key;
          return (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                isSelected ? 'bg-red-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                isSelected ? 'border-red-500 bg-red-500' : 'border-slate-300'
              }`}>
                {isSelected && <Trash2 className="w-2.5 h-2.5 text-white" />}
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COMPONENT_COLORS[r.from] || '#64748b' }} />
                  <span className={`text-xs font-medium ${isSelected ? 'line-through text-red-500' : 'text-slate-700'}`}>
                    {getName(r.from)}
                  </span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COMPONENT_COLORS[r.to] || '#64748b' }} />
                  <span className={`text-xs font-medium ${isSelected ? 'line-through text-red-500' : 'text-slate-700'}`}>
                    {getName(r.to)}
                  </span>
                </div>
              </div>
              <span className={`text-xs italic ${isSelected ? 'line-through text-red-400' : 'text-slate-400'}`}>
                {r.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function buildAddRelPayload(schema: SchemaType, data: { toTypeKey: string; label: string }) {
  return {
    field_path: null,
    current_value: {},
    proposed_value: { from: schema.type_key, to: data.toTypeKey, label: data.label },
  };
}

export function buildRemoveRelPayload(data: { from: string; to: string; label: string }) {
  return {
    field_path: null,
    current_value: { from: data.from, to: data.to, label: data.label },
    proposed_value: { _removed_relationship: true },
  };
}
