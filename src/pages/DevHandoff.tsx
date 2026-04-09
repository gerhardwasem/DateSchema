import { useState, useMemo } from 'react';
import { Copy, Check, Code2, Database, ArrowRight, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { useKpiDefinitions } from '../hooks/useKpiDefinitions';
import { useMetrics } from '../hooks/useMetrics';
import { useSchemaTypes } from '../hooks/useSchemaTypes';
import { useAnnotations } from '../hooks/useAnnotations';
import { useChangeProposals } from '../hooks/useChangeProposals';
import { useAuditLog } from '../hooks/useAuditLog';
import { COMPONENT_COLORS, SCHEMA_RELATIONSHIPS } from '../lib/schema-relationships';
import ProductNotes from '../components/devhandoff/ProductNotes';
import type { KpiDefinition, Metric } from '../lib/types';

function generateMarkdown(kpi: KpiDefinition, usedMetrics: Metric[]): string {
  const lines: string[] = [];
  lines.push(`## ${kpi.name}`);
  lines.push('');
  if (kpi.description) {
    lines.push(`**Description:** ${kpi.description}`);
    lines.push('');
  }
  lines.push(`**Category:** ${kpi.category}`);
  lines.push(`**Unit:** ${kpi.unit} | **Format:** ${kpi.display_format} | **Chart:** ${kpi.chart_type}`);
  lines.push('');
  lines.push('### Formula');
  lines.push(`\`${kpi.formula}\``);
  lines.push('');
  lines.push('### Data Sources');
  lines.push('| Field Path | Type | Component |');
  lines.push('|---|---|---|');
  usedMetrics.forEach((m) => {
    lines.push(`| \`${m.field_path}\` | ${m.data_type} | ${m.schema_type_key} |`);
  });
  lines.push('');
  return lines.join('\n');
}

export default function DevHandoff() {
  const { kpis, loading: kpisLoading } = useKpiDefinitions();
  const { metrics, loading: metricsLoading } = useMetrics();
  const { schemaTypes, loading: schemaLoading } = useSchemaTypes();
  const { annotations } = useAnnotations();
  const { proposals, loading: proposalsLoading } = useChangeProposals();
  const { entries: auditEntries, loading: auditLoading } = useAuditLog();
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'kpis' | 'data-map' | 'annotations'>('kpis');

  const dataRequirements = useMemo(() => {
    const fieldMap = new Map<string, { metric: Metric; kpiNames: string[] }>();
    kpis.forEach((kpi) => {
      const usedMetrics = metrics.filter((m) => kpi.metric_ids.includes(m.id));
      usedMetrics.forEach((m) => {
        const key = `${m.schema_type_key}:${m.field_path}`;
        const existing = fieldMap.get(key);
        if (existing) {
          existing.kpiNames.push(kpi.name);
        } else {
          fieldMap.set(key, { metric: m, kpiNames: [kpi.name] });
        }
      });
    });
    return Array.from(fieldMap.values()).sort((a, b) =>
      a.metric.schema_type_key.localeCompare(b.metric.schema_type_key)
    );
  }, [kpis, metrics]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (kpisLoading || metricsLoading || schemaLoading || proposalsLoading || auditLoading) {
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
            <h1 className="text-xl font-bold text-slate-900">Developer Specs</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Technical reference for implementing KPIs and data pipelines
            </p>
          </div>
          <button
            onClick={() => {
              const allMd = kpis
                .map((kpi) => {
                  const used = metrics.filter((m) => kpi.metric_ids.includes(m.id));
                  return generateMarkdown(kpi, used);
                })
                .join('\n---\n\n');
              copyToClipboard(allMd, 'all');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            {copiedId === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedId === 'all' ? 'Copied!' : 'Copy All as Markdown'}
          </button>
        </div>

        <div className="flex gap-1">
          {[
            { key: 'kpis' as const, label: 'KPI Specs', icon: Code2 },
            { key: 'data-map' as const, label: 'Data Requirements', icon: Database },
            { key: 'annotations' as const, label: 'Product Notes', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === tab.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'kpis' && (
          <div className="space-y-4">
            {kpis.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Code2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No KPIs defined yet. Create KPIs in the KPI Builder first.</p>
              </div>
            ) : (
              kpis.map((kpi) => {
                const usedMetrics = metrics.filter((m) => kpi.metric_ids.includes(m.id));
                const isExpanded = expandedKpi === kpi.id;
                const sourceTypes = [...new Set(usedMetrics.map((m) => m.schema_type_key))];

                return (
                  <div key={kpi.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <button
                      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
                      onClick={() => setExpandedKpi(isExpanded ? null : kpi.id)}
                    >
                      <Code2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-sm text-slate-900">{kpi.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{kpi.category}</span>
                          <span className="text-xs text-slate-300">--</span>
                          <span className="text-xs text-slate-400">{usedMetrics.length} fields</span>
                          <span className="text-xs text-slate-300">--</span>
                          <span className="text-xs text-slate-400">{sourceTypes.length} components</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(generateMarkdown(kpi, usedMetrics), kpi.id);
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {copiedId === kpi.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                        {kpi.description && (
                          <p className="text-sm text-slate-600">{kpi.description}</p>
                        )}

                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Formula</p>
                          <code className="block bg-slate-900 text-cyan-300 px-4 py-3 rounded-lg text-sm font-mono">
                            {kpi.formula}
                          </code>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Data Sources
                          </p>
                          <div className="flex items-start gap-4">
                            <div className="space-y-1.5">
                              {sourceTypes.map((type) => {
                                const color = COMPONENT_COLORS[type] || '#64748b';
                                return (
                                  <div
                                    key={type}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border"
                                    style={{ borderColor: color + '40', backgroundColor: color + '08', color }}
                                  >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                    {type}
                                  </div>
                                );
                              })}
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 mt-1.5" />
                            <div className="space-y-1.5 flex-1">
                              {usedMetrics.map((m) => (
                                <div key={m.id} className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-lg text-xs">
                                  <code className="font-mono text-slate-700">{m.field_path}</code>
                                  <span className="text-slate-400">{m.data_type}</span>
                                  {m.description && <span className="text-slate-400 truncate">-- {m.description}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Relationships to Traverse
                          </p>
                          <div className="space-y-1">
                            {sourceTypes.length > 1 &&
                              SCHEMA_RELATIONSHIPS
                                .filter((r) => sourceTypes.includes(r.from) || sourceTypes.includes(r.to))
                                .filter((r) => sourceTypes.includes(r.from) && sourceTypes.includes(r.to))
                                .map((r) => (
                                  <div key={`${r.from}-${r.to}`} className="flex items-center gap-2 text-xs text-slate-600">
                                    <code className="font-mono bg-slate-100 px-2 py-0.5 rounded">{r.from}</code>
                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                    <code className="font-mono bg-slate-100 px-2 py-0.5 rounded">{r.to}</code>
                                    <span className="text-slate-400">({r.label})</span>
                                  </div>
                                ))}
                            {sourceTypes.length <= 1 && (
                              <p className="text-xs text-slate-400">Single-component KPI -- no joins needed</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                          <div>
                            <p className="text-xs text-slate-400">Unit</p>
                            <p className="text-sm font-medium text-slate-700">{kpi.unit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Format</p>
                            <p className="text-sm font-medium text-slate-700">{kpi.display_format}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Chart Type</p>
                            <p className="text-sm font-medium text-slate-700">{kpi.chart_type}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Category</p>
                            <p className="text-sm font-medium text-slate-700">{kpi.category}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'data-map' && (
          <div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700">
                  Data Requirements ({dataRequirements.length} fields referenced)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every schema field referenced by at least one KPI
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium text-slate-500">
                    <th className="text-left px-5 py-2.5">Component</th>
                    <th className="text-left px-5 py-2.5">Field Path</th>
                    <th className="text-left px-5 py-2.5">Type</th>
                    <th className="text-left px-5 py-2.5">Used By KPIs</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRequirements.map(({ metric, kpiNames }, idx) => {
                    const color = COMPONENT_COLORS[metric.schema_type_key] || '#64748b';
                    return (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-2.5">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: color + '10', color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                            {metric.schema_type_key}
                          </span>
                        </td>
                        <td className="px-5 py-2.5">
                          <code className="text-xs font-mono text-slate-700">{metric.field_path}</code>
                        </td>
                        <td className="px-5 py-2.5 text-xs text-slate-500">{metric.data_type}</td>
                        <td className="px-5 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {kpiNames.map((name) => (
                              <span key={name} className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full">
                                {name}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {dataRequirements.length === 0 && (
                <div className="px-5 py-8 text-center text-xs text-slate-400">
                  No data requirements yet. Create KPIs to see which fields are needed.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'annotations' && (
          <ProductNotes
            annotations={annotations}
            proposals={proposals}
            auditEntries={auditEntries}
            schemaTypes={schemaTypes}
          />
        )}
      </div>
    </div>
  );
}
