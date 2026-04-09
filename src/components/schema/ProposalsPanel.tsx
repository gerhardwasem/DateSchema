import { useState, useMemo } from 'react';
import { Filter, Lightbulb, Eye, EyeOff } from 'lucide-react';
import type { SchemaType, ChangeType } from '../../lib/types';
import { useChangeProposals } from '../../hooks/useChangeProposals';
import ProposalCard from './ProposalCard';

interface Props {
  schemaTypes: SchemaType[];
  onProposalDeleted?: () => void;
}

export default function ProposalsPanel({ schemaTypes, onProposalDeleted }: Props) {
  const { proposals, loading, updateProposal, deleteProposal: _deleteProposal, hideProposal } = useChangeProposals();

  const deleteProposal = async (id: string) => {
    const result = await _deleteProposal(id);
    if (result) onProposalDeleted?.();
    return result;
  };
  const [typeFilter, setTypeFilter] = useState('');
  const [schemaFilter, setSchemaFilter] = useState('');
  const [showHidden, setShowHidden] = useState(false);

  const hiddenCount = useMemo(() => proposals.filter((p) => p.hidden).length, [proposals]);

  const filtered = useMemo(() => {
    let result = proposals;
    if (!showHidden) {
      result = result.filter((p) => !p.hidden);
    }
    if (typeFilter) {
      result = result.filter((p) => p.change_type === typeFilter);
    }
    if (schemaFilter) {
      result = result.filter((p) => p.schema_type_id === schemaFilter);
    }
    return result;
  }, [proposals, typeFilter, schemaFilter, showHidden]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ChangeType | '')}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
        >
          <option value="">All change types</option>
          <option value="create_type">Create Type</option>
          <option value="add_field">Add Field</option>
          <option value="modify_field">Modify Field</option>
          <option value="remove_field">Remove Field</option>
          <option value="add_relationship">Add Relationship</option>
          <option value="remove_relationship">Remove Relationship</option>
          <option value="modify_type">Modify Type</option>
        </select>
        <select
          value={schemaFilter}
          onChange={(e) => setSchemaFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
        >
          <option value="">All component types</option>
          {schemaTypes.filter((s) => s.type_key !== '_meta').map((s) => (
            <option key={s.id} value={s.id}>{s.display_name}</option>
          ))}
        </select>

        <div className="ml-auto">
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              showHidden
                ? 'bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {showHidden ? 'Showing hidden' : 'Hidden'}
            {hiddenCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-slate-200 text-slate-600 font-medium">
                {hiddenCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Lightbulb className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No proposals yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Changes made through the schema explorer are recorded here as proposals
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              schemaTypes={schemaTypes}
              onHide={hideProposal}
              onEdit={updateProposal}
              onDelete={deleteProposal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
