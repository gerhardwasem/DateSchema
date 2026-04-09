import { useState, useMemo } from 'react';
import { Plus, Save, X, Eye } from 'lucide-react';
import { useMetrics } from '../hooks/useMetrics';
import { useKpiDefinitions } from '../hooks/useKpiDefinitions';
import { useSampleData } from '../hooks/useSampleData';
import { useChangeProposals } from '../hooks/useChangeProposals';
import { useSchemaTypes } from '../hooks/useSchemaTypes';
import MetricPalette from '../components/kpi/MetricPalette';
import FormulaCanvas from '../components/kpi/FormulaCanvas';
import KpiCard from '../components/kpi/KpiCard';
import DataLineage from '../components/kpi/DataLineage';
import FilterBar from '../components/shared/FilterBar';
import type { Metric, FormulaNode, KpiDefinition } from '../lib/types';

const CATEGORIES = ['Financial', 'Operational', 'Capacity', 'Timeline'];
const CHART_TYPES = ['stat', 'bar', 'line', 'pie', 'table'];
const UNITS = ['count', 'EUR', '%', 'days', 'sqm', 'nights', 'persons'];
const FORMATS = ['number', 'currency', 'percentage', 'decimal'];
const SCOPES: { value: 'event' | 'venue'; label: string }[] = [
  { value: 'event', label: 'Per Event' },
  { value: 'venue', label: 'Across Venue' },
];

export default function KpiBuilder() {
  const { metrics, metricsByType, loading: metricsLoading } = useMetrics();
  const { kpis, saveKpi, deleteKpi, loading: kpisLoading } = useKpiDefinitions();
  const { availableVenues, availableEventTypes, dateMin, dateMax } = useSampleData();
  const { proposals } = useChangeProposals();
  const { schemaTypes } = useSchemaTypes();

  const proposedMetrics = useMemo<Metric[]>(() => {
    const schemaTypeMap = new Map(schemaTypes.map((s) => [s.id, s.type_key]));
    return proposals
      .filter(
        (p) =>
          p.change_type === 'add_field' &&
          !['rejected', 'implemented'].includes(p.status) &&
          !p.hidden &&
          p.field_path
      )
      .flatMap((p) => {
        const proposedVal = p.proposed_value as Record<string, unknown>;
        const fieldKey = Object.keys(proposedVal).find((k) => !k.startsWith('_'));
        const fieldDef = fieldKey ? (proposedVal[fieldKey] as Record<string, unknown>) : {};
        const fieldType = (fieldDef?.type as string) || '';
        if (!['integer', 'number'].includes(fieldType)) return [];
        const schemaTypeKey = schemaTypeMap.get(p.schema_type_id);
        if (!schemaTypeKey) return [];
        const fieldName = fieldKey || p.field_path!.split('.').pop() || '';
        const displayName = fieldName
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return [
          {
            id: `proposed_${p.id}`,
            schema_type_key: schemaTypeKey,
            field_path: p.field_path!,
            display_name: displayName,
            data_type: fieldType,
            description: p.rationale || null,
            created_at: p.created_at,
            proposed: true,
            proposal_status: p.status,
          } as Metric,
        ];
      });
  }, [proposals, schemaTypes]);

  const allMetrics = useMemo(() => [...metrics, ...proposedMetrics], [metrics, proposedMetrics]);

  const combinedMetricsByType = useMemo(() => {
    const combined: Record<string, Metric[]> = { ...metricsByType };
    for (const pm of proposedMetrics) {
      if (!combined[pm.schema_type_key]) combined[pm.schema_type_key] = [];
      else combined[pm.schema_type_key] = [...combined[pm.schema_type_key]];
      combined[pm.schema_type_key].push(pm);
    }
    return combined;
  }, [metricsByType, proposedMetrics]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [nodes, setNodes] = useState<FormulaNode[]>([]);
  const [kpiName, setKpiName] = useState('');
  const [kpiDescription, setKpiDescription] = useState('');
  const [kpiUnit, setKpiUnit] = useState('count');
  const [kpiFormat, setKpiFormat] = useState('number');
  const [kpiCategory, setKpiCategory] = useState('Operational');
  const [kpiChartType, setKpiChartType] = useState('stat');
  const [kpiScope, setKpiScope] = useState<'event' | 'venue'>('event');
  const [viewingLineage, setViewingLineage] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterScope, setFilterScope] = useState<string | null>(null);

  const handleMetricDrop = (metric: Metric) => {
    const node: FormulaNode = {
      id: `metric_${Date.now()}_${metric.id}`,
      type: 'metric',
      metric_id: metric.id,
      label: metric.display_name,
    };
    setNodes((prev) => [...prev, node]);
  };

  const handleSave = async () => {
    if (!kpiName.trim() || nodes.length === 0) return;

    const metricIds = nodes
      .filter((n) => n.type === 'metric' && n.metric_id)
      .map((n) => n.metric_id!);

    const formulaText = nodes
      .map((n) => {
        if (n.type === 'metric') {
          const m = allMetrics.find((met) => met.id === n.metric_id);
          return m?.display_name || '?';
        }
        if (n.type === 'operator') return n.operator;
        return String(n.value);
      })
      .join(' ');

    await saveKpi({
      name: kpiName,
      description: kpiDescription || null,
      formula: formulaText,
      formula_config: { nodes },
      metric_ids: metricIds,
      unit: kpiUnit,
      display_format: kpiFormat,
      category: kpiCategory,
      chart_type: kpiChartType,
      scope: kpiScope,
    });

    resetBuilder();
  };

  const resetBuilder = () => {
    setIsBuilding(false);
    setNodes([]);
    setKpiName('');
    setKpiDescription('');
    setKpiUnit('count');
    setKpiFormat('number');
    setKpiCategory('Operational');
    setKpiChartType('stat');
    setKpiScope('event');
  };

  const handleEditKpi = (kpi: KpiDefinition) => {
    setIsBuilding(true);
    setNodes(kpi.formula_config.nodes || []);
    setKpiName(kpi.name);
    setKpiDescription(kpi.description || '');
    setKpiUnit(kpi.unit);
    setKpiFormat(kpi.display_format);
    setKpiCategory(kpi.category);
    setKpiChartType(kpi.chart_type);
    setKpiScope(kpi.scope || 'event');
  };

  let filteredKpis = kpis;
  if (filterCategory) filteredKpis = filteredKpis.filter((k) => k.category === filterCategory);
  if (filterScope) filteredKpis = filteredKpis.filter((k) => (k.scope || 'event') === filterScope);

  const lineageKpi = viewingLineage ? kpis.find((k) => k.id === viewingLineage) : null;

  if (metricsLoading || kpisLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {isBuilding && (
        <div className="w-64 border-r border-slate-200 bg-white">
          <div className="px-3 py-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Metric Catalog</p>
            <p className="text-xs text-slate-400 mt-0.5">Drag to canvas</p>
          </div>
          <MetricPalette metricsByType={combinedMetricsByType} onDragStart={() => {}} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-5 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">KPI Builder</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {kpis.length} KPIs defined &mdash; {metrics.length} metrics available
                {proposedMetrics.length > 0 && (
                  <span className="text-amber-600 ml-1">+ {proposedMetrics.length} proposed</span>
                )}
              </p>
            </div>
            {!isBuilding && (
              <button
                onClick={() => setIsBuilding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New KPI
              </button>
            )}
          </div>

          <FilterBar
            availableVenues={availableVenues}
            availableEventTypes={availableEventTypes}
            dateMin={dateMin}
            dateMax={dateMax}
            showScope={false}
          />
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isBuilding && (
            <div className="mb-6 bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700">
                  {kpiName || 'New KPI'}
                </h2>
                <button onClick={resetBuilder} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">KPI Name</label>
                  <input
                    type="text"
                    value={kpiName}
                    onChange={(e) => setKpiName(e.target.value)}
                    placeholder="e.g., Budget per Guest"
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                  <input
                    type="text"
                    value={kpiDescription}
                    onChange={(e) => setKpiDescription(e.target.value)}
                    placeholder="What this KPI measures..."
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3 mb-5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                  <select
                    value={kpiCategory}
                    onChange={(e) => setKpiCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Scope</label>
                  <select
                    value={kpiScope}
                    onChange={(e) => setKpiScope(e.target.value as 'event' | 'venue')}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none ${
                      kpiScope === 'venue'
                        ? 'border-teal-300 bg-teal-50 text-teal-700'
                        : 'border-slate-200'
                    }`}
                  >
                    {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Unit</label>
                  <select
                    value={kpiUnit}
                    onChange={(e) => setKpiUnit(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  >
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Format</label>
                  <select
                    value={kpiFormat}
                    onChange={(e) => setKpiFormat(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  >
                    {FORMATS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Chart Type</label>
                  <select
                    value={kpiChartType}
                    onChange={(e) => setKpiChartType(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  >
                    {CHART_TYPES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {kpiScope === 'venue' && (
                <div className="mb-4 px-3 py-2.5 bg-teal-50 border border-teal-200 rounded-lg">
                  <p className="text-xs text-teal-700">
                    Venue-scoped KPI: Values will be aggregated across all events at each venue.
                    Use SUM, AVG, COUNT, MAX, or MIN operators for cross-event aggregation.
                  </p>
                </div>
              )}

              <FormulaCanvas
                nodes={nodes}
                metrics={allMetrics}
                onNodesChange={setNodes}
                onDrop={handleMetricDrop}
              />

              <div className="mt-4 pt-4 border-t border-slate-100">
                {nodes.some((n) => n.type === 'metric' && n.metric_id?.startsWith('proposed_')) && (
                  <p className="text-xs text-amber-600 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    This KPI includes proposed metrics that are not yet live. It can be saved as a design reference.
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button onClick={resetBuilder} className="text-sm text-slate-500 px-4 py-2">
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!kpiName.trim() || nodes.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save KPI
                  </button>
                </div>
              </div>
            </div>
          )}

          {lineageKpi && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Data Lineage</h3>
                <button onClick={() => setViewingLineage(null)} className="text-xs text-slate-400 hover:text-slate-600">
                  Close
                </button>
              </div>
              <DataLineage kpi={lineageKpi} metrics={allMetrics} />
            </div>
          )}

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Defined KPIs</span>
            <div className="flex-1" />
            {['All', ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat === 'All' ? null : cat)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  (cat === 'All' && !filterCategory) || filterCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
            <span className="text-slate-300">|</span>
            {[
              { value: null, label: 'All Scopes' },
              { value: 'event', label: 'Per Event' },
              { value: 'venue', label: 'Per Venue' },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => setFilterScope(s.value)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  filterScope === s.value
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {filteredKpis.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredKpis.map((kpi) => (
                <div key={kpi.id}>
                  <KpiCard
                    kpi={kpi}
                    metrics={allMetrics}
                    onEdit={() => handleEditKpi(kpi)}
                    onDelete={() => deleteKpi(kpi.id)}
                  />
                  <button
                    onClick={() => setViewingLineage(viewingLineage === kpi.id ? null : kpi.id)}
                    className="flex items-center gap-1 mt-1.5 text-xs text-cyan-600 hover:text-cyan-700 ml-2"
                  >
                    <Eye className="w-3 h-3" />
                    {viewingLineage === kpi.id ? 'Hide' : 'View'} Lineage
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">No KPIs defined yet. Click "New KPI" to create your first one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
