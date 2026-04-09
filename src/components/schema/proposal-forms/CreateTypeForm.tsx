import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { SchemaType } from '../../../lib/types';
import { PRESET_COLORS } from '../../../lib/schema-relationships';

const FIELD_TYPES = ['string', 'number', 'integer', 'boolean', 'array', 'object'] as const;

export interface CreateTypeField {
  name: string;
  type: string;
  required: boolean;
  nullable: boolean;
}

export interface CreateTypeFormData {
  display_name: string;
  type_key: string;
  description: string;
  color: string;
  parent_types: string[];
  fields: CreateTypeField[];
}

interface Props {
  allSchemaTypes: SchemaType[];
  usedColors: string[];
  onChange: (data: CreateTypeFormData | null) => void;
}

function toTypeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function CreateTypeForm({ allSchemaTypes, usedColors, onChange }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [typeKey, setTypeKey] = useState('');
  const [typeKeyManuallyEdited, setTypeKeyManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [parentTypes, setParentTypes] = useState<string[]>([]);
  const [fields, setFields] = useState<CreateTypeField[]>([]);

  useEffect(() => {
    const available = PRESET_COLORS.find((c) => !usedColors.includes(c));
    setSelectedColor(available || PRESET_COLORS[0]);
  }, [usedColors]);

  useEffect(() => {
    if (!typeKeyManuallyEdited) {
      setTypeKey(toTypeKey(displayName));
    }
  }, [displayName, typeKeyManuallyEdited]);

  const isDuplicateKey = typeKey.trim() !== '' && allSchemaTypes.some((s) => s.type_key === typeKey.trim());

  const emitChange = useCallback(() => {
    if (!displayName.trim() || !typeKey.trim() || isDuplicateKey) {
      onChange(null);
      return;
    }
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    fields.forEach((f) => {
      if (!f.name.trim()) return;
      const prop: Record<string, unknown> = { type: f.type };
      if (f.nullable) prop.nullable = true;
      properties[f.name] = prop;
      if (f.required) required.push(f.name);
    });

    onChange({
      display_name: displayName.trim(),
      type_key: typeKey.trim(),
      description: description.trim(),
      color: selectedColor,
      parent_types: parentTypes,
      fields,
    });
  }, [displayName, typeKey, description, selectedColor, parentTypes, fields, isDuplicateKey, onChange]);

  useEffect(() => {
    emitChange();
  }, [emitChange]);

  const addField = () => {
    setFields((prev) => [...prev, { name: '', type: 'string', required: false, nullable: false }]);
  };

  const removeField = (i: number) => {
    setFields((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateField = (i: number, updates: Partial<CreateTypeField>) => {
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...updates } : f)));
  };

  const toggleParent = (key: string) => {
    setParentTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const visibleTypes = allSchemaTypes.filter((s) => s.type_key !== '_meta');

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Display Name *</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Sustainability Goals"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Type Key *</label>
          <input
            type="text"
            value={typeKey}
            onChange={(e) => {
              setTypeKey(e.target.value);
              setTypeKeyManuallyEdited(true);
            }}
            placeholder="e.g. sustainability-goals"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none font-mono"
          />
          {typeKey.trim() && allSchemaTypes.some((s) => s.type_key === typeKey.trim()) ? (
            <p className="text-xs text-red-500 mt-1">This key is already in use</p>
          ) : (
            <p className="text-xs text-slate-400 mt-1">Auto-generated from name</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this component represent?"
          rows={2}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedColor(c)}
              style={{ backgroundColor: c }}
              className={`w-6 h-6 rounded-full transition-transform ${
                selectedColor === c
                  ? 'ring-2 ring-offset-2 ring-slate-500 scale-110'
                  : 'opacity-70 hover:opacity-100 hover:scale-105'
              }`}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Parent Types</label>
        <p className="text-xs text-slate-400 mb-2">Which existing types can contain this one?</p>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {visibleTypes.map((s) => (
            <button
              key={s.type_key}
              type="button"
              onClick={() => toggleParent(s.type_key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                parentTypes.includes(s.type_key)
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {s.display_name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-slate-600">Fields</label>
          <button
            type="button"
            onClick={addField}
            className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-800 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Field
          </button>
        </div>

        {fields.length === 0 ? (
          <div
            onClick={addField}
            className="flex items-center justify-center gap-2 py-4 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 cursor-pointer hover:border-cyan-300 hover:text-cyan-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Click to add the first field
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((field, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) =>
                      updateField(i, {
                        name: e.target.value.replace(/\s+/g, '_').toLowerCase(),
                      })
                    }
                    placeholder="field_name"
                    className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(i, { type: e.target.value })}
                    className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(i, { required: e.target.checked })}
                      className="rounded"
                    />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={field.nullable}
                      onChange={(e) => updateField(i, { nullable: e.target.checked })}
                      className="rounded"
                    />
                    Nullable
                  </label>
                  <button
                    type="button"
                    onClick={() => removeField(i)}
                    className="ml-auto p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
