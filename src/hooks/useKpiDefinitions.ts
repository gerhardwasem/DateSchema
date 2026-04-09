import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { KpiDefinition } from '../lib/types';

export function useKpiDefinitions() {
  const [kpis, setKpis] = useState<KpiDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKpis = useCallback(async () => {
    const { data, error } = await supabase
      .from('kpi_definitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setKpis(data as KpiDefinition[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  const saveKpi = async (kpi: Omit<KpiDefinition, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('kpi_definitions').insert(kpi);
    if (!error) await fetchKpis();
    return !error;
  };

  const updateKpi = async (id: string, updates: Partial<KpiDefinition>) => {
    const { error } = await supabase
      .from('kpi_definitions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) await fetchKpis();
    return !error;
  };

  const deleteKpi = async (id: string) => {
    const { error } = await supabase.from('kpi_definitions').delete().eq('id', id);
    if (!error) await fetchKpis();
    return !error;
  };

  return { kpis, loading, saveKpi, updateKpi, deleteKpi };
}
