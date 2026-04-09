import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ChangeProposal, ChangeType } from '../lib/types';

export function useChangeProposals() {
  const [proposals, setProposals] = useState<ChangeProposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProposals = useCallback(async () => {
    const { data, error } = await supabase
      .from('schema_change_proposals')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProposals(data as ChangeProposal[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const applySchemaChange = async (
    schemaTypeId: string,
    changeType: ChangeType,
    proposedValue: Record<string, unknown>,
    proposalId: string,
  ): Promise<boolean> => {
    if (changeType === 'create_type') {
      return await applyCreateType(proposedValue, proposalId);
    }

    if (changeType === 'add_field') {
      return await applyAddField(schemaTypeId, proposedValue);
    }

    if (changeType === 'modify_field') {
      return await applyModifyField(schemaTypeId, proposedValue);
    }

    if (changeType === 'remove_field') {
      return await applyRemoveField(schemaTypeId, proposedValue);
    }

    if (changeType === 'add_relationship') {
      return await applyAddRelationship(schemaTypeId, proposedValue);
    }

    if (changeType === 'remove_relationship') {
      return await applyRemoveRelationship(schemaTypeId, proposedValue);
    }

    if (changeType === 'modify_type') {
      return await applyModifyType(schemaTypeId, proposedValue);
    }

    return true;
  };

  const applyCreateType = async (
    proposedValue: Record<string, unknown>,
    proposalId: string,
  ): Promise<boolean> => {
    const pv = proposedValue as {
      type_key: string;
      display_name: string;
      description: string;
      parent_types: string[];
      json_schema: Record<string, unknown>;
    };

    const { data: maxSort } = await supabase
      .from('schema_types')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = ((maxSort?.sort_order as number) || 0) + 1;

    const { error } = await supabase.from('schema_types').insert({
      type_key: pv.type_key,
      display_name: pv.display_name,
      description: pv.description || '',
      json_schema: pv.json_schema,
      parent_types: pv.parent_types || [],
      sort_order: nextSortOrder,
      source: 'proposal',
      source_proposal_id: proposalId,
    });

    return !error;
  };

  const applyAddField = async (
    schemaTypeId: string,
    proposedValue: Record<string, unknown>,
  ): Promise<boolean> => {
    const { data: current } = await supabase
      .from('schema_types')
      .select('json_schema')
      .eq('id', schemaTypeId)
      .maybeSingle();
    if (!current) return false;

    const schema = current.json_schema as { properties: Record<string, unknown>; required?: string[] };
    const isRequired = !!proposedValue._required;
    const entries = Object.entries(proposedValue).filter(([k]) => k !== '_required');
    if (entries.length === 0) return true;

    const [fieldName, fieldDef] = entries[0];
    schema.properties = { ...schema.properties, [fieldName]: fieldDef };
    if (isRequired) {
      schema.required = [...(schema.required || []), fieldName];
    }

    const { error } = await supabase
      .from('schema_types')
      .update({ json_schema: schema })
      .eq('id', schemaTypeId);

    return !error;
  };

  const applyModifyField = async (
    schemaTypeId: string,
    proposedValue: Record<string, unknown>,
  ): Promise<boolean> => {
    const { data: current } = await supabase
      .from('schema_types')
      .select('json_schema')
      .eq('id', schemaTypeId)
      .maybeSingle();
    if (!current) return false;

    const schema = current.json_schema as { properties: Record<string, unknown>; required?: string[] };
    for (const [fieldName, fieldDef] of Object.entries(proposedValue)) {
      schema.properties[fieldName] = fieldDef;
    }

    const { error } = await supabase
      .from('schema_types')
      .update({ json_schema: schema })
      .eq('id', schemaTypeId);

    return !error;
  };

  const applyRemoveField = async (
    schemaTypeId: string,
    proposedValue: Record<string, unknown>,
  ): Promise<boolean> => {
    const removed = (proposedValue._removed as string[]) || [];
    if (removed.length === 0) return true;

    const { data: current } = await supabase
      .from('schema_types')
      .select('json_schema')
      .eq('id', schemaTypeId)
      .maybeSingle();
    if (!current) return false;

    const schema = current.json_schema as { properties: Record<string, unknown>; required?: string[] };
    for (const fieldName of removed) {
      delete schema.properties[fieldName];
    }
    if (schema.required) {
      schema.required = schema.required.filter((r: string) => !removed.includes(r));
      if (schema.required.length === 0) delete schema.required;
    }

    const { error } = await supabase
      .from('schema_types')
      .update({ json_schema: schema })
      .eq('id', schemaTypeId);

    return !error;
  };

  const applyAddRelationship = async (
    schemaTypeId: string,
    proposedValue: Record<string, unknown>,
  ): Promise<boolean> => {
    const toAdd = proposedValue._add_parent as string | undefined;
    if (!toAdd) return true;

    const { data: current } = await supabase
      .from('schema_types')
      .select('parent_types')
      .eq('id', schemaTypeId)
      .maybeSingle();
    if (!current) return false;

    const parents = [...((current.parent_types as string[]) || [])];
    if (!parents.includes(toAdd)) parents.push(toAdd);

    const { error } = await supabase
      .from('schema_types')
      .update({ parent_types: parents })
      .eq('id', schemaTypeId);

    return !error;
  };

  const applyRemoveRelationship = async (
    schemaTypeId: string,
    proposedValue: Record<string, unknown>,
  ): Promise<boolean> => {
    const toRemove = proposedValue._remove_parent as string | undefined;
    if (!toRemove) return true;

    const { data: current } = await supabase
      .from('schema_types')
      .select('parent_types')
      .eq('id', schemaTypeId)
      .maybeSingle();
    if (!current) return false;

    const parents = ((current.parent_types as string[]) || []).filter((p: string) => p !== toRemove);

    const { error } = await supabase
      .from('schema_types')
      .update({ parent_types: parents })
      .eq('id', schemaTypeId);

    return !error;
  };

  const applyModifyType = async (
    schemaTypeId: string,
    proposedValue: Record<string, unknown>,
  ): Promise<boolean> => {
    const updates: Record<string, unknown> = {};
    if (proposedValue.display_name !== undefined) updates.display_name = proposedValue.display_name;
    if (proposedValue.description !== undefined) updates.description = proposedValue.description;
    if (proposedValue.parent_types !== undefined) updates.parent_types = proposedValue.parent_types;

    if (Object.keys(updates).length === 0) return true;

    const { error } = await supabase
      .from('schema_types')
      .update(updates)
      .eq('id', schemaTypeId);

    return !error;
  };

  const createProposal = async (proposal: {
    schema_type_id: string;
    change_type: ChangeType;
    field_path?: string | null;
    title: string;
    rationale: string;
    proposed_value: Record<string, unknown>;
    current_value: Record<string, unknown>;
    priority: ChangeProposal['priority'];
    tags?: string[];
    actor: string;
  }) => {
    const { data, error } = await supabase.from('schema_change_proposals').insert({
      schema_type_id: proposal.schema_type_id,
      change_type: proposal.change_type,
      field_path: proposal.field_path || null,
      title: proposal.title,
      rationale: proposal.rationale,
      proposed_value: proposal.proposed_value,
      current_value: proposal.current_value,
      status: 'implemented',
      priority: proposal.priority,
      tags: proposal.tags || [],
      actor: proposal.actor,
    }).select('id').maybeSingle();

    if (error || !data) return false;

    const applied = await applySchemaChange(
      proposal.schema_type_id,
      proposal.change_type,
      proposal.proposed_value,
      data.id,
    );

    if (!applied) {
      await supabase.from('schema_change_proposals').delete().eq('id', data.id);
      return false;
    }

    await fetchProposals();
    return true;
  };

  const updateProposal = async (id: string, updates: Partial<ChangeProposal>) => {
    const { error } = await supabase
      .from('schema_change_proposals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) await fetchProposals();
    return !error;
  };

  const deleteProposal = async (id: string) => {
    const proposal = proposals.find((p) => p.id === id);
    if (proposal?.change_type === 'create_type' && proposal.status === 'implemented') {
      const typeKey = (proposal.proposed_value as { type_key?: string }).type_key;
      if (typeKey) {
        await supabase.from('schema_types').delete().eq('type_key', typeKey);
      }
    }
    const { error } = await supabase.from('schema_change_proposals').delete().eq('id', id);
    if (!error) await fetchProposals();
    return !error;
  };

  const hideProposal = async (id: string, hidden: boolean) => {
    const { error } = await supabase
      .from('schema_change_proposals')
      .update({ hidden, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) await fetchProposals();
    return !error;
  };

  return { proposals, loading, createProposal, updateProposal, deleteProposal, hideProposal, refetch: fetchProposals };
}
