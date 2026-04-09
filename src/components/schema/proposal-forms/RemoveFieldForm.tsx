import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import type { SchemaType } from '../../../lib/types';

interface Props {
  schema: SchemaType;
  onChange: (selectedFields: string[]) => void;
}

export default function RemoveFieldForm({ schema, onChange }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const properties = schema.json_schema.properties || {};
  const required = new Set(schema.json_schema.required || []);
  const fieldNames = Object.keys(properties);

  const toggle = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelected(next);
    onChange(Array.from(next));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Select fields to remove from this component type.</p>
      <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-64 overflow-auto">
        {fieldNames.map((name) => {
          const prop = properties[name];
          const isSelected = selected.has(name);
          const isRequired = required.has(name);
          return (
            <button
              key={name}
              onClick={() => toggle(name)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                isSelected ? 'bg-red-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                isSelected ? 'border-red-500 bg-red-500' : 'border-slate-300'
              }`}>
                {isSelected && <Trash2 className="w-2.5 h-2.5 text-white" />}
              </div>
              <code className={`text-xs font-mono font-medium flex-1 ${isSelected ? 'line-through text-red-500' : 'text-slate-700'}`}>
                {name}
              </code>
              <span className="text-xs text-slate-400">{prop.type}</span>
              {isRequired && (
                <span className="px-1.5 py-0.5 text-xs rounded bg-amber-100 text-amber-700 font-medium">required</span>
              )}
            </button>
          );
        })}
      </div>

      {Array.from(selected).some((f) => required.has(f)) && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            One or more selected fields are currently in the required array. Removing them will also affect data validation.
          </p>
        </div>
      )}

      {selected.size > 0 && (
        <p className="text-xs text-red-600 font-medium">
          {selected.size} field{selected.size > 1 ? 's' : ''} selected for removal
        </p>
      )}
    </div>
  );
}

export function buildRemoveFieldPayload(schema: SchemaType, selectedFields: string[]) {
  const properties = schema.json_schema.properties || {};
  const currentValue: Record<string, unknown> = {};
  selectedFields.forEach((name) => {
    if (properties[name]) {
      currentValue[name] = properties[name];
    }
  });
  return {
    field_path: selectedFields.length === 1 ? `data.${selectedFields[0]}` : null,
    current_value: currentValue,
    proposed_value: { _removed: selectedFields },
  };
}
