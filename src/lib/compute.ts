import type { KpiDefinition, Metric, SampleComponent } from './types';

function extractNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function stripDataPrefix(fieldPath: string): string {
  if (fieldPath.startsWith('data.')) return fieldPath.slice(5);
  if (fieldPath.startsWith('aggregate.')) return fieldPath.slice(10);
  return fieldPath;
}

function resolveMetricValues(
  kpi: KpiDefinition,
  components: SampleComponent[],
  metrics: Metric[]
): number[] {
  const nodes = kpi.formula_config.nodes || [];
  const values: number[] = [];
  const metricMap = new Map(metrics.map((m) => [m.id, m]));

  for (const node of nodes) {
    if (node.type === 'constant' && node.value !== undefined) {
      values.push(node.value);
    }
    if (node.type === 'metric' && node.metric_id) {
      const metric = metricMap.get(node.metric_id);
      if (!metric) {
        values.push(0);
        continue;
      }
      const path = stripDataPrefix(metric.field_path);
      const comp = components.find((c) => c.schema_type_key === metric.schema_type_key);
      if (comp) {
        const val = extractNestedValue(comp.data as Record<string, unknown>, path);
        values.push(typeof val === 'number' ? val : 0);
      } else {
        values.push(0);
      }
    }
  }

  return values;
}

function applyOperators(kpi: KpiDefinition, values: number[]): number {
  if (values.length === 0) return 0;

  const nodes = kpi.formula_config.nodes || [];
  const ops = nodes.filter((n) => n.type === 'operator');
  if (ops.length === 0) return values[0] || 0;

  const firstNode = nodes[0];
  if (
    firstNode.type === 'operator' &&
    ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN'].includes(firstNode.operator || '')
  ) {
    switch (firstNode.operator) {
      case 'COUNT':
        return values.length;
      case 'SUM':
        return values.reduce((s, v) => s + v, 0);
      case 'AVG':
        return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
      case 'MAX':
        return Math.max(...values);
      case 'MIN':
        return Math.min(...values);
    }
  }

  let result = values[0] || 0;
  let valIdx = 1;
  for (const op of ops) {
    const next = values[valIdx] || 0;
    valIdx++;
    switch (op.operator) {
      case '+':
        result += next;
        break;
      case '-':
        result -= next;
        break;
      case '*':
        result *= next;
        break;
      case '/':
        result = next !== 0 ? result / next : 0;
        break;
      case 'SUM':
        result += next;
        break;
      case 'AVG': {
        const processed = values.slice(0, valIdx);
        result = processed.reduce((s, v) => s + v, 0) / processed.length;
        break;
      }
      case 'MAX':
        result = Math.max(result, next);
        break;
      case 'MIN':
        result = Math.min(result, next);
        break;
      case 'COUNT':
        result = values.length;
        break;
      default:
        break;
    }
  }
  return result;
}

export function computeEventValue(
  kpi: KpiDefinition,
  components: SampleComponent[],
  metrics: Metric[]
): number {
  const values = resolveMetricValues(kpi, components, metrics);
  return applyOperators(kpi, values);
}

export function computeVenueValue(
  kpi: KpiDefinition,
  eventGroups: { components: SampleComponent[] }[],
  metrics: Metric[]
): number {
  if (eventGroups.length === 0) return 0;

  const perEvent = eventGroups.map((g) => computeEventValue(kpi, g.components, metrics));

  const aggOps = (kpi.formula_config.nodes || []).filter(
    (n) => n.type === 'operator' && ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN'].includes(n.operator || '')
  );

  if (aggOps.length > 0) {
    const lastAgg = aggOps[aggOps.length - 1].operator;
    switch (lastAgg) {
      case 'SUM':
        return perEvent.reduce((s, v) => s + v, 0);
      case 'AVG':
        return perEvent.reduce((s, v) => s + v, 0) / perEvent.length;
      case 'COUNT':
        return perEvent.length;
      case 'MAX':
        return Math.max(...perEvent);
      case 'MIN':
        return Math.min(...perEvent);
    }
  }

  return perEvent.reduce((s, v) => s + v, 0) / perEvent.length;
}

export function resolveMetricTotal(
  metricId: string,
  eventGroups: { components: SampleComponent[] }[],
  metrics: Metric[]
): number {
  const metric = metrics.find((m) => m.id === metricId);
  if (!metric) return 0;

  const path = stripDataPrefix(metric.field_path);
  let total = 0;
  for (const group of eventGroups) {
    const comp = group.components.find((c) => c.schema_type_key === metric.schema_type_key);
    if (comp) {
      const val = extractNestedValue(comp.data as Record<string, unknown>, path);
      if (typeof val === 'number') total += val;
    }
  }
  return total;
}

export interface ComparisonChartData {
  name: string;
  venueA: number;
  venueB: number;
}

export function computeComparisonData(
  kpi: KpiDefinition,
  venueAEvents: { components: SampleComponent[] }[],
  venueBEvents: { components: SampleComponent[] }[],
  metrics: Metric[]
): ComparisonChartData[] {
  const metricNodes = (kpi.formula_config.nodes || []).filter(
    (n) => n.type === 'metric' && n.metric_id
  );
  if (metricNodes.length === 0) return [];

  return metricNodes.map((node) => ({
    name: node.label || 'Metric',
    venueA: resolveMetricTotal(node.metric_id!, venueAEvents, metrics),
    venueB: resolveMetricTotal(node.metric_id!, venueBEvents, metrics),
  }));
}

export function generateRealChartData(
  kpi: KpiDefinition,
  allEventComponents: Record<string, SampleComponent[]>,
  metrics: Metric[]
): { name: string; value: number }[] {
  const eventComps = Object.values(allEventComponents);
  if (eventComps.length === 0) {
    return [{ name: 'No data', value: 0 }];
  }

  if (kpi.chart_type === 'pie') {
    const metricNodes = (kpi.formula_config.nodes || []).filter(
      (n) => n.type === 'metric' && n.metric_id
    );
    if (metricNodes.length === 0) return [{ name: 'No metrics', value: 0 }];

    const eventGroups = eventComps.map((comps) => ({ components: comps }));
    return metricNodes.map((node) => ({
      name: node.label || 'Metric',
      value: resolveMetricTotal(node.metric_id!, eventGroups, metrics) || 1,
    }));
  }

  return eventComps.map((comps, idx) => {
    const eventComp = comps.find((c) => c.schema_type_key === 'event');
    const label = eventComp
      ? String((eventComp.data as Record<string, unknown>).eventName || `Event ${idx + 1}`).slice(0, 12)
      : `Event ${idx + 1}`;
    return {
      name: label,
      value: computeEventValue(kpi, comps, metrics),
    };
  });
}
