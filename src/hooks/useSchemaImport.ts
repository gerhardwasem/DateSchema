import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { SchemaType, JsonSchema } from '../lib/types';

export interface ImportEntry {
  type_key: string;
  display_name?: string;
  description?: string;
  json_schema: JsonSchema;
  parent_types?: string[];
}

export interface DiffField {
  path: string;
  kind: 'added' | 'removed' | 'modified';
  oldValue?: unknown;
  newValue?: unknown;
}

export interface ImportPreview {
  type_key: string;
  display_name: string;
  matched: boolean;
  schemaTypeId?: string;
  diffs: DiffField[];
  unchanged: boolean;
}

function diffProperties(
  oldProps: Record<string, unknown>,
  newProps: Record<string, unknown>,
  prefix: string
): DiffField[] {
  const diffs: DiffField[] = [];
  const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const oldVal = oldProps[key];
    const newVal = newProps[key];

    if (!(key in oldProps)) {
      diffs.push({ path, kind: 'added', newValue: newVal });
    } else if (!(key in newProps)) {
      diffs.push({ path, kind: 'removed', oldValue: oldVal });
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      if (
        typeof oldVal === 'object' && oldVal !== null && !Array.isArray(oldVal) &&
        typeof newVal === 'object' && newVal !== null && !Array.isArray(newVal)
      ) {
        diffs.push(...diffProperties(
          oldVal as Record<string, unknown>,
          newVal as Record<string, unknown>,
          path
        ));
      } else {
        diffs.push({ path, kind: 'modified', oldValue: oldVal, newValue: newVal });
      }
    }
  }

  return diffs;
}

export function computeDiff(current: JsonSchema, incoming: JsonSchema): DiffField[] {
  const diffs: DiffField[] = [];

  diffs.push(...diffProperties(
    (current.properties || {}) as Record<string, unknown>,
    (incoming.properties || {}) as Record<string, unknown>,
    ''
  ));

  const oldReq = new Set(current.required || []);
  const newReq = new Set(incoming.required || []);
  for (const r of newReq) {
    if (!oldReq.has(r)) diffs.push({ path: `required.${r}`, kind: 'added', newValue: true });
  }
  for (const r of oldReq) {
    if (!newReq.has(r)) diffs.push({ path: `required.${r}`, kind: 'removed', oldValue: true });
  }

  return diffs;
}

export function useSchemaImport(schemaTypes: SchemaType[]) {
  const [importing, setImporting] = useState(false);

  const parseInput = (raw: string): ImportEntry[] | null => {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed.type_key) return [parsed];
      return null;
    } catch {
      return null;
    }
  };

  const preview = (entries: ImportEntry[]): ImportPreview[] => {
    return entries.map((entry) => {
      const existing = schemaTypes.find((s) => s.type_key === entry.type_key);
      if (!existing) {
        return {
          type_key: entry.type_key,
          display_name: entry.display_name || entry.type_key,
          matched: false,
          diffs: [],
          unchanged: false,
        };
      }

      const diffs = computeDiff(existing.json_schema, entry.json_schema);

      return {
        type_key: entry.type_key,
        display_name: existing.display_name,
        matched: true,
        schemaTypeId: existing.id,
        diffs,
        unchanged: diffs.length === 0,
      };
    });
  };

  const executeImport = async (entries: ImportEntry[], actor: string, changeSummary: string) => {
    setImporting(true);
    const results: { type_key: string; success: boolean; error?: string }[] = [];

    for (const entry of entries) {
      const existing = schemaTypes.find((s) => s.type_key === entry.type_key);
      if (!existing) {
        results.push({ type_key: entry.type_key, success: false, error: 'No matching type found' });
        continue;
      }

      const diffs = computeDiff(existing.json_schema, entry.json_schema);
      if (diffs.length === 0) {
        results.push({ type_key: entry.type_key, success: true });
        continue;
      }

      const { error } = await supabase
        .from('schema_types')
        .update({
          json_schema: entry.json_schema,
          ...(entry.parent_types ? { parent_types: entry.parent_types } : {}),
        })
        .eq('id', existing.id);

      if (error) {
        results.push({ type_key: entry.type_key, success: false, error: error.message });
      } else {
        await supabase.from('schema_audit_log').insert({
          entity_type: 'schema_type',
          entity_id: existing.id,
          action: 'imported',
          change_summary: `${changeSummary} (${entry.type_key})`,
          actor,
        });
        results.push({ type_key: entry.type_key, success: true });
      }
    }

    setImporting(false);
    return results;
  };

  return { parseInput, preview, executeImport, importing };
}
