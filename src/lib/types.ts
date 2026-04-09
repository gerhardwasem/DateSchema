export interface SchemaType {
  id: string;
  type_key: string;
  display_name: string;
  description: string;
  json_schema: JsonSchema;
  parent_types: string[];
  sort_order: number;
  source: 'initial' | 'proposal';
  source_proposal_id: string | null;
  created_at: string;
}

export interface JsonSchema {
  properties: Record<string, SchemaProperty>;
  required?: string[];
  description?: string;
}

export interface SchemaProperty {
  type: string;
  enum?: string[];
  format?: string;
  nullable?: boolean;
  minimum?: number;
  items?: SchemaProperty | { type: string; properties?: Record<string, SchemaProperty>; required?: string[] };
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  description?: string;
}

export interface Annotation {
  id: string;
  schema_type_id: string;
  field_path: string | null;
  note: string;
  priority: 'must-have' | 'nice-to-have' | 'future';
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SampleEvent {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SampleComponent {
  id: string;
  sample_event_id: string;
  schema_type_key: string;
  component_id: string;
  parent_component_id: string | null;
  data: Record<string, unknown>;
  created_at: string;
}

export interface Metric {
  id: string;
  schema_type_key: string;
  field_path: string;
  display_name: string;
  data_type: string;
  description: string | null;
  created_at: string;
  proposed?: boolean;
  proposal_status?: string;
}

export interface KpiDefinition {
  id: string;
  name: string;
  description: string | null;
  formula: string;
  formula_config: FormulaConfig;
  metric_ids: string[];
  unit: string;
  display_format: string;
  category: string;
  chart_type: string;
  scope: 'event' | 'venue';
  created_at: string;
  updated_at: string;
}

export interface FormulaConfig {
  nodes: FormulaNode[];
}

export interface FormulaNode {
  id: string;
  type: 'metric' | 'operator' | 'constant';
  metric_id?: string;
  operator?: '+' | '-' | '*' | '/' | 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN';
  value?: number;
  label?: string;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  kpi_id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  chart_type: string;
}

export interface SchemaRelationship {
  from: string;
  to: string;
  label: string;
}

export type ProposalStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'implemented';
export type ChangeType = 'add_field' | 'modify_field' | 'remove_field' | 'add_relationship' | 'remove_relationship' | 'modify_type' | 'create_type';

export interface SchemaVersion {
  id: string;
  schema_type_id: string;
  version_number: number;
  json_schema: JsonSchema;
  parent_types: string[];
  change_summary: string;
  actor: string;
  created_at: string;
}

export interface ChangeProposal {
  id: string;
  schema_type_id: string;
  change_type: ChangeType;
  field_path: string | null;
  title: string;
  rationale: string;
  proposed_value: Record<string, unknown>;
  current_value: Record<string, unknown>;
  status: ProposalStatus;
  priority: 'must-have' | 'nice-to-have' | 'future';
  tags: string[];
  actor: string;
  hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProposalComment {
  id: string;
  proposal_id: string;
  author: string;
  body: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  change_summary: string;
  actor: string;
  created_at: string;
}
