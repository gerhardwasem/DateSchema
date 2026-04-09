import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useProject } from '../contexts/ProjectContext';
import type { SchemaType } from '../lib/types';

export function useSchemaTypes() {
  const [schemaTypes, setSchemaTypes] = useState<SchemaType[]>([]);
  const [loading, setLoading] = useState(true);
  const { projectId } = useProject();

  const fetchTypes = useCallback(async () => {
    if (!projectId) {
      setSchemaTypes([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('schema_types')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');

    if (!error && data) {
      setSchemaTypes(data as SchemaType[]);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    fetchTypes();
  }, [fetchTypes]);

  const createSchemaType = useCallback(async (input: {
    type_key: string;
    display_name: string;
    description: string;
    parent_types: string[];
    json_schema: Record<string, unknown>;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!projectId) return { success: false, error: 'No active project' };

    const { data: maxSort } = await supabase
      .from('schema_types')
      .select('sort_order')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = ((maxSort?.sort_order as number) || 0) + 1;

    const { data: inserted, error: insertError } = await supabase
      .from('schema_types')
      .insert({
        project_id: projectId,
        type_key: input.type_key,
        display_name: input.display_name,
        description: input.description || '',
        json_schema: input.json_schema,
        parent_types: input.parent_types || [],
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      if (insertError?.code === '23505') {
        return { success: false, error: `Type key "${input.type_key}" is already in use.` };
      }
      return { success: false, error: insertError?.message || 'Failed to create type.' };
    }

    await supabase.from('schema_versions').insert({
      project_id: projectId,
      schema_type_id: inserted.id,
      version_number: 1,
      json_schema: input.json_schema,
      parent_types: input.parent_types || [],
      change_summary: 'Initial version',
      actor: 'direct',
    });

    await fetchTypes();
    return { success: true };
  }, [fetchTypes, projectId]);

  const deleteSchemaType = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('schema_types').delete().eq('id', id);
    if (!error) await fetchTypes();
    return !error;
  }, [fetchTypes]);

  return { schemaTypes, loading, refetch: fetchTypes, createSchemaType, deleteSchemaType };
}
