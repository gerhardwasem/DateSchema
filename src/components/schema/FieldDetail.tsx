import { useState, useMemo } from 'react';
import type { SchemaProperty, Annotation, ChangeProposal } from '../../lib/types';
import {
  Hash, ToggleLeft, Type, List, Braces, MessageSquare,
  Plus, Lightbulb, ArrowLeftRight, Pencil, Trash2, Check, X,
} from 'lucide-react';

interface Props {
  fieldName: string;
  fieldPath: string;
  property: SchemaProperty;
  annotations: Annotation[];
  proposals?: ChangeProposal[];
  onAddAnnotation: (fieldPath: string) => void;
  onUpdateAnnotation?: (id: string, updates: Partial<Annotation>) => Promise<boolean>;
  onDeleteAnnotation?: (id: string) => Promise<boolean>;
  onProposeChange?: (fieldPath: string) => void;
  onConvertAnnotation?: (annotation: Annotation) => void;
  depth?: number;
}

const typeIcons: Record<string, typeof Hash> = {
  integer: Hash,
  number: Hash,
  boolean: ToggleLeft,
  string: Type,
  array: List,
  object: Braces,
};

export function getTypeLabel(prop: SchemaProperty): string {
  let label = prop.type;
  if (prop.format) label += ` (${prop.format})`;
  if (prop.enum) label += ` [${prop.enum.join(' | ')}]`;
  if (prop.nullable) label += ' ?';
  if (prop.minimum !== undefined) label += ` min:${prop.minimum}`;
  return label;
}

export default function FieldDetail({
  fieldName,
  fieldPath,
  property,
  annotations,
  proposals = [],
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onProposeChange,
  onConvertAnnotation,
  depth = 0,
}: Props) {
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [editAnnNote, setEditAnnNote] = useState('');
  const [editAnnPriority, setEditAnnPriority] = useState<Annotation['priority']>('nice-to-have');
  const [savingAnn, setSavingAnn] = useState(false);

  const Icon = typeIcons[property.type] || Type;
  const fieldAnnotations = annotations.filter((a) => a.field_path === fieldPath);

  const isProposedField = useMemo(() => {
    return proposals.some(
      (p) => p.change_type === 'add_field' && p.status === 'implemented' &&
        Object.keys(p.proposed_value).some((k) => k !== '_required' && k === fieldName)
    );
  }, [proposals, fieldName]);

  const startEditAnn = (ann: Annotation) => {
    setEditingAnnId(ann.id);
    setEditAnnNote(ann.note);
    setEditAnnPriority(ann.priority);
  };

  const saveEditAnn = async () => {
    if (!onUpdateAnnotation || !editingAnnId || !editAnnNote.trim()) return;
    setSavingAnn(true);
    const ok = await onUpdateAnnotation(editingAnnId, { note: editAnnNote.trim(), priority: editAnnPriority });
    if (ok) setEditingAnnId(null);
    setSavingAnn(false);
  };

  return (
    <div className={depth > 0 ? 'ml-4 border-l border-slate-200 pl-4' : ''}>
      <div className={`group flex items-start gap-3 py-2 rounded-lg px-2 -mx-2 transition-colors hover:bg-slate-50`}>
        <Icon className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-xs font-mono font-medium text-slate-800">
              {fieldName}
            </code>
            <span className="text-xs text-slate-400">
              {getTypeLabel(property)}
            </span>

            {isProposedField && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Added via proposal" />
            )}

            {fieldAnnotations.length > 0 && (
              <span className="flex items-center gap-1 text-cyan-500 text-xs">
                <MessageSquare className="w-3 h-3" />
                {fieldAnnotations.length}
              </span>
            )}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex items-center gap-0.5">
              {onProposeChange && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onProposeChange(fieldPath);
                  }}
                  title="Apply change"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-slate-400 hover:text-amber-500" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddAnnotation(fieldPath);
                }}
              >
                <Plus className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-500" />
              </button>
            </div>
          </div>
          {property.description && (
            <p className="text-xs text-slate-400 mt-0.5">{property.description}</p>
          )}

          {fieldAnnotations.map((ann) => (
            <div key={ann.id} className="mt-1.5">
              {editingAnnId === ann.id ? (
                <div className="p-2 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <textarea
                    value={editAnnNote}
                    onChange={(e) => setEditAnnNote(e.target.value)}
                    rows={2}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-1.5">
                    <select
                      value={editAnnPriority}
                      onChange={(e) => setEditAnnPriority(e.target.value as Annotation['priority'])}
                      className="text-[10px] border border-slate-200 rounded px-1.5 py-0.5 outline-none"
                    >
                      <option value="must-have">Must Have</option>
                      <option value="nice-to-have">Nice to Have</option>
                      <option value="future">Future</option>
                    </select>
                    <div className="flex-1" />
                    <button
                      onClick={() => setEditingAnnId(null)}
                      className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <button
                      onClick={saveEditAnn}
                      disabled={savingAnn || !editAnnNote.trim()}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50 transition-colors"
                    >
                      <Check className="w-2.5 h-2.5" />
                      {savingAnn ? '...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-1">
                  <div className={`flex-1 px-2 py-1 rounded text-xs badge-${ann.priority}`}>
                    {ann.note}
                  </div>
                  {onUpdateAnnotation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditAnn(ann);
                      }}
                      title="Edit note"
                      className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                  {onConvertAnnotation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onConvertAnnotation(ann);
                      }}
                      title="Convert to proposal"
                      className="p-0.5 text-slate-400 hover:text-amber-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                    </button>
                  )}
                  {onDeleteAnnotation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAnnotation(ann.id);
                      }}
                      title="Delete note"
                      className="p-0.5 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {property.type === 'object' && property.properties && (
        <div className="mt-1">
          {Object.entries(property.properties).map(([key, val]) => (
            <FieldDetail
              key={key}
              fieldName={key}
              fieldPath={`${fieldPath}.${key}`}
              property={val as SchemaProperty}
              annotations={annotations}
              proposals={proposals}
              onAddAnnotation={onAddAnnotation}
              onUpdateAnnotation={onUpdateAnnotation}
              onDeleteAnnotation={onDeleteAnnotation}
              onProposeChange={onProposeChange}
              onConvertAnnotation={onConvertAnnotation}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
