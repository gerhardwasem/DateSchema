import type { KpiDefinition, Metric } from '../../lib/types';
import { COMPONENT_COLORS } from '../../lib/schema-relationships';
import { ArrowRight, Database, Calculator, BarChart3 } from 'lucide-react';

interface Props {
  kpi: KpiDefinition;
  metrics: Metric[];
}

export default function DataLineage({ kpi, metrics }: Props) {
  const usedMetrics = metrics.filter((m) => kpi.metric_ids.includes(m.id));
  const sourceTypes = [...new Set(usedMetrics.map((m) => m.schema_type_key))];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <Database className="w-4 h-4 text-slate-400" />
        Data Lineage: {kpi.name}
      </h3>

      <div className="flex items-start gap-4 overflow-x-auto pb-2">
        <div className="shrink-0">
          <p className="text-xs font-medium text-slate-500 mb-2">Source Components</p>
          <div className="space-y-1.5">
            {sourceTypes.map((type) => {
              const color = COMPONENT_COLORS[type] || '#64748b';
              return (
                <div
                  key={type}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium"
                  style={{ borderColor: color + '40', backgroundColor: color + '08', color }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {type.replace(/-/g, ' ')}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center self-center">
          <ArrowRight className="w-5 h-5 text-slate-300" />
        </div>

        <div className="shrink-0">
          <p className="text-xs font-medium text-slate-500 mb-2">Fields Used</p>
          <div className="space-y-1.5">
            {usedMetrics.map((m) => (
              <div key={m.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-xs">
                <code className="font-mono text-slate-600">{m.field_path}</code>
                <span className="text-slate-400">({m.data_type})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center self-center">
          <ArrowRight className="w-5 h-5 text-slate-300" />
        </div>

        <div className="shrink-0">
          <p className="text-xs font-medium text-slate-500 mb-2">Calculation</p>
          <div className="px-3 py-2 bg-slate-900 rounded-lg flex items-center gap-2">
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            <code className="text-xs font-mono text-cyan-300">{kpi.formula}</code>
          </div>
        </div>

        <div className="flex items-center self-center">
          <ArrowRight className="w-5 h-5 text-slate-300" />
        </div>

        <div className="shrink-0">
          <p className="text-xs font-medium text-slate-500 mb-2">Output</p>
          <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">{kpi.name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-600">
              <span>{kpi.unit}</span>
              <span>--</span>
              <span>{kpi.chart_type}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
