import { ToggleLeft, ToggleRight } from 'lucide-react';
import type { SchemaProperty } from '../../lib/types';

interface Props {
  properties: Record<string, SchemaProperty>;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  prefix?: string;
}

export default function DynamicForm({ properties, values, onChange, prefix = '' }: Props) {
  const renderField = (key: string, prop: SchemaProperty) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = values[key];

    if (prop.type === 'object' && prop.properties) {
      const objVal = (value as Record<string, unknown>) || {};
      return (
        <div key={fullKey} className="border border-slate-200 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{key}</p>
          <DynamicForm
            properties={prop.properties}
            values={objVal}
            onChange={(subKey, subVal) => {
              onChange(key, { ...objVal, [subKey]: subVal });
            }}
            prefix={fullKey}
          />
        </div>
      );
    }

    if (prop.type === 'boolean') {
      const boolVal = value as boolean || false;
      return (
        <div key={fullKey} className="flex items-center justify-between py-2">
          <label className="text-sm text-slate-700">{key}</label>
          <button
            type="button"
            onClick={() => onChange(key, !boolVal)}
            className={`transition-colors ${boolVal ? 'text-cyan-600' : 'text-slate-300'}`}
          >
            {boolVal ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
          </button>
        </div>
      );
    }

    if (prop.type === 'integer' || prop.type === 'number') {
      return (
        <div key={fullKey} className="mb-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">{key}</label>
          <input
            type="number"
            value={(value as number) ?? ''}
            onChange={(e) => onChange(key, e.target.value === '' ? null : Number(e.target.value))}
            min={prop.minimum}
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
          />
        </div>
      );
    }

    if (prop.enum) {
      return (
        <div key={fullKey} className="mb-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">{key}</label>
          <select
            value={(value as string) || ''}
            onChange={(e) => onChange(key, e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
          >
            <option value="">Select...</option>
            {prop.enum.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (prop.type === 'array') {
      return (
        <div key={fullKey} className="mb-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">{key}</label>
          <input
            type="text"
            value={Array.isArray(value) ? value.join(', ') : ''}
            onChange={(e) => onChange(key, e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            placeholder="Comma-separated values"
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
          />
        </div>
      );
    }

    return (
      <div key={fullKey} className="mb-3">
        <label className="block text-xs font-medium text-slate-600 mb-1">{key}</label>
        <input
          type="text"
          value={(value as string) || ''}
          onChange={(e) => onChange(key, e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
        />
      </div>
    );
  };

  return (
    <div>
      {Object.entries(properties).map(([key, prop]) => renderField(key, prop))}
    </div>
  );
}
