import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Metric } from '../lib/types';

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .order('schema_type_key, field_path');

      if (!error && data) {
        setMetrics(data as Metric[]);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const metricsByType = metrics.reduce<Record<string, Metric[]>>((acc, m) => {
    if (!acc[m.schema_type_key]) acc[m.schema_type_key] = [];
    acc[m.schema_type_key].push(m);
    return acc;
  }, {});

  return { metrics, metricsByType, loading };
}
