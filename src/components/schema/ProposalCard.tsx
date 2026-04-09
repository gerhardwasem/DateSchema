import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Pencil,
  Trash2,
  Link,
  Unlink,
  Settings,
  Boxes,
  CheckCircle2,
  Clock,
  User,
  Eye,
  EyeOff,
  Code,
  X,
  AlertTriangle,
} from 'lucide-react';
import type { ChangeProposal, ChangeType, SchemaType } from '../../lib/types';
import { COMPONENT_COLORS } from '../../lib/schema-relationships';
import { useProposalComments } from '../../hooks/useProposalComments';
import ProposalCommentThread from './ProposalCommentThread';
import SchemaPreview, { computeDiffsFromProposal } from './SchemaPreview';

interface Props {
  proposal: ChangeProposal;
  schemaTypes: SchemaType[];
  onHide?: (id: string, hidden: boolean) => Promise<boolean>;
  onEdit?: (id: string, updates: Partial<ChangeProposal>) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  compact?: boolean;
}

const CHANGE_TYPE_CONFIG: Record<ChangeType, { icon: typeof PlusCircle; label: string }> = {
  add_field: { icon: PlusCircle, label: 'Add Field' },
  modify_field: { icon: Pencil, label: 'Modify Field' },
  remove_field: { icon: Trash2, label: 'Remove Field' },
  add_relationship: { icon: Link, label: 'Add Relationship' },
  remove_relationship: { icon: Unlink, label: 'Remove Relationship' },
  modify_type: { icon: Settings, label: 'Modify Type' },
  create_type: { icon: Boxes, label: 'Create Type' },
};

const FIELD_CHANGE_TYPES = new Set<ChangeType>(['add_field', 'modify_field', 'remove_field']);

function CreateTypePreview({ proposed }: { proposed: Record<string, unknown> }) {
  const pv = proposed as {
    display_name?: string;
    type_key?: string;
    description?: string;
    color?: string;
    parent_types?: string[];
    json_schema?: { properties?: Record<string, { type: string; nullable?: boolean }>; required?: string[] };
  };

  const properties = pv.json_schema?.properties || {};
  const required = new Set(pv.json_schema?.required || []);
  const fieldEntries = Object.entries(properties);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-3">
      <div className="flex items-center gap-2">
        {pv.color && (
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: pv.color }} />
        )}
        <span className="text-sm font-semibold text-slate-800">{pv.display_name || '--'}</span>
        {pv.type_key && (
          <code className="text-xs text-slate-400 font-mono">{pv.type_key}</code>
        )}
      </div>

      {pv.description && (
        <p className="text-xs text-slate-500 leading-relaxed">{pv.description}</p>
      )}

      {pv.parent_types && pv.parent_types.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400">Parents:</span>
          {pv.parent_types.map((pt) => (
            <span key={pt} className="px-2 py-0.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 font-mono">
              {pt}
            </span>
          ))}
        </div>
      )}

      {fieldEntries.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1.5">Fields ({fieldEntries.length})</p>
          <div className="space-y-1">
            {fieldEntries.map(([name, prop]) => (
              <div key={name} className="flex items-center gap-2 text-xs">
                <code className="font-mono text-slate-700">{name}</code>
                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded text-[10px]">{prop.type}</span>
                {required.has(name) && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">required</span>
                )}
                {prop.nullable && (
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">nullable</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {fieldEntries.length === 0 && (
        <p className="text-xs text-slate-400 italic">No fields defined</p>
      )}
    </div>
  );
}

export default function ProposalCard({ proposal, schemaTypes, onHide, onEdit, onDelete, compact }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editRationale, setEditRationale] = useState('');
  const [editPriority, setEditPriority] = useState<ChangeProposal['priority']>('nice-to-have');
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { comments, loading: commentsLoading, addComment, editComment, deleteComment } = useProposalComments(expanded ? proposal.id : undefined);

  const schema = schemaTypes.find((s) => s.id === proposal.schema_type_id);
  const isCreateType = proposal.change_type === 'create_type';
  const proposedColor = isCreateType
    ? (proposal.proposed_value as Record<string, unknown>)?.color as string | undefined
    : undefined;
  const color = proposedColor || (schema ? COMPONENT_COLORS[schema.type_key] || '#64748b' : '#64748b');
  const proposedDisplayName = isCreateType
    ? (proposal.proposed_value as Record<string, unknown>)?.display_name as string | undefined
    : undefined;
  const changeConfig = CHANGE_TYPE_CONFIG[proposal.change_type] || CHANGE_TYPE_CONFIG.modify_field;
  const ChangeIcon = changeConfig.icon;

  const canShowDiff = schema && FIELD_CHANGE_TYPES.has(proposal.change_type);
  const diffs = canShowDiff
    ? computeDiffsFromProposal(schema, proposal.change_type, proposal.current_value, proposal.proposed_value)
    : [];

  const startEditing = () => {
    setEditTitle(proposal.title);
    setEditRationale(proposal.rationale);
    setEditPriority(proposal.priority);
    setEditing(true);
    if (!expanded) setExpanded(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const saveEdits = async () => {
    if (!onEdit || !editTitle.trim()) return;
    setSaving(true);
    const ok = await onEdit(proposal.id, {
      title: editTitle.trim(),
      rationale: editRationale.trim(),
      priority: editPriority,
    });
    setSaving(false);
    if (ok) setEditing(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete(proposal.id);
    setDeleting(false);
    setConfirmDelete(false);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const canEdit = !!onEdit;
  const canDelete = !!onDelete;

  return (
    <div className={`rounded-xl border border-teal-200 ${proposal.hidden ? 'opacity-60' : ''} bg-white overflow-hidden transition-all`}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => !editing && setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        )}

        <ChangeIcon className="w-4 h-4 text-slate-500 shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-800 truncate">{proposal.title}</span>
            {proposal.hidden && (
              <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
          </div>
          {!compact && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-slate-500">
                  {isCreateType ? (proposedDisplayName || 'New Type') : (schema?.display_name ?? '')}
                </span>
              </span>
              {proposal.field_path && (
                <code className="text-xs text-slate-400 font-mono">{proposal.field_path}</code>
              )}
            </div>
          )}
        </div>

        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
          <CheckCircle2 className="w-3 h-3" />
          Applied
        </span>

        <span className={`badge-${proposal.priority} px-2 py-0.5 rounded-full text-xs font-medium`}>
          {proposal.priority}
        </span>

        <div className="flex items-center gap-0.5 shrink-0">
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startEditing();
              }}
              title="Edit proposal"
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
              title="Delete proposal"
              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onHide && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHide(proposal.id, !proposal.hidden);
              }}
              title={proposal.hidden ? 'Show proposal' : 'Hide proposal'}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {proposal.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="px-4 py-3 border-t border-red-100 bg-red-50/50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm font-medium text-red-700">Delete this proposal?</p>
          </div>
          <p className="text-xs text-red-600/80 mb-3">This action cannot be undone. All comments on this proposal will also be removed.</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="pt-3 space-y-3">
            {editing ? (
              <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Rationale</label>
                  <textarea
                    value={editRationale}
                    onChange={(e) => setEditRationale(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as ChangeProposal['priority'])}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  >
                    <option value="must-have">Must Have</option>
                    <option value="nice-to-have">Nice to Have</option>
                    <option value="future">Future</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={saveEdits}
                    disabled={saving || !editTitle.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Rationale</p>
                <p className="text-sm text-slate-700 leading-relaxed">{proposal.rationale || 'No rationale provided.'}</p>
              </div>
            )}

            {isCreateType ? (
              <CreateTypePreview proposed={proposal.proposed_value as Record<string, unknown>} />
            ) : canShowDiff && !showRawJson ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-500">Impact Preview</p>
                  <button
                    onClick={() => setShowRawJson(true)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Code className="w-3 h-3" />
                    Raw JSON
                  </button>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                  <SchemaPreview schema={schema} diffs={diffs} compact />
                </div>
              </div>
            ) : (
              <div>
                {canShowDiff && (
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-500">Raw Data</p>
                    <button
                      onClick={() => setShowRawJson(false)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Visual Diff
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Current Value</p>
                    <pre className="text-xs font-mono bg-slate-50 p-2 rounded-lg overflow-auto max-h-32 text-slate-600">
                      {JSON.stringify(proposal.current_value, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Proposed Value</p>
                    <pre className="text-xs font-mono bg-amber-50 p-2 rounded-lg overflow-auto max-h-32 text-amber-800">
                      {JSON.stringify(proposal.proposed_value, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {proposal.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {proposal.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-slate-400">
              {proposal.actor && proposal.actor !== 'system' && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {proposal.actor}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatDate(proposal.created_at)}
              </span>
            </div>

            <ProposalCommentThread
              comments={comments}
              loading={commentsLoading}
              onAddComment={addComment}
              onEditComment={editComment}
              onDeleteComment={deleteComment}
            />
          </div>
        </div>
      )}
    </div>
  );
}
