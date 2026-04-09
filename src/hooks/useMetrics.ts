import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useProject } from '../contexts/ProjectContext';
import type { Metric } from '../lib/types';

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const { projectId } = useProject();

  const fetchMetrics = useCallback(async () => {
    if (!projectId) {
      setMetrics([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('metrics')
      .select('*')
      .eq('project_id', projectId)
      .order('schema_type_key, field_path');

    if (!error && data) {
      setMetrics(data as Metric[]);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    fetchMetrics();
  }, [fetchMetrics]);

  const metricsByType = metrics.reduce<Record<string, Metric[]>>((acc, m) => {
    if (!acc[m.schema_type_key]) acc[m.schema_type_key] = [];
    acc[m.schema_type_key].push(m);
    return acc;
  }, {});

  return { metrics, metricsByType, loading };
}
