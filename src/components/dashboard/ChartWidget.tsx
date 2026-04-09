import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import type { KpiDefinition } from '../../lib/types';

interface Props {
  kpi: KpiDefinition;
  data: { name: string; value: number }[];
  comparisonData?: { name: string; venueA: number; venueB: number }[];
  venueAName?: string;
  venueBName?: string;
}

const CHART_COLORS = ['#0891b2', '#0d9488', '#059669', '#d97706', '#dc2626', '#2563eb', '#64748b', '#be185d'];
const VENUE_A_COLOR = '#0891b2';
const VENUE_B_COLOR = '#0d9488';

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
};

export default function ChartWidget({ kpi, data, comparisonData, venueAName, venueBName }: Props) {
  const isComparison = !!comparisonData && comparisonData.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{kpi.name}</h3>
          {kpi.description && <p className="text-xs text-slate-400 mt-0.5">{kpi.description}</p>}
        </div>
        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{kpi.category}</span>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          {isComparison ? (
            renderComparison(kpi, comparisonData!, venueAName, venueBName)
          ) : kpi.chart_type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill={VENUE_A_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : kpi.chart_type === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((_, idx) => (
                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={VENUE_A_COLOR} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function renderComparison(
  kpi: KpiDefinition,
  data: { name: string; venueA: number; venueB: number }[],
  venueAName?: string,
  venueBName?: string
) {
  if (kpi.chart_type === 'line') {
    return (
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Line
          type="monotone"
          dataKey="venueA"
          name={venueAName || 'Venue A'}
          stroke={VENUE_A_COLOR}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="venueB"
          name={venueBName || 'Venue B'}
          stroke={VENUE_B_COLOR}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    );
  }

  if (kpi.chart_type === 'pie') {
    const venueAData = data.map((d) => ({ name: d.name, value: d.venueA }));
    const venueBData = data.map((d) => ({ name: d.name, value: d.venueB }));
    return (
      <PieChart>
        <Pie
          data={venueAData}
          cx="30%"
          cy="50%"
          innerRadius={25}
          outerRadius={45}
          dataKey="value"
          label={false}
        >
          {venueAData.map((_, idx) => (
            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Pie
          data={venueBData}
          cx="70%"
          cy="50%"
          innerRadius={25}
          outerRadius={45}
          dataKey="value"
          label={false}
        >
          {venueBData.map((_, idx) => (
            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} opacity={0.7} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    );
  }

  return (
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
      <Tooltip contentStyle={tooltipStyle} />
      <Legend wrapperStyle={{ fontSize: 10 }} />
      <Bar
        dataKey="venueA"
        name={venueAName || 'Venue A'}
        fill={VENUE_A_COLOR}
        radius={[4, 4, 0, 0]}
      />
      <Bar
        dataKey="venueB"
        name={venueBName || 'Venue B'}
        fill={VENUE_B_COLOR}
        radius={[4, 4, 0, 0]}
      />
    </BarChart>
  );
}
