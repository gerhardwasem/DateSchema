import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useProject } from '../contexts/ProjectContext';
import type { KpiDefinition } from '../lib/types';

export function useKpiDefinitions() {
  const [kpis, setKpis] = useState<KpiDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const { projectId } = useProject();

  const fetchKpis = useCallback(async () => {
    if (!projectId) {
      setKpis([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('kpi_definitions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setKpis(data as KpiDefinition[]);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    fetchKpis();
  }, [fetchKpis]);

  const saveKpi = async (kpi: Omit<KpiDefinition, 'id' | 'project_id' | 'created_at' | 'updated_at'>) => {
    if (!projectId) return false;
    const { error } = await supabase.from('kpi_definitions').insert({ ...kpi, project_id: projectId });
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
