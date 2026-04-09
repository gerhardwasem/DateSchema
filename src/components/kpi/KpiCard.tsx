import { Trash2, CreditCard as Edit2, TrendingUp, BarChart3, PieChart, Table, Activity } from 'lucide-react';
import type { KpiDefinition, Metric } from '../../lib/types';

interface Props {
  kpi: KpiDefinition;
  metrics: Metric[];
  onEdit: () => void;
  onDelete: () => void;
}

const chartIcons: Record<string, typeof BarChart3> = {
  stat: TrendingUp,
  bar: BarChart3,
  pie: PieChart,
  table: Table,
  line: Activity,
};

const categoryColors: Record<string, string> = {
  Financial: 'bg-emerald-100 text-emerald-700',
  Operational: 'bg-sky-100 text-sky-700',
  Capacity: 'bg-amber-100 text-amber-700',
  Timeline: 'bg-rose-100 text-rose-700',
};

export default function KpiCard({ kpi, metrics, onEdit, onDelete }: Props) {
  const ChartIcon = chartIcons[kpi.chart_type] || TrendingUp;
  const usedMetrics = metrics.filter((m) => kpi.metric_ids.includes(m.id));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <ChartIcon className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">{kpi.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`badge text-xs ${categoryColors[kpi.category] || 'bg-slate-100 text-slate-600'}`}>
                {kpi.category}
              </span>
              {(kpi.scope || 'event') === 'venue' && (
                <span className="badge text-xs bg-teal-100 text-teal-700">venue</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button onClick={onDelete} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
          </button>
        </div>
      </div>

      {kpi.description && (
        <p className="text-xs text-slate-500 mb-3">{kpi.description}</p>
      )}

      <div className="bg-slate-50 rounded-lg p-2 mb-3">
        <code className="text-xs font-mono text-slate-600">{kpi.formula || 'No formula defined'}</code>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400">Sources:</span>
        {usedMetrics.map((m) => (
          <span key={m.id} className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full">
            {m.display_name}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
        <span>Unit: {kpi.unit}</span>
        <span>Format: {kpi.display_format}</span>
        <span>Chart: {kpi.chart_type}</span>
      </div>
    </div>
  );
}
