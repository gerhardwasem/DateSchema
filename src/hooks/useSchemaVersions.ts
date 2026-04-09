import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { SchemaVersion } from '../lib/types';

export function useSchemaVersions(schemaTypeId?: string) {
  const [versions, setVersions] = useState<SchemaVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVersions = useCallback(async () => {
    if (!schemaTypeId) {
      setVersions([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('schema_versions')
      .select('*')
      .eq('schema_type_id', schemaTypeId)
      .order('version_number', { ascending: false });

    if (!error && data) {
      setVersions(data as SchemaVersion[]);
    }
    setLoading(false);
  }, [schemaTypeId]);

  useEffect(() => {
    setLoading(true);
    fetchVersions();
  }, [fetchVersions]);

  return { versions, loading, refetch: fetchVersions };
}
