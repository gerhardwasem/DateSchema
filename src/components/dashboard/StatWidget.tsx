import { TrendingUp, TrendingDown, Minus, ArrowLeftRight } from 'lucide-react';
import type { KpiDefinition } from '../../lib/types';

interface Props {
  kpi: KpiDefinition;
  value: number;
  previousValue?: number;
  comparison?: {
    venueAName: string;
    venueBName: string;
    venueAValue: number;
    venueBValue: number;
  };
}

export default function StatWidget({ kpi, value, previousValue, comparison }: Props) {
  const formattedValue = formatValue(value, kpi.display_format, kpi.unit);
  const trend = previousValue !== undefined ? ((value - previousValue) / previousValue) * 100 : null;

  if (comparison) {
    const delta =
      comparison.venueAValue !== 0
        ? ((comparison.venueBValue - comparison.venueAValue) / comparison.venueAValue) * 100
        : 0;

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
        <p className="text-xs font-medium text-slate-500 mb-3">{kpi.name}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-0.5 truncate">{comparison.venueAName}</p>
            <p className="text-xl font-bold text-cyan-700">
              {formatValue(comparison.venueAValue, kpi.display_format, kpi.unit)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5 truncate">{comparison.venueBName}</p>
            <p className="text-xl font-bold text-teal-700">
              {formatValue(comparison.venueBValue, kpi.display_format, kpi.unit)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
          <ArrowLeftRight className="w-3 h-3 text-slate-400" />
          <span
            className={`text-xs font-medium ${
              delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-500' : 'text-slate-400'
            }`}
          >
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}% difference
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <p className="text-xs font-medium text-slate-500 mb-1">{kpi.name}</p>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-slate-900">{formattedValue}</p>
        {trend !== null && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium mb-1 ${
              trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-slate-400'
            }`}
          >
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      {kpi.description && (
        <p className="text-xs text-slate-400 mt-2">{kpi.description}</p>
      )}
    </div>
  );
}

function formatValue(value: number, format: string, unit: string): string {
  if (format === 'currency') {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: unit === 'EUR' ? 'EUR' : 'USD' }).format(value);
  }
  if (format === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  if (format === 'decimal') {
    return value.toFixed(2);
  }
  return new Intl.NumberFormat('de-DE').format(value);
}
