import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, X, LayoutGrid, Settings, Columns2 as Columns } from 'lucide-react';
import { useKpiDefinitions } from '../hooks/useKpiDefinitions';
import { useMetrics } from '../hooks/useMetrics';
import { useSampleData } from '../hooks/useSampleData';
import { useFilters } from '../contexts/FilterContext';
import { supabase } from '../lib/supabase';
import { computeVenueValue, computeComparisonData, generateRealChartData, resolveMetricTotal } from '../lib/compute';
import FilterBar from '../components/shared/FilterBar';
import StatWidget from '../components/dashboard/StatWidget';
import ChartWidget from '../components/dashboard/ChartWidget';
import type { KpiDefinition, DashboardLayout, SampleComponent } from '../lib/types';

export default function Dashboard() {
  const { kpis, loading: kpisLoading } = useKpiDefinitions();
  const { metrics, loading: metricsLoading } = useMetrics();
  const {
    filteredEvents,
    componentsByEvent,
    venueGroups,
    availableVenues,
    availableEventTypes,
    dateMin,
    dateMax,
  } = useSampleData();
  const { selectedVenues } = useFilters();

  const [activeWidgets, setActiveWidgets] = useState<string[]>([]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [savedLayouts, setSavedLayouts] = useState<DashboardLayout[]>([]);
  const [comparisonMode, setComparisonMode] = useState(false);

  const isComparing = comparisonMode && selectedVenues.length === 2;
  const venueA = isComparing ? venueGroups.find((g) => g.venueName === selectedVenues[0]) : null;
  const venueB = isComparing ? venueGroups.find((g) => g.venueName === selectedVenues[1]) : null;

  const fetchLayouts = useCallback(async () => {
    const { data } = await supabase.from('dashboard_layouts').select('*').order('created_at', { ascending: false });
    if (data) setSavedLayouts(data as DashboardLayout[]);
  }, []);

  useEffect(() => { fetchLayouts(); }, [fetchLayouts]);

  useEffect(() => {
    if (kpis.length > 0 && activeWidgets.length === 0) {
      setActiveWidgets(kpis.slice(0, 6).map((k) => k.id));
    }
  }, [kpis, activeWidgets.length]);

  const activeKpis = useMemo(
    () => activeWidgets.map((id) => kpis.find((k) => k.id === id)).filter(Boolean) as KpiDefinition[],
    [activeWidgets, kpis]
  );

  const eventGroups = useMemo(
    () => filteredEvents.map((e) => ({ components: componentsByEvent[e.id] || [] })),
    [filteredEvents, componentsByEvent]
  );

  const filteredComponentsByEvent = useMemo(() => {
    const ids = new Set(filteredEvents.map((e) => e.id));
    const map: Record<string, SampleComponent[]> = {};
    for (const [eventId, comps] of Object.entries(componentsByEvent)) {
      if (ids.has(eventId)) map[eventId] = comps;
    }
    return map;
  }, [filteredEvents, componentsByEvent]);

  const computeKpiValue = useCallback(
    (kpi: KpiDefinition) => computeVenueValue(kpi, eventGroups, metrics),
    [eventGroups, metrics]
  );

  const saveLayout = async () => {
    const name = prompt('Layout name:');
    if (!name?.trim()) return;
    await supabase.from('dashboard_layouts').insert({
      name,
      widgets: activeWidgets.map((id, i) => ({
        id: `w_${i}`,
        kpi_id: id,
        x: (i % 3) * 4,
        y: Math.floor(i / 3) * 4,
        w: 4,
        h: 4,
        chart_type: kpis.find((k) => k.id === id)?.chart_type || 'stat',
      })),
    });
    await fetchLayouts();
  };

  const loadLayout = (layout: DashboardLayout) => {
    setActiveWidgets(layout.widgets.map((w) => (w as { kpi_id: string }).kpi_id));
  };

  const removeWidget = (kpiId: string) => {
    setActiveWidgets((prev) => prev.filter((id) => id !== kpiId));
  };

  const addWidget = (kpiId: string) => {
    if (!activeWidgets.includes(kpiId)) {
      setActiveWidgets((prev) => [...prev, kpiId]);
    }
    setShowAddPanel(false);
  };

  if (kpisLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-5 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {activeKpis.length} widgets -- {filteredEvents.length} events
              {venueGroups.length > 0 && ` across ${venueGroups.length} venue${venueGroups.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedVenues.length === 2 && (
              <button
                onClick={() => setComparisonMode(!comparisonMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg transition-colors ${
                  comparisonMode
                    ? 'border-teal-400 bg-teal-50 text-teal-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                Compare
              </button>
            )}
            <button
              onClick={() => setShowAddPanel(!showAddPanel)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Widget
            </button>
            <button
              onClick={saveLayout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Save Layout
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <FilterBar
            availableVenues={availableVenues}
            availableEventTypes={availableEventTypes}
            dateMin={dateMin}
            dateMax={dateMax}
          />

          {savedLayouts.length > 0 && (
            <>
              <span className="text-slate-300">|</span>
              <label className="text-xs font-medium text-slate-500">Layout:</label>
              <div className="flex gap-1">
                {savedLayouts.map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => loadLayout(layout)}
                    className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    {layout.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {isComparing && venueA && venueB && (
        <div className="px-6 py-2.5 bg-gradient-to-r from-cyan-50 to-teal-50 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-600" />
              <span className="text-xs font-semibold text-cyan-800">
                {venueA.venueName} ({venueA.events.length} events)
              </span>
            </div>
            <span className="text-xs text-slate-400">vs</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-600" />
              <span className="text-xs font-semibold text-teal-800">
                {venueB.venueName} ({venueB.events.length} events)
              </span>
            </div>
          </div>
        </div>
      )}

      {showAddPanel && (
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">Available KPIs</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {kpis
              .filter((k) => !activeWidgets.includes(k.id))
              .map((kpi) => (
                <button
                  key={kpi.id}
                  onClick={() => addWidget(kpi.id)}
                  className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-cyan-400 hover:bg-cyan-50 transition-colors"
                >
                  {kpi.name}
                  {(kpi.scope || 'event') === 'venue' && (
                    <span className="ml-1 text-teal-500">(venue)</span>
                  )}
                </button>
              ))}
            {kpis.filter((k) => !activeWidgets.includes(k.id)).length === 0 && (
              <span className="text-xs text-slate-400">All KPIs are on the dashboard</span>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        {activeKpis.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeKpis.map((kpi) => (
              <div key={kpi.id} className="relative group">
                <button
                  onClick={() => removeWidget(kpi.id)}
                  className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 p-1 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-red-50 transition-all"
                >
                  <X className="w-3 h-3 text-slate-400 hover:text-red-500" />
                </button>

                {kpi.chart_type === 'stat' ? (
                  <StatWidget
                    kpi={kpi}
                    value={computeKpiValue(kpi)}
                    comparison={
                      isComparing && venueA && venueB
                        ? {
                            venueAName: venueA.venueName,
                            venueBName: venueB.venueName,
                            venueAValue: computeVenueValue(
                              kpi,
                              venueA.events.map((e) => ({ components: componentsByEvent[e.id] || [] })),
                              metrics
                            ),
                            venueBValue: computeVenueValue(
                              kpi,
                              venueB.events.map((e) => ({ components: componentsByEvent[e.id] || [] })),
                              metrics
                            ),
                          }
                        : undefined
                    }
                  />
                ) : kpi.chart_type === 'table' ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3">{kpi.name}</h3>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-2 font-medium text-slate-500">Metric</th>
                          <th className="text-right py-2 font-medium text-slate-500">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(kpi.formula_config.nodes || [])
                          .filter((n) => n.type === 'metric')
                          .map((n) => (
                            <tr key={n.id} className="border-b border-slate-50">
                              <td className="py-2 text-slate-700">{n.label}</td>
                              <td className="py-2 text-right font-mono text-slate-600">
                                {resolveMetricTotal(n.metric_id!, eventGroups, metrics).toLocaleString('de-DE')}
                              </td>
                            </tr>
                          ))}
                        <tr className="border-t border-slate-200">
                          <td className="py-2 font-semibold text-slate-800">Result</td>
                          <td className="py-2 text-right font-mono font-semibold text-slate-800">
                            {computeKpiValue(kpi).toLocaleString('de-DE')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <ChartWidget
                    kpi={kpi}
                    data={generateRealChartData(kpi, filteredComponentsByEvent, metrics)}
                    comparisonData={
                      isComparing && venueA && venueB
                        ? computeComparisonData(
                            kpi,
                            venueA.events.map((e) => ({ components: componentsByEvent[e.id] || [] })),
                            venueB.events.map((e) => ({ components: componentsByEvent[e.id] || [] })),
                            metrics
                          )
                        : undefined
                    }
                    venueAName={venueA?.venueName}
                    venueBName={venueB?.venueName}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <LayoutGrid className="w-12 h-12 mb-3 text-slate-300" />
            <p className="text-sm font-medium">No widgets on the dashboard</p>
            <p className="text-xs mt-1">
              {kpis.length > 0
                ? 'Click "Add Widget" to place KPIs on the dashboard'
                : 'Create KPIs in the KPI Builder first, then add them here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
