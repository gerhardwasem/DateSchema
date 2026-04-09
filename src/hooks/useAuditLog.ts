import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useProject } from '../contexts/ProjectContext';
import type { AuditLogEntry } from '../lib/types';

interface AuditFilters {
  entityType?: string;
  entityId?: string;
  action?: string;
  limit?: number;
}

export function useAuditLog(filters?: AuditFilters) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { projectId } = useProject();

  const fetchEntries = useCallback(async () => {
    if (!projectId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from('schema_audit_log')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters?.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (!error && data) {
      setEntries(data as AuditLogEntry[]);
    }
    setLoading(false);
  }, [projectId, filters?.entityType, filters?.entityId, filters?.action, filters?.limit]);

  useEffect(() => {
    setLoading(true);
    fetchEntries();
  }, [fetchEntries]);

  return { entries, loading, refetch: fetchEntries };
}
