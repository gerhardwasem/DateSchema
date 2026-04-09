import { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import type { Metric, FormulaNode } from '../../lib/types';
import { COMPONENT_COLORS } from '../../lib/schema-relationships';

interface Props {
  nodes: FormulaNode[];
  metrics: Metric[];
  onNodesChange: (nodes: FormulaNode[]) => void;
  onDrop: (metric: Metric) => void;
}

const OPERATORS = [
  { symbol: '+', label: 'Add' },
  { symbol: '-', label: 'Subtract' },
  { symbol: '*', label: 'Multiply' },
  { symbol: '/', label: 'Divide' },
  { symbol: 'SUM', label: 'Sum' },
  { symbol: 'AVG', label: 'Average' },
  { symbol: 'COUNT', label: 'Count' },
  { symbol: 'MAX', label: 'Max' },
  { symbol: 'MIN', label: 'Min' },
] as const;

export default function FormulaCanvas({ nodes, metrics, onNodesChange, onDrop }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [constantValue, setConstantValue] = useState('');
  const [showConstant, setShowConstant] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDropEvent = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const data = e.dataTransfer.getData('metric');
    if (data) {
      const metric: Metric = JSON.parse(data);
      onDrop(metric);
    }
  };

  const addOperator = (op: string) => {
    const node: FormulaNode = {
      id: `op_${Date.now()}`,
      type: 'operator',
      operator: op as FormulaNode['operator'],
      label: op,
    };
    onNodesChange([...nodes, node]);
  };

  const addConstant = () => {
    if (!constantValue) return;
    const node: FormulaNode = {
      id: `const_${Date.now()}`,
      type: 'constant',
      value: Number(constantValue),
      label: constantValue,
    };
    onNodesChange([...nodes, node]);
    setConstantValue('');
    setShowConstant(false);
  };

  const removeNode = (id: string) => {
    onNodesChange(nodes.filter((n) => n.id !== id));
  };

  const getMetric = (metricId?: string) => metrics.find((m) => m.id === metricId);

  const formulaText = nodes
    .map((n) => {
      if (n.type === 'metric') return getMetric(n.metric_id)?.display_name || '?';
      if (n.type === 'operator') return n.operator;
      return String(n.value);
    })
    .join(' ');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operators</span>
        {OPERATORS.map((op) => (
          <button
            key={op.symbol}
            onClick={() => addOperator(op.symbol)}
            className="operator-btn"
            title={op.label}
          >
            {op.symbol}
          </button>
        ))}
        <button
          onClick={() => setShowConstant(!showConstant)}
          className="operator-btn text-xs"
          title="Add constant"
        >
          #
        </button>
        {showConstant && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={constantValue}
              onChange={(e) => setConstantValue(e.target.value)}
              className="w-20 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
              placeholder="Value"
              onKeyDown={(e) => e.key === 'Enter' && addConstant()}
              autoFocus
            />
            <button onClick={addConstant} className="text-xs text-cyan-600 font-medium">
              Add
            </button>
          </div>
        )}
      </div>

      <div
        className={`kpi-canvas flex-1 ${dragOver ? 'kpi-canvas-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropEvent}
      >
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p className="text-sm">Drag metrics here to build your formula</p>
            <p className="text-xs mt-1">Then add operators between them</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center flex-wrap gap-2">
              {nodes.map((node, idx) => {
                const metric = node.type === 'metric' ? getMetric(node.metric_id) : null;
                const color = metric ? COMPONENT_COLORS[metric.schema_type_key] || '#64748b' : '#64748b';

                return (
                  <div key={node.id} className="flex items-center gap-2">
                    {idx > 0 && node.type !== 'operator' && nodes[idx - 1]?.type !== 'operator' && (
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                    )}
                    <div
                      className={`group relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        node.type === 'metric'
                          ? `border-2 shadow-sm ${metric?.proposed ? 'border-dashed' : ''}`
                          : node.type === 'operator'
                          ? 'bg-slate-800 text-white font-bold px-3 py-2 rounded-lg'
                          : 'bg-amber-50 border border-amber-200 text-amber-700'
                      }`}
                      style={
                        node.type === 'metric'
                          ? { borderColor: color, backgroundColor: color + (metric?.proposed ? '08' : '10'), color }
                          : {}
                      }
                    >
                      {node.type === 'metric' && metric && (
                        <>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          {metric.display_name}
                          {metric.proposed && (
                            <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-amber-100 text-amber-600 border border-amber-200">
                              ~
                            </span>
                          )}
                        </>
                      )}
                      {node.type === 'operator' && node.operator}
                      {node.type === 'constant' && `${node.value}`}
                      <button
                        onClick={() => removeNode(node.id)}
                        className="opacity-0 group-hover:opacity-100 absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {formulaText && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-1">Formula Preview</p>
                <code className="text-sm font-mono text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
                  {formulaText}
                </code>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
