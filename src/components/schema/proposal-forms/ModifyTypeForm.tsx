import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { SchemaType } from '../../../lib/types';

interface TypeChange {
  display_name: string;
  description: string;
  parent_types: string[];
}

interface Props {
  schema: SchemaType;
  allTypeKeys: string[];
  onChange: (change: TypeChange) => void;
}

export default function ModifyTypeForm({ schema, allTypeKeys, onChange }: Props) {
  const [displayName, setDisplayName] = useState(schema.display_name);
  const [description, setDescription] = useState(schema.description);
  const [parentTypes, setParentTypes] = useState<string[]>(schema.parent_types || []);
  const [parentInput, setParentInput] = useState('');

  useEffect(() => {
    onChange({ display_name: displayName, description, parent_types: parentTypes });
  }, [displayName, description, parentTypes]);

  const availableParents = allTypeKeys.filter(
    (k) => k !== schema.type_key && !parentTypes.includes(k)
  );

  const addParent = (key: string) => {
    setParentTypes([...parentTypes, key]);
    setParentInput('');
  };

  const removeParent = (key: string) => {
    setParentTypes(parentTypes.filter((p) => p !== key));
  };

  const isDiffName = displayName !== schema.display_name;
  const isDiffDesc = description !== schema.description;
  const isDiffParents = JSON.stringify(parentTypes) !== JSON.stringify(schema.parent_types || []);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Display Name
          {isDiffName && <span className="ml-1.5 text-amber-600">*</span>}
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none ${
            isDiffName ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'
          }`}
        />
        {isDiffName && <p className="text-xs text-slate-400 mt-0.5">was: {schema.display_name}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Description
          {isDiffDesc && <span className="ml-1.5 text-amber-600">*</span>}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none ${
            isDiffDesc ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'
          }`}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Parent Types
          {isDiffParents && <span className="ml-1.5 text-amber-600">*</span>}
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {parentTypes.map((p) => (
            <span key={p} className="flex items-center gap-1 px-2 py-0.5 bg-cyan-50 text-cyan-800 text-xs rounded-full border border-cyan-200">
              {p}
              <button onClick={() => removeParent(p)} className="hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {parentTypes.length === 0 && <span className="text-xs text-slate-400">No parent types</span>}
        </div>
        {availableParents.length > 0 && (
          <div className="flex gap-2">
            <select
              value={parentInput}
              onChange={(e) => {
                if (e.target.value) addParent(e.target.value);
              }}
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            >
              <option value="">Add parent type...</option>
              {availableParents.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

export function buildModifyTypePayload(schema: SchemaType, change: TypeChange) {
  return {
    field_path: null,
    current_value: {
      display_name: schema.display_name,
      description: schema.description,
      parent_types: schema.parent_types,
    },
    proposed_value: {
      display_name: change.display_name,
      description: change.description,
      parent_types: change.parent_types,
    },
  };
}
