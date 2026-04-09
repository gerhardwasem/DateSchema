import { useState, useEffect } from 'react';
import { Check, ChevronRight, Plus, X } from 'lucide-react';
import type { SchemaType, SchemaProperty } from '../../../lib/types';

interface FieldChange {
  fieldName: string;
  current: SchemaProperty;
  proposed: ProposedFieldState;
}

interface ProposedFieldState {
  type: string;
  format: string;
  description: string;
  nullable: boolean;
  enumValues: string[];
  minimum: string;
}

interface Props {
  schema: SchemaType;
  preselectedField?: string | null;
  onChange: (change: FieldChange | null) => void;
}

const FIELD_TYPES = ['string', 'integer', 'number', 'boolean', 'array', 'object'];

function propertyToState(prop: SchemaProperty): ProposedFieldState {
  return {
    type: prop.type,
    format: prop.format || '',
    description: prop.description || '',
    nullable: prop.nullable || false,
    enumValues: prop.enum || [],
    minimum: prop.minimum !== undefined ? String(prop.minimum) : '',
  };
}

export default function ModifyFieldForm({ schema, preselectedField, onChange }: Props) {
  const properties = schema.json_schema.properties || {};
  const fieldNames = Object.keys(properties);

  const getInitialField = () => {
    if (preselectedField) {
      const clean = preselectedField.replace(/^data\./, '');
      if (properties[clean]) return clean;
    }
    return '';
  };

  const [selectedField, setSelectedField] = useState(getInitialField);
  const [proposed, setProposed] = useState<ProposedFieldState | null>(null);
  const [enumInput, setEnumInput] = useState('');

  useEffect(() => {
    if (selectedField && properties[selectedField]) {
      const state = propertyToState(properties[selectedField]);
      setProposed(state);
    } else {
      setProposed(null);
    }
  }, [selectedField]);

  useEffect(() => {
    if (selectedField && proposed) {
      onChange({
        fieldName: selectedField,
        current: properties[selectedField],
        proposed,
      });
    } else {
      onChange(null);
    }
  }, [selectedField, proposed]);

  const updateProposed = (patch: Partial<ProposedFieldState>) => {
    if (!proposed) return;
    setProposed({ ...proposed, ...patch });
  };

  const currentProp = selectedField ? properties[selectedField] : null;

  const isDifferent = (key: keyof ProposedFieldState) => {
    if (!currentProp || !proposed) return false;
    const orig = propertyToState(currentProp);
    if (key === 'enumValues') return JSON.stringify(orig.enumValues) !== JSON.stringify(proposed.enumValues);
    return orig[key] !== proposed[key];
  };

  const addEnum = () => {
    if (!proposed) return;
    const val = enumInput.trim();
    if (val && !proposed.enumValues.includes(val)) {
      updateProposed({ enumValues: [...proposed.enumValues, val] });
      setEnumInput('');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">Select Field to Modify</label>
        <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-auto rounded-lg border border-slate-200 p-2">
          {fieldNames.map((name) => {
            const prop = properties[name];
            const isSelected = selectedField === name;
            return (
              <button
                key={name}
                onClick={() => setSelectedField(name)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-xs ${
                  isSelected
                    ? 'bg-amber-50 border border-amber-300 text-amber-800'
                    : 'hover:bg-slate-50 border border-transparent text-slate-700'
                }`}
              >
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                )}
                <code className="font-mono font-medium truncate">{name}</code>
                <span className="text-slate-400 ml-auto shrink-0">{prop.type}</span>
              </button>
            );
          })}
        </div>
      </div>

      {currentProp && proposed && (
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-500">
            Editing <code className="font-mono text-amber-700">{selectedField}</code>
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Type
                {isDifferent('type') && <span className="ml-1.5 text-amber-600">*</span>}
              </label>
              <select
                value={proposed.type}
                onChange={(e) => updateProposed({ type: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none ${
                  isDifferent('type') ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'
                }`}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-0.5">was: {currentProp.type}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Format
                {isDifferent('format') && <span className="ml-1.5 text-amber-600">*</span>}
              </label>
              <input
                type="text"
                value={proposed.format}
                onChange={(e) => updateProposed({ format: e.target.value })}
                placeholder="e.g. date-time, email"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none ${
                  isDifferent('format') ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'
                }`}
              />
              {currentProp.format && <p className="text-xs text-slate-400 mt-0.5">was: {currentProp.format}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Description
              {isDifferent('description') && <span className="ml-1.5 text-amber-600">*</span>}
            </label>
            <textarea
              value={proposed.description}
              onChange={(e) => updateProposed({ description: e.target.value })}
              rows={2}
              className={`w-full px-3 py-2 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none ${
                isDifferent('description') ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Enum Values
              {isDifferent('enumValues') && <span className="ml-1.5 text-amber-600">*</span>}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {proposed.enumValues.map((v) => (
                <span key={v} className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 text-xs rounded-full border border-amber-200">
                  {v}
                  <button onClick={() => updateProposed({ enumValues: proposed.enumValues.filter((e) => e !== v) })} className="hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {proposed.enumValues.length === 0 && <span className="text-xs text-slate-400">No enum values</span>}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={enumInput}
                onChange={(e) => setEnumInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEnum())}
                placeholder="Add enum value..."
                className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
              <button
                onClick={addEnum}
                disabled={!enumInput.trim()}
                className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {(proposed.type === 'integer' || proposed.type === 'number') && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Minimum
                {isDifferent('minimum') && <span className="ml-1.5 text-amber-600">*</span>}
              </label>
              <input
                type="number"
                value={proposed.minimum}
                onChange={(e) => updateProposed({ minimum: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none ${
                  isDifferent('minimum') ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'
                }`}
              />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <button
              type="button"
              onClick={() => updateProposed({ nullable: !proposed.nullable })}
              className={`relative w-8 h-5 rounded-full transition-colors ${proposed.nullable ? 'bg-amber-500' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${proposed.nullable ? 'left-3.5' : 'left-0.5'}`} />
            </button>
            <span className="text-xs text-slate-600">
              Nullable
              {isDifferent('nullable') && <span className="ml-1.5 text-amber-600">*</span>}
            </span>
          </label>
        </div>
      )}
    </div>
  );
}

export function buildModifyFieldPayload(change: { fieldName: string; current: SchemaProperty; proposed: { type: string; format: string; description: string; nullable: boolean; enumValues: string[]; minimum: string } }) {
  const currentVal: Record<string, unknown> = { type: change.current.type };
  if (change.current.format) currentVal.format = change.current.format;
  if (change.current.description) currentVal.description = change.current.description;
  if (change.current.nullable) currentVal.nullable = true;
  if (change.current.enum) currentVal.enum = change.current.enum;
  if (change.current.minimum !== undefined) currentVal.minimum = change.current.minimum;

  const proposedVal: Record<string, unknown> = { type: change.proposed.type };
  if (change.proposed.format) proposedVal.format = change.proposed.format;
  if (change.proposed.description) proposedVal.description = change.proposed.description;
  if (change.proposed.nullable) proposedVal.nullable = true;
  if (change.proposed.enumValues.length > 0) proposedVal.enum = change.proposed.enumValues;
  if (change.proposed.minimum && (change.proposed.type === 'integer' || change.proposed.type === 'number')) {
    proposedVal.minimum = parseFloat(change.proposed.minimum);
  }

  return {
    field_path: `data.${change.fieldName}`,
    current_value: { [change.fieldName]: currentVal },
    proposed_value: { [change.fieldName]: proposedVal },
  };
}
