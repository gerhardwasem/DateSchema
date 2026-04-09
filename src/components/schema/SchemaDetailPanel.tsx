import { useState, useMemo } from 'react';
import { X, Plus, Save, Tag, ChevronDown, ChevronRight, Clock, User, Lightbulb, ArrowLeftRight, Pencil, Check, Trash2 } from 'lucide-react';
import type { SchemaType, Annotation, ChangeProposal, SchemaVersion } from '../../lib/types';
import { COMPONENT_COLORS } from '../../lib/schema-relationships';
import { useSchemaVersions } from '../../hooks/useSchemaVersions';
import FieldDetail from './FieldDetail';
import ProposalCard from './ProposalCard';

interface Props {
  schema: SchemaType;
  annotations: Annotation[];
  proposals: ChangeProposal[];
  schemaTypes: SchemaType[];
  onClose: () => void;
  onAddAnnotation: (schemaTypeId: string, fieldPath: string | null, note: string, priority: Annotation['priority'], tags: string[]) => Promise<boolean>;
  onDeleteAnnotation: (id: string) => Promise<boolean>;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => Promise<boolean>;
  onProposeChange: (fieldPath?: string | null) => void;
  onConvertAnnotation: (annotation: Annotation) => void;
  onEditProposal?: (id: string, updates: Partial<ChangeProposal>) => Promise<boolean>;
  onDeleteProposal?: (id: string) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
}

function VersionTimeline({ versions }: { versions: SchemaVersion[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (versions.length === 0) {
    return <p className="text-xs text-slate-400 italic">No version history yet</p>;
  }

  return (
    <div className="relative">
      <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200" />
      <div className="space-y-2">
        {versions.map((v) => (
          <div key={v.id} className="relative pl-7">
            <div className="absolute left-0 top-2 w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center">
              <span className="text-[8px] font-bold text-slate-500">v{v.version_number}</span>
            </div>
            <div
              className="rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50/50 transition-colors"
              onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
            >
              <div className="flex items-center gap-2 px-3 py-2">
                {expandedId === v.id ? (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                )}
                <span className="text-xs font-medium text-slate-700 flex-1 truncate">
                  {v.change_summary || `Version ${v.version_number}`}
                </span>
                <span className="text-xs text-slate-400">{formatDate(v.created_at)}</span>
              </div>
              {expandedId === v.id && (
                <div className="px-3 pb-2 border-t border-slate-100 pt-2">
                  {v.actor && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                      <User className="w-3 h-3" /> {v.actor}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mb-1">Schema snapshot:</p>
                  <pre className="text-xs font-mono bg-slate-50 p-2 rounded overflow-auto max-h-32 text-slate-600">
                    {JSON.stringify(v.json_schema, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SchemaDetailPanel({
  schema,
  annotations,
  proposals,
  schemaTypes,
  onClose,
  onAddAnnotation,
  onDeleteAnnotation,
  onUpdateAnnotation,
  onProposeChange,
  onConvertAnnotation,
  onEditProposal,
  onDeleteProposal,
  onDelete,
}: Props) {
  const [annotating, setAnnotating] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [notePriority, setNotePriority] = useState<Annotation['priority']>('nice-to-have');
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [proposalsOpen, setProposalsOpen] = useState(true);

  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [editAnnotationNote, setEditAnnotationNote] = useState('');
  const [editAnnotationPriority, setEditAnnotationPriority] = useState<Annotation['priority']>('nice-to-have');
  const [savingAnnotation, setSavingAnnotation] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { versions } = useSchemaVersions(schema.id);
  const color = COMPONENT_COLORS[schema.type_key] || '#64748b';
  const typeAnnotations = annotations.filter((a) => a.schema_type_id === schema.id);
  const typeLevel = typeAnnotations.filter((a) => !a.field_path);
  const typeProposals = useMemo(
    () => proposals.filter((p) => p.schema_type_id === schema.id && !p.hidden),
    [proposals, schema.id]
  );

  const handleSaveAnnotation = async () => {
    if (!noteText.trim()) return;
    await onAddAnnotation(schema.id, annotating === '__type__' ? null : annotating, noteText, notePriority, []);
    setAnnotating(null);
    setNoteText('');
    setNotePriority('nice-to-have');
  };

  const handleFieldAnnotation = (fieldPath: string) => {
    setAnnotating(fieldPath);
    setNoteText('');
    setNotePriority('nice-to-have');
  };

  const startEditAnnotation = (ann: Annotation) => {
    setEditingAnnotationId(ann.id);
    setEditAnnotationNote(ann.note);
    setEditAnnotationPriority(ann.priority);
  };

  const cancelEditAnnotation = () => {
    setEditingAnnotationId(null);
    setEditAnnotationNote('');
  };

  const saveEditAnnotation = async () => {
    if (!editingAnnotationId || !editAnnotationNote.trim()) return;
    setSavingAnnotation(true);
    const ok = await onUpdateAnnotation(editingAnnotationId, {
      note: editAnnotationNote.trim(),
      priority: editAnnotationPriority,
    });
    if (ok) {
      setEditingAnnotationId(null);
      setEditAnnotationNote('');
    }
    setSavingAnnotation(false);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
            <h2 className="font-semibold text-lg text-slate-900">{schema.display_name}</h2>
            {schema.source === 'proposal' && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-50 text-amber-600 border border-amber-200/60">
                proposed
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onDelete && !confirmDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                title="Delete schema type"
              >
                <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
              </button>
            )}
            {onDelete && confirmDelete && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1">
                <span className="text-xs text-red-700 font-medium">Delete?</span>
                <button
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    await onDelete(schema.id);
                    setDeleting(false);
                    onClose();
                  }}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                >
                  {deleting ? '...' : 'Yes'}
                </button>
                <span className="text-red-300">|</span>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  No
                </button>
              </div>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">{schema.description}</p>
        <div className="flex items-center gap-2 mt-3">
          <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">{schema.type_key}</code>
          {schema.parent_types.length > 0 && (
            <span className="text-xs text-slate-400">
              parent: {schema.parent_types.join(', ')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => onProposeChange(null)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <Lightbulb className="w-3 h-3" />
            Apply Change
          </button>
        </div>
      </div>

      {typeLevel.length > 0 && (
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-2">Type-level Notes</p>
          {typeLevel.map((ann) => (
            <div key={ann.id} className="mb-2">
              {editingAnnotationId === ann.id ? (
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <textarea
                    value={editAnnotationNote}
                    onChange={(e) => setEditAnnotationNote(e.target.value)}
                    rows={2}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={editAnnotationPriority}
                      onChange={(e) => setEditAnnotationPriority(e.target.value as Annotation['priority'])}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    >
                      <option value="must-have">Must Have</option>
                      <option value="nice-to-have">Nice to Have</option>
                      <option value="future">Future</option>
                    </select>
                    <div className="flex-1" />
                    <button
                      onClick={cancelEditAnnotation}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </button>
                    <button
                      onClick={saveEditAnnotation}
                      disabled={savingAnnotation || !editAnnotationNote.trim()}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      {savingAnnotation ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group flex items-start gap-2">
                  <div className={`flex-1 px-3 py-2 rounded-lg text-xs badge-${ann.priority}`}>
                    {ann.note}
                  </div>
                  <button
                    onClick={() => startEditAnnotation(ann)}
                    title="Edit note"
                    className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onConvertAnnotation(ann)}
                    title="Convert to proposal"
                    className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDeleteAnnotation(ann.id)}
                    title="Delete note"
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fields</h3>
            <button
              onClick={() => {
                setAnnotating('__type__');
                setNoteText('');
              }}
              className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700"
            >
              <Plus className="w-3 h-3" />
              Add Note
            </button>
          </div>

          {Object.entries(schema.json_schema.properties || {}).map(([key, value]) => (
            <FieldDetail
              key={key}
              fieldName={key}
              fieldPath={`data.${key}`}
              property={value}
              annotations={typeAnnotations}
              proposals={typeProposals}
              onAddAnnotation={handleFieldAnnotation}
              onUpdateAnnotation={onUpdateAnnotation}
              onDeleteAnnotation={onDeleteAnnotation}
              onProposeChange={onProposeChange}
              onConvertAnnotation={onConvertAnnotation}
            />
          ))}

          {schema.json_schema.required && schema.json_schema.required.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-2">Required Fields</p>
              <div className="flex flex-wrap gap-1.5">
                {schema.json_schema.required.map((field) => (
                  <code key={field} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-mono">
                    {field}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100">
          <button
            onClick={() => setProposalsOpen(!proposalsOpen)}
            className="flex items-center gap-2 w-full mb-3"
          >
            {proposalsOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Applied Changes ({typeProposals.length})
            </h3>
          </button>
          {proposalsOpen && (
            typeProposals.length > 0 ? (
              <div className="space-y-2">
                {typeProposals.map((p) => (
                  <div key={p.id} id={`proposal-${p.id}`} className="transition-all duration-300 rounded-xl">
                    <ProposalCard
                      proposal={p}
                      schemaTypes={schemaTypes}
                      onEdit={onEditProposal}
                      onDelete={onDeleteProposal}
                      compact
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <Lightbulb className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-xs text-slate-400">No changes applied to this component yet</p>
                <button
                  onClick={() => onProposeChange(null)}
                  className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Apply a change
                </button>
              </div>
            )
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100">
          <button
            onClick={() => setVersionsOpen(!versionsOpen)}
            className="flex items-center gap-2 w-full mb-3"
          >
            {versionsOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Version History ({versions.length})
            </h3>
          </button>
          {versionsOpen && <VersionTimeline versions={versions} />}
        </div>
      </div>

      {annotating !== null && (
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-cyan-500" />
            <span className="text-sm font-medium text-slate-700">
              {annotating === '__type__' ? `Note on ${schema.display_name}` : `Note on ${annotating}`}
            </span>
          </div>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
            rows={3}
            placeholder="Add your product note, acceptance criteria, or context..."
            autoFocus
          />
          <div className="flex items-center gap-2 mt-2">
            <select
              value={notePriority}
              onChange={(e) => setNotePriority(e.target.value as Annotation['priority'])}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
            >
              <option value="must-have">Must Have</option>
              <option value="nice-to-have">Nice to Have</option>
              <option value="future">Future</option>
            </select>
            <div className="flex-1" />
            <button
              onClick={() => setAnnotating(null)}
              className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAnnotation}
              disabled={!noteText.trim()}
              className="flex items-center gap-1.5 text-xs bg-cyan-600 text-white px-3 py-1.5 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
