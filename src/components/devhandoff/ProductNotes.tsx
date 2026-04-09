import { useState, useMemo } from 'react';
import { FileText, GitCommitVertical as GitCommit, PlusCircle, Trash2, ArrowRightCircle, CheckCircle2, XCircle, Pencil, Clock, User, Boxes, Link, Unlink, Settings, Filter, Database } from 'lucide-react';
import type { Annotation, ChangeProposal, AuditLogEntry, SchemaType } from '../../lib/types';
import { COMPONENT_COLORS } from '../../lib/schema-relationships';

interface Props {
  annotations: Annotation[];
  proposals: ChangeProposal[];
  auditEntries: AuditLogEntry[];
  schemaTypes: SchemaType[];
}

type NotesSubTab = 'timeline' | 'proposals' | 'annotations';

const ACTION_ICONS: Record<string, typeof PlusCircle> = {
  created: PlusCircle,
  deleted: Trash2,
  status_changed: ArrowRightCircle,
  updated: Pencil,
};

const CHANGE_TYPE_LABELS: Record<string, { icon: typeof PlusCircle; label: string }> = {
  add_field: { icon: PlusCircle, label: 'Add Field' },
  modify_field: { icon: Pencil, label: 'Modify Field' },
  remove_field: { icon: Trash2, label: 'Remove Field' },
  add_relationship: { icon: Link, label: 'Add Relationship' },
  remove_relationship: { icon: Unlink, label: 'Remove Relationship' },
  modify_type: { icon: Settings, label: 'Modify Type' },
  create_type: { icon: Boxes, label: 'Create Type' },
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-blue-50 text-blue-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  implemented: 'bg-teal-50 text-teal-700',
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getActionColor(action: string): string {
  switch (action) {
    case 'created': return 'text-emerald-500 bg-emerald-50';
    case 'deleted': return 'text-red-500 bg-red-50';
    case 'status_changed': return 'text-blue-500 bg-blue-50';
    case 'updated': return 'text-amber-500 bg-amber-50';
    default: return 'text-slate-500 bg-slate-50';
  }
}

function getEntityLabel(entry: AuditLogEntry): string {
  if (entry.entity_type === 'schema_type') return 'Schema Type';
  if (entry.entity_type === 'proposal') return 'Proposal';
  return entry.entity_type;
}

function TimelineEntry({ entry }: { entry: AuditLogEntry }) {
  const Icon = ACTION_ICONS[entry.action] || GitCommit;
  const colorClass = getActionColor(entry.action);
  const entityLabel = getEntityLabel(entry);

  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="w-px flex-1 bg-slate-200 group-last:bg-transparent" />
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <p className="text-sm text-slate-800 leading-snug">{entry.change_summary}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(entry.created_at)}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            {entityLabel}
          </span>
          {entry.actor && entry.actor !== 'system' && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3" />
              {entry.actor}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProposalSummaryRow({ proposal, schemaTypes }: { proposal: ChangeProposal; schemaTypes: SchemaType[] }) {
  const schema = schemaTypes.find((s) => s.id === proposal.schema_type_id);
  const isCreateType = proposal.change_type === 'create_type';
  const typeLabel = isCreateType
    ? (proposal.proposed_value as Record<string, unknown>)?.display_name as string || 'New Type'
    : schema?.display_name || '—';
  const color = isCreateType
    ? ((proposal.proposed_value as Record<string, unknown>)?.color as string) || '#64748b'
    : schema ? COMPONENT_COLORS[schema.type_key] || '#64748b' : '#64748b';
  const changeConfig = CHANGE_TYPE_LABELS[proposal.change_type] || CHANGE_TYPE_LABELS.modify_field;
  const ChangeIcon = changeConfig.icon;
  const statusClass = STATUS_STYLES[proposal.status] || STATUS_STYLES.draft;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-b-0">
      <ChangeIcon className="w-4 h-4 text-slate-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{proposal.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-xs text-slate-500 truncate">{typeLabel}</span>
          {proposal.field_path && (
            <code className="text-xs text-slate-400 font-mono">{proposal.field_path}</code>
          )}
        </div>
      </div>
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusClass}`}>
        {proposal.status}
      </span>
      <span className="text-xs text-slate-400 shrink-0">{formatDate(proposal.created_at)}</span>
    </div>
  );
}

export default function ProductNotes({ annotations, proposals, auditEntries, schemaTypes }: Props) {
  const [subTab, setSubTab] = useState<NotesSubTab>('timeline');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const filteredEntries = useMemo(() => {
    if (entityFilter === 'all') return auditEntries;
    return auditEntries.filter((e) => e.entity_type === entityFilter);
  }, [auditEntries, entityFilter]);

  const filteredProposals = useMemo(() => {
    const visible = proposals.filter((p) => !p.hidden);
    if (statusFilter === 'all') return visible;
    return visible.filter((p) => p.status === statusFilter);
  }, [proposals, statusFilter]);

  const annotatedTypes = useMemo(() => {
    return schemaTypes
      .filter((st) => annotations.some((a) => a.schema_type_id === st.id))
      .map((st) => ({
        schema: st,
        notes: annotations.filter((a) => a.schema_type_id === st.id),
      }));
  }, [schemaTypes, annotations]);

  const proposalStats = useMemo(() => {
    const counts: Record<string, number> = { draft: 0, submitted: 0, approved: 0, rejected: 0, implemented: 0 };
    proposals.filter((p) => !p.hidden).forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return counts;
  }, [proposals]);

  const subTabs: { key: NotesSubTab; label: string; count: number }[] = [
    { key: 'timeline', label: 'Activity', count: auditEntries.length },
    { key: 'proposals', label: 'Proposals', count: proposals.filter((p) => !p.hidden).length },
    { key: 'annotations', label: 'Annotations', count: annotations.length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6 border-b border-slate-200 pb-px">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${
              subTab === tab.key
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              subTab === tab.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {subTab === 'timeline' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-500">
              All schema and proposal changes in chronological order
            </p>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none bg-white"
              >
                <option value="all">All activity</option>
                <option value="schema_type">Schema changes</option>
                <option value="proposal">Proposal changes</option>
              </select>
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <GitCommit className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No activity recorded yet.</p>
              <p className="text-xs mt-1">Changes to schemas and proposals will appear here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              {filteredEntries.map((entry) => (
                <TimelineEntry key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'proposals' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(proposalStats).map(([status, count]) => {
                if (count === 0) return null;
                const sClass = STATUS_STYLES[status] || '';
                return (
                  <span key={status} className={`px-2.5 py-1 rounded-full text-xs font-medium ${sClass}`}>
                    {count} {status}
                  </span>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none bg-white"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="implemented">Implemented</option>
              </select>
            </div>
          </div>

          {filteredProposals.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Boxes className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No proposals found.</p>
              <p className="text-xs mt-1">
                {statusFilter !== 'all' ? 'Try changing the filter.' : 'Submit proposals in the Schema Explorer.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {filteredProposals.map((proposal) => (
                <ProposalSummaryRow key={proposal.id} proposal={proposal} schemaTypes={schemaTypes} />
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'annotations' && (
        <div>
          {annotatedTypes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No annotations yet. Add notes in the Schema Explorer.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {annotatedTypes.map(({ schema, notes }) => {
                const color = COMPONENT_COLORS[schema.type_key] || '#64748b';
                return (
                  <div key={schema.id} className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <h3 className="font-semibold text-sm text-slate-900">{schema.display_name}</h3>
                      <span className="text-xs text-slate-400">{notes.length} notes</span>
                    </div>
                    <div className="space-y-2">
                      {notes.map((ann) => (
                        <div key={ann.id} className="flex items-start gap-3 px-3 py-2 bg-slate-50 rounded-lg">
                          <span className={`badge shrink-0 mt-0.5 badge-${ann.priority}`}>
                            {ann.priority}
                          </span>
                          <div className="flex-1">
                            {ann.field_path && (
                              <code className="text-xs font-mono text-slate-500 block mb-0.5">{ann.field_path}</code>
                            )}
                            <p className="text-sm text-slate-700">{ann.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
