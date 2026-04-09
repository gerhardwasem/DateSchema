import { useState, useMemo } from 'react';
import {
  X,
  Lightbulb,
  PlusCircle,
  Pencil,
  Trash2,
  Link,
  Unlink,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import type { SchemaType, ChangeType } from '../../lib/types';
import { COMPONENT_COLORS } from '../../lib/schema-relationships';
import AddFieldForm, { buildAddFieldPayload } from './proposal-forms/AddFieldForm';
import ModifyFieldForm, { buildModifyFieldPayload } from './proposal-forms/ModifyFieldForm';
import RemoveFieldForm, { buildRemoveFieldPayload } from './proposal-forms/RemoveFieldForm';
import { AddRelationshipForm, RemoveRelationshipForm, buildAddRelPayload, buildRemoveRelPayload } from './proposal-forms/RelationshipForms';
import ModifyTypeForm, { buildModifyTypePayload } from './proposal-forms/ModifyTypeForm';
import SchemaPreview, { type FieldDiff } from './SchemaPreview';

interface Props {
  schema: SchemaType;
  schemaTypes: SchemaType[];
  fieldPath?: string | null;
  defaultChangeType?: ChangeType;
  defaultRationale?: string;
  defaultPriority?: 'must-have' | 'nice-to-have' | 'future';
  onClose: () => void;
  onSubmit: (proposal: {
    schema_type_id: string;
    change_type: ChangeType;
    field_path?: string | null;
    title: string;
    rationale: string;
    proposed_value: Record<string, unknown>;
    current_value: Record<string, unknown>;
    priority: 'must-have' | 'nice-to-have' | 'future';
    tags?: string[];
    actor: string;
  }) => Promise<boolean>;
}

const CHANGE_TYPES: {
  value: ChangeType;
  label: string;
  description: string;
  icon: typeof PlusCircle;
  color: string;
}[] = [
  { value: 'add_field', label: 'Add Field', description: 'Add a new property to this component', icon: PlusCircle, color: 'emerald' },
  { value: 'modify_field', label: 'Modify Field', description: 'Change an existing field definition', icon: Pencil, color: 'amber' },
  { value: 'remove_field', label: 'Remove Field', description: 'Remove one or more fields', icon: Trash2, color: 'red' },
  { value: 'add_relationship', label: 'Add Relationship', description: 'Connect to another component', icon: Link, color: 'blue' },
  { value: 'remove_relationship', label: 'Remove Relationship', description: 'Disconnect from a component', icon: Unlink, color: 'red' },
  { value: 'modify_type', label: 'Modify Type', description: 'Change name, description, or parents', icon: Settings, color: 'slate' },
];

const COLOR_MAP: Record<string, string> = {
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
  amber: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
  red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
  blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
  slate: 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100',
};

const ACTIVE_MAP: Record<string, string> = {
  emerald: 'bg-emerald-100 border-emerald-400 text-emerald-800 ring-2 ring-emerald-300',
  amber: 'bg-amber-100 border-amber-400 text-amber-800 ring-2 ring-amber-300',
  red: 'bg-red-100 border-red-400 text-red-800 ring-2 ring-red-300',
  blue: 'bg-blue-100 border-blue-400 text-blue-800 ring-2 ring-blue-300',
  slate: 'bg-slate-100 border-slate-400 text-slate-800 ring-2 ring-slate-300',
};

export default function ProposeChangeDialog({
  schema,
  schemaTypes,
  fieldPath,
  defaultChangeType,
  defaultRationale,
  defaultPriority,
  onClose,
  onSubmit,
}: Props) {
  const [step, setStep] = useState<'type' | 'form'>(defaultChangeType ? 'form' : 'type');
  const [changeType, setChangeType] = useState<ChangeType>(defaultChangeType || 'modify_field');
  const [rationale, setRationale] = useState(defaultRationale || '');
  const [saving, setSaving] = useState(false);

  const [addFieldData, setAddFieldData] = useState<Parameters<typeof buildAddFieldPayload>[0] | null>(null);
  const [modifyFieldData, setModifyFieldData] = useState<Parameters<typeof buildModifyFieldPayload>[0] | null>(null);
  const [removeFieldData, setRemoveFieldData] = useState<string[]>([]);
  const [addRelData, setAddRelData] = useState<{ toTypeKey: string; label: string } | null>(null);
  const [removeRelData, setRemoveRelData] = useState<{ from: string; to: string; label: string } | null>(null);
  const [modifyTypeData, setModifyTypeData] = useState<{ display_name: string; description: string; parent_types: string[] } | null>(null);

  const color = COMPONENT_COLORS[schema.type_key] || '#64748b';

  const previewDiffs = useMemo((): FieldDiff[] => {
    const properties = schema.json_schema.properties || {};
    const fieldNames = Object.keys(properties);

    if (changeType === 'add_field' && addFieldData && addFieldData.name) {
      const diffs: FieldDiff[] = fieldNames.map((name) => ({ fieldName: name, status: 'unchanged' as const }));
      if (!fieldNames.includes(addFieldData.name)) {
        const prop: Record<string, unknown> = { type: addFieldData.type };
        if (addFieldData.format) prop.format = addFieldData.format;
        if (addFieldData.description) prop.description = addFieldData.description;
        diffs.push({ fieldName: addFieldData.name, status: 'added', newValue: prop });
      }
      return diffs;
    }

    if (changeType === 'modify_field' && modifyFieldData) {
      return fieldNames.map((name) => ({
        fieldName: name,
        status: name === modifyFieldData.fieldName ? 'modified' as const : 'unchanged' as const,
      }));
    }

    if (changeType === 'remove_field' && removeFieldData.length > 0) {
      const removed = new Set(removeFieldData);
      return fieldNames.map((name) => ({
        fieldName: name,
        status: removed.has(name) ? 'removed' as const : 'unchanged' as const,
      }));
    }

    return fieldNames.map((name) => ({ fieldName: name, status: 'unchanged' as const }));
  }, [schema, changeType, addFieldData, modifyFieldData, removeFieldData]);

  const autoTitle = useMemo(() => {
    const typeName = schema.display_name;
    switch (changeType) {
      case 'add_field':
        return addFieldData?.name ? `Add field '${addFieldData.name}' to ${typeName}` : `Add field to ${typeName}`;
      case 'modify_field':
        return modifyFieldData?.fieldName ? `Modify '${modifyFieldData.fieldName}' on ${typeName}` : `Modify field on ${typeName}`;
      case 'remove_field':
        return removeFieldData.length > 0 ? `Remove ${removeFieldData.join(', ')} from ${typeName}` : `Remove field from ${typeName}`;
      case 'add_relationship':
        return addRelData ? `Add relationship to ${addRelData.toTypeKey}` : `Add relationship on ${typeName}`;
      case 'remove_relationship':
        return removeRelData ? `Remove relationship ${removeRelData.from} -> ${removeRelData.to}` : `Remove relationship on ${typeName}`;
      case 'modify_type':
        return `Modify type ${typeName}`;
      default:
        return `Change on ${typeName}`;
    }
  }, [schema, changeType, addFieldData, modifyFieldData, removeFieldData, addRelData, removeRelData]);

  const canSubmit = useMemo(() => {
    switch (changeType) {
      case 'add_field': return addFieldData !== null && addFieldData.name.trim() !== '';
      case 'modify_field': return modifyFieldData !== null;
      case 'remove_field': return removeFieldData.length > 0;
      case 'add_relationship': return addRelData !== null;
      case 'remove_relationship': return removeRelData !== null;
      case 'modify_type': return modifyTypeData !== null;
      default: return false;
    }
  }, [changeType, addFieldData, modifyFieldData, removeFieldData, addRelData, removeRelData, modifyTypeData]);

  const handleSelectType = (ct: ChangeType) => {
    setChangeType(ct);
    setStep('form');
  };

  const getPayload = () => {
    switch (changeType) {
      case 'add_field':
        return addFieldData ? buildAddFieldPayload(addFieldData) : null;
      case 'modify_field':
        return modifyFieldData ? buildModifyFieldPayload(modifyFieldData) : null;
      case 'remove_field':
        return removeFieldData.length > 0 ? buildRemoveFieldPayload(schema, removeFieldData) : null;
      case 'add_relationship':
        return addRelData ? buildAddRelPayload(schema, addRelData) : null;
      case 'remove_relationship':
        return removeRelData ? buildRemoveRelPayload(removeRelData) : null;
      case 'modify_type':
        return modifyTypeData ? buildModifyTypePayload(schema, modifyTypeData) : null;
      default:
        return null;
    }
  };

  const handleSave = async () => {
    const payload = getPayload();
    if (!payload) return;

    setSaving(true);
    const success = await onSubmit({
      schema_type_id: schema.id,
      change_type: changeType,
      field_path: payload.field_path,
      title: autoTitle,
      rationale,
      proposed_value: payload.proposed_value,
      current_value: payload.current_value,
      priority: defaultPriority || 'nice-to-have',
      tags: [],
      actor: 'system',
    });
    setSaving(false);
    if (success) onClose();
  };

  const showPreview = ['add_field', 'modify_field', 'remove_field'].includes(changeType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] transition-all duration-300 ${
        step === 'form' && showPreview ? 'w-full max-w-4xl' : 'w-full max-w-lg'
      }`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            {step === 'form' && !defaultChangeType && (
              <button
                onClick={() => setStep('type')}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
              </button>
            )}
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {step === 'type' ? 'Apply Change' : CHANGE_TYPES.find((c) => c.value === changeType)?.label}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-slate-500">{schema.display_name}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {step === 'type' ? (
          <div className="p-6">
            <p className="text-sm text-slate-500 mb-4">What kind of change do you want to make?</p>
            <div className="grid grid-cols-2 gap-3">
              {CHANGE_TYPES.map((ct) => {
                const Icon = ct.icon;
                const isActive = changeType === ct.value;
                return (
                  <button
                    key={ct.value}
                    onClick={() => handleSelectType(ct.value)}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
                      isActive ? ACTIVE_MAP[ct.color] : COLOR_MAP[ct.color]
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">{ct.label}</p>
                      <p className="text-xs opacity-70 mt-0.5">{ct.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className={`flex-1 overflow-auto flex min-h-0`}>
              <div className={`flex-1 overflow-auto px-6 py-5 space-y-4 ${showPreview ? 'border-r border-slate-200' : ''}`}>
                {changeType === 'add_field' && (
                  <AddFieldForm schema={schema} onChange={setAddFieldData} />
                )}
                {changeType === 'modify_field' && (
                  <ModifyFieldForm schema={schema} preselectedField={fieldPath} onChange={setModifyFieldData} />
                )}
                {changeType === 'remove_field' && (
                  <RemoveFieldForm schema={schema} onChange={setRemoveFieldData} />
                )}
                {changeType === 'add_relationship' && (
                  <AddRelationshipForm schema={schema} schemaTypes={schemaTypes} onChange={setAddRelData} />
                )}
                {changeType === 'remove_relationship' && (
                  <RemoveRelationshipForm schema={schema} schemaTypes={schemaTypes} onChange={setRemoveRelData} />
                )}
                {changeType === 'modify_type' && (
                  <ModifyTypeForm schema={schema} allTypeKeys={schemaTypes.map((s) => s.type_key)} onChange={setModifyTypeData} />
                )}

                <div className="border-t border-slate-200 pt-3">
                  <textarea
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="Rationale (optional)"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {showPreview && (
                <div className="w-72 shrink-0 p-4 overflow-auto bg-slate-50/50">
                  <SchemaPreview schema={schema} diffs={previewDiffs} />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-400 truncate max-w-[260px]">
                {canSubmit && autoTitle}
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
                  disabled={saving || !canSubmit}
                  className="px-5 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Applying...' : 'Apply Change'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
