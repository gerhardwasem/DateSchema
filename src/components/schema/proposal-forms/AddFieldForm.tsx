import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { SchemaType } from '../../../lib/types';

interface FieldDef {
  name: string;
  type: string;
  format: string;
  description: string;
  nullable: boolean;
  required: boolean;
  enumValues: string[];
  minimum: string;
}

interface Props {
  schema: SchemaType;
  onChange: (field: FieldDef) => void;
}

const FIELD_TYPES = ['string', 'integer', 'number', 'boolean', 'array', 'object'];

function emptyField(): FieldDef {
  return { name: '', type: 'string', format: '', description: '', nullable: false, required: false, enumValues: [], minimum: '' };
}

export default function AddFieldForm({ schema, onChange }: Props) {
  const [field, setField] = useState<FieldDef>(emptyField());
  const [enumInput, setEnumInput] = useState('');

  const update = (patch: Partial<FieldDef>) => {
    const next = { ...field, ...patch };
    setField(next);
    onChange(next);
  };

  const addEnum = () => {
    const val = enumInput.trim();
    if (val && !field.enumValues.includes(val)) {
      update({ enumValues: [...field.enumValues, val] });
      setEnumInput('');
    }
  };

  const removeEnum = (v: string) => {
    update({ enumValues: field.enumValues.filter((e) => e !== v) });
  };

  const existingFields = Object.keys(schema.json_schema.properties || {});
  const nameConflict = existingFields.includes(field.name);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Field Name</label>
        <input
          type="text"
          value={field.name}
          onChange={(e) => update({ name: e.target.value.replace(/\s/g, '_') })}
          placeholder="new_field_name"
          className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none ${
            nameConflict ? 'border-red-300 bg-red-50' : 'border-slate-200'
          }`}
        />
        {nameConflict && (
          <p className="text-xs text-red-600 mt-1">A field with this name already exists</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
          <select
            value={field.type}
            onChange={(e) => update({ type: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Format</label>
          <input
            type="text"
            value={field.format}
            onChange={(e) => update({ format: e.target.value })}
            placeholder="e.g. date-time, email, uri"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
        <textarea
          value={field.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="What does this field represent?"
          rows={2}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
      </div>

      {field.type === 'string' && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Enum Values</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {field.enumValues.map((v) => (
              <span key={v} className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 text-xs rounded-full border border-amber-200">
                {v}
                <button onClick={() => removeEnum(v)} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
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
      )}

      {(field.type === 'integer' || field.type === 'number') && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Minimum Value</label>
          <input
            type="number"
            value={field.minimum}
            onChange={(e) => update({ minimum: e.target.value })}
            placeholder="0"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          />
        </div>
      )}

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <button
            type="button"
            onClick={() => update({ nullable: !field.nullable })}
            className={`relative w-8 h-5 rounded-full transition-colors ${field.nullable ? 'bg-amber-500' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${field.nullable ? 'left-3.5' : 'left-0.5'}`} />
          </button>
          <span className="text-xs text-slate-600">Nullable</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <button
            type="button"
            onClick={() => update({ required: !field.required })}
            className={`relative w-8 h-5 rounded-full transition-colors ${field.required ? 'bg-amber-500' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${field.required ? 'left-3.5' : 'left-0.5'}`} />
          </button>
          <span className="text-xs text-slate-600">Required</span>
        </label>
      </div>
    </div>
  );
}

export function buildAddFieldPayload(field: { name: string; type: string; format: string; description: string; nullable: boolean; required: boolean; enumValues: string[]; minimum: string }) {
  const prop: Record<string, unknown> = { type: field.type };
  if (field.format) prop.format = field.format;
  if (field.description) prop.description = field.description;
  if (field.nullable) prop.nullable = true;
  if (field.enumValues.length > 0) prop.enum = field.enumValues;
  if (field.minimum && (field.type === 'integer' || field.type === 'number')) {
    prop.minimum = parseFloat(field.minimum);
  }

  return {
    field_path: `data.${field.name}`,
    current_value: {},
    proposed_value: { [field.name]: prop, _required: field.required },
  };
}
