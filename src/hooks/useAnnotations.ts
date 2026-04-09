import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useProject } from '../contexts/ProjectContext';
import type { Annotation } from '../lib/types';

export function useAnnotations() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const { projectId } = useProject();

  const fetchAnnotations = useCallback(async () => {
    if (!projectId) {
      setAnnotations([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('annotations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnnotations(data as Annotation[]);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    fetchAnnotations();
  }, [fetchAnnotations]);

  const addAnnotation = async (
    schemaTypeId: string,
    fieldPath: string | null,
    note: string,
    priority: Annotation['priority'],
    tags: string[]
  ) => {
    if (!projectId) return false;
    const { error } = await supabase.from('annotations').insert({
      project_id: projectId,
      schema_type_id: schemaTypeId,
      field_path: fieldPath,
      note,
      priority,
      tags,
    });
    if (!error) await fetchAnnotations();
    return !error;
  };

  const updateAnnotation = async (id: string, updates: Partial<Annotation>) => {
    const { error } = await supabase
      .from('annotations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) await fetchAnnotations();
    return !error;
  };

  const deleteAnnotation = async (id: string) => {
    const { error } = await supabase.from('annotations').delete().eq('id', id);
    if (!error) await fetchAnnotations();
    return !error;
  };

  return { annotations, loading, addAnnotation, updateAnnotation, deleteAnnotation };
}
