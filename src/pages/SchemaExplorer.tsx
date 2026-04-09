import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, LayoutGrid, GitBranch, BarChart3, Filter, Upload, Lightbulb, Clock, Plus } from 'lucide-react';
import { useSchemaTypes } from '../hooks/useSchemaTypes';
import { useAnnotations } from '../hooks/useAnnotations';
import { useChangeProposals } from '../hooks/useChangeProposals';
import SchemaCard from '../components/schema/SchemaCard';
import SchemaDetailPanel from '../components/schema/SchemaDetailPanel';
import RelationshipMap from '../components/schema/RelationshipMap';
import SchemaImportDialog from '../components/schema/SchemaImportDialog';
import ProposeChangeDialog from '../components/schema/ProposeChangeDialog';
import AddTypeDialog from '../components/schema/AddTypeDialog';
import ProposalsPanel from '../components/schema/ProposalsPanel';
import ChangelogPanel from '../components/schema/ChangelogPanel';
import { HIERARCHY_LEVELS } from '../lib/schema-relationships';
import type { Annotation, ChangeType } from '../lib/types';

type ViewMode = 'grid' | 'map';
type TabMode = 'explorer' | 'proposals' | 'changelog';

export default function SchemaExplorer() {
  const { schemaTypes, loading, refetch: refetchSchemaTypes, createSchemaType, deleteSchemaType } = useSchemaTypes();
  const { annotations, addAnnotation, updateAnnotation, deleteAnnotation } = useAnnotations();
  const { proposals, createProposal, updateProposal, deleteProposal: _deleteProposal } = useChangeProposals();

  const deleteProposal = useCallback(async (id: string) => {
    const result = await _deleteProposal(id);
    if (result) await refetchSchemaTypes();
    return result;
  }, [_deleteProposal, refetchSchemaTypes]);

  const handleCreateProposal = useCallback(async (proposal: Parameters<typeof createProposal>[0]) => {
    const result = await createProposal(proposal);
    if (result) await refetchSchemaTypes();
    return result;
  }, [createProposal, refetchSchemaTypes]);

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAddTypeDialog, setShowAddTypeDialog] = useState(false);
  const [proposeTarget, setProposeTarget] = useState<{
    schema: typeof schemaTypes[0];
    fieldPath?: string | null;
    defaultChangeType?: ChangeType;
    rationale?: string;
    priority?: 'must-have' | 'nice-to-have' | 'future';
  } | null>(null);

  const activeTab = (searchParams.get('tab') as TabMode) || 'explorer';
  const setActiveTab = useCallback((tab: TabMode) => {
    if (tab === 'explorer') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', tab);
    }
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const selectedSchema = schemaTypes.find((s) => s.type_key === selectedType);
  const metaType = schemaTypes.find((s) => s.type_key === '_meta');

  const highlightedTypes = useMemo(() => {
    const target = hoveredType || selectedType;
    if (!target) return new Set<string>();
    return new Set([target]);
  }, [selectedType, hoveredType]);

  const visibleTypes = useMemo(() => schemaTypes.filter((s) => s.type_key !== '_meta'), [schemaTypes]);

  const filteredTypes = useMemo(() => {
    let result = visibleTypes;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((s) => {
        if (s.display_name.toLowerCase().includes(term)) return true;
        if (s.type_key.toLowerCase().includes(term)) return true;
        if (s.description.toLowerCase().includes(term)) return true;
        const props = s.json_schema.properties || {};
        return Object.keys(props).some((k) => k.toLowerCase().includes(term));
      });
    }
    if (filterLevel !== null) {
      result = result.filter((s) => HIERARCHY_LEVELS[s.type_key] === filterLevel);
    }
    return result;
  }, [visibleTypes, searchTerm, filterLevel]);

  const stats = useMemo(() => {
    let totalFields = 0;
    let requiredFields = 0;
    const typeCount: Record<string, number> = {};

    visibleTypes.forEach((s) => {
      const props = s.json_schema.properties || {};
      const count = Object.keys(props).length;
      totalFields += count;
      requiredFields += s.json_schema.required?.length || 0;

      Object.values(props).forEach((p) => {
        const t = (p as { type: string }).type;
        typeCount[t] = (typeCount[t] || 0) + 1;
      });
    });

    return { totalFields, requiredFields, typeCount };
  }, [visibleTypes]);

  const handleProposeChange = useCallback((fieldPath?: string | null) => {
    if (!selectedSchema) return;
    setProposeTarget({ schema: selectedSchema, fieldPath });
  }, [selectedSchema]);

  const handleConvertAnnotation = useCallback((annotation: Annotation) => {
    const schema = schemaTypes.find((s) => s.id === annotation.schema_type_id);
    if (!schema) return;
    setProposeTarget({
      schema,
      fieldPath: annotation.field_path,
      defaultChangeType: 'modify_field',
      rationale: annotation.note,
      priority: annotation.priority,
    });
  }, [schemaTypes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-5 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Schema Explorer</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {visibleTypes.length} component types -- {stats.totalFields} fields total, {stats.requiredFields} required
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'explorer' && (
                <>
                  <button
                    onClick={() => setShowAddTypeDialog(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Type
                  </button>
                  <button
                    onClick={() => setShowImportDialog(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'map' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <GitBranch className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            {([
              { tab: 'explorer' as TabMode, icon: LayoutGrid, label: 'Explorer' },
              { tab: 'proposals' as TabMode, icon: Lightbulb, label: 'Proposals' },
              { tab: 'changelog' as TabMode, icon: Clock, label: 'Changelog' },
            ]).map(({ tab, icon: TabIcon, label }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'explorer' && (
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search components or fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-1">
                <Filter className="w-4 h-4 text-slate-400" />
                {[
                  { level: null, label: 'All' },
                  { level: 0, label: 'Root' },
                  { level: 1, label: 'L1' },
                  { level: 2, label: 'L2' },
                  { level: 3, label: 'L3' },
                ].map((f) => (
                  <button
                    key={String(f.level)}
                    onClick={() => setFilterLevel(f.level)}
                    className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                      filterLevel === f.level
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {activeTab === 'explorer' && (
          <div className={`flex-1 ${viewMode === 'map' ? 'overflow-hidden p-3' : 'overflow-auto p-6'}`}>
            {viewMode === 'grid' ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredTypes.map((schema) => (
                    <SchemaCard
                      key={schema.type_key}
                      schema={schema}
                      annotations={annotations}
                      proposals={proposals}
                      isSelected={selectedType === schema.type_key}
                      isHighlighted={highlightedTypes.has(schema.type_key)}
                      onClick={() => setSelectedType(selectedType === schema.type_key ? null : schema.type_key)}
                    />
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-4 gap-4">
                  {Object.entries(stats.typeCount)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count]) => (
                      <div key={type} className="bg-white rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-600 capitalize">{type}</span>
                        </div>
                        <p className="text-lg font-bold text-slate-900">{count}</p>
                        <p className="text-xs text-slate-400">{Math.round((count / stats.totalFields) * 100)}% of fields</p>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="h-full">
                <RelationshipMap
                  schemaTypes={visibleTypes}
                  proposals={proposals}
                  selectedType={selectedType}
                  hoveredType={hoveredType}
                  onSelectType={(key) => setSelectedType(selectedType === key ? null : key)}
                  onHoverType={setHoveredType}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'proposals' && (
          <div className="flex-1 overflow-auto">
            <ProposalsPanel schemaTypes={schemaTypes} onProposalDeleted={refetchSchemaTypes} />
          </div>
        )}

        {activeTab === 'changelog' && (
          <div className="flex-1 overflow-auto">
            <ChangelogPanel schemaTypes={schemaTypes} />
          </div>
        )}
      </div>

      {selectedSchema && activeTab === 'explorer' && (
        <div className="w-[420px] shrink-0 border-l border-slate-200 overflow-hidden">
          <SchemaDetailPanel
            schema={selectedSchema}
            annotations={annotations}
            proposals={proposals}
            schemaTypes={schemaTypes}
            onClose={() => setSelectedType(null)}
            onAddAnnotation={addAnnotation}
            onDeleteAnnotation={deleteAnnotation}
            onUpdateAnnotation={updateAnnotation}
            onProposeChange={handleProposeChange}
            onConvertAnnotation={handleConvertAnnotation}
            onEditProposal={updateProposal}
            onDeleteProposal={deleteProposal}
            onDelete={deleteSchemaType}
          />
        </div>
      )}

      {showImportDialog && (
        <SchemaImportDialog
          schemaTypes={schemaTypes}
          onClose={() => setShowImportDialog(false)}
          onImported={() => window.location.reload()}
        />
      )}

      {showAddTypeDialog && (
        <AddTypeDialog
          schemaTypes={schemaTypes}
          onClose={() => setShowAddTypeDialog(false)}
          onCreate={createSchemaType}
          onCreateWithProposal={metaType ? handleCreateProposal : undefined}
          metaTypeId={metaType?.id}
        />
      )}

      {proposeTarget && (
        <ProposeChangeDialog
          schema={proposeTarget.schema}
          schemaTypes={visibleTypes}
          fieldPath={proposeTarget.fieldPath}
          defaultChangeType={proposeTarget.defaultChangeType}
          defaultRationale={proposeTarget.rationale}
          defaultPriority={proposeTarget.priority}
          onClose={() => setProposeTarget(null)}
          onSubmit={handleCreateProposal}
        />
      )}
    </div>
  );
}
