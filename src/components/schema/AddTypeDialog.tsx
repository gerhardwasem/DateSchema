import { useState, useMemo } from 'react';
import { X, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import type { SchemaType, ChangeType } from '../../lib/types';
import { COMPONENT_COLORS } from '../../lib/schema-relationships';
import CreateTypeForm, { type CreateTypeFormData } from './proposal-forms/CreateTypeForm';

interface Props {
  schemaTypes: SchemaType[];
  onClose: () => void;
  onCreate: (input: {
    type_key: string;
    display_name: string;
    description: string;
    parent_types: string[];
    json_schema: Record<string, unknown>;
  }) => Promise<{ success: boolean; error?: string }>;
  onCreateWithProposal?: (proposal: {
    schema_type_id: string;
    change_type: ChangeType;
    field_path: null;
    title: string;
    rationale: string;
    proposed_value: Record<string, unknown>;
    current_value: Record<string, unknown>;
    priority: 'must-have' | 'nice-to-have' | 'future';
    tags?: string[];
    actor: string;
  }) => Promise<boolean>;
  metaTypeId?: string;
}

export default function AddTypeDialog({ schemaTypes, onClose, onCreate, onCreateWithProposal, metaTypeId }: Props) {
  const [formData, setFormData] = useState<CreateTypeFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rationale, setRationale] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);

  const usedColors = useMemo(
    () => schemaTypes.map((s) => COMPONENT_COLORS[s.type_key]).filter(Boolean),
    [schemaTypes]
  );

  const handleSave = async () => {
    if (!formData) return;
    setError(null);

    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    formData.fields.forEach((f) => {
      if (!f.name.trim()) return;
      const prop: Record<string, unknown> = { type: f.type };
      if (f.nullable) prop.nullable = true;
      properties[f.name] = prop;
      if (f.required) required.push(f.name);
    });

    const jsonSchema = { properties, ...(required.length ? { required } : {}) };

    setSaving(true);

    if (onCreateWithProposal && metaTypeId) {
      const success = await onCreateWithProposal({
        schema_type_id: metaTypeId,
        change_type: 'create_type',
        field_path: null,
        title: `Create type: ${formData.display_name}`,
        rationale: rationale.trim(),
        proposed_value: {
          type_key: formData.type_key,
          display_name: formData.display_name,
          description: formData.description,
          color: formData.color,
          parent_types: formData.parent_types,
          json_schema: jsonSchema,
        },
        current_value: {},
        priority: 'nice-to-have',
        tags: [],
        actor: 'system',
      });
      setSaving(false);
      if (success) onClose();
      else setError('Could not create type.');
    } else {
      const result = await onCreate({
        type_key: formData.type_key,
        display_name: formData.display_name,
        description: formData.description,
        parent_types: formData.parent_types,
        json_schema: jsonSchema,
      });
      setSaving(false);
      if (result.success) onClose();
      else setError(result.error || 'Could not create type.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] w-full max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
              <Plus className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Add Schema Type</h2>
              <p className="text-xs text-slate-500 mt-0.5">Create a new component type</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
          <CreateTypeForm
            allSchemaTypes={schemaTypes}
            usedColors={usedColors}
            onChange={setFormData}
          />

          <div className="border-t border-slate-200 pt-4">
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors w-full"
            >
              {detailsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              Rationale (optional)
            </button>

            {detailsOpen && (
              <div className="mt-3">
                <textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Why is this type needed?"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                />
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-red-500">
            {error && <span>{error}</span>}
            {!error && !formData && <span className="text-slate-400">Display name and type key required</span>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData}
              className="px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Creating...' : 'Create Type'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
