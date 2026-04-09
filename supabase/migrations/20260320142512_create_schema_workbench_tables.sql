/*
  # Create Schema Workbench Tables

  1. New Tables
    - `schema_types` - Stores the 21 component type definitions with JSON schema
      - `id` (uuid, primary key)
      - `type_key` (text, unique) - e.g., 'event', 'budget', 'venue'
      - `display_name` (text) - Human-readable name
      - `description` (text) - Component description
      - `json_schema` (jsonb) - Full JSON schema definition
      - `parent_types` (text[]) - Which types can be parents
      - `sort_order` (integer) - Display ordering
      - `created_at` (timestamptz)

    - `annotations` - PM notes on schema components or fields
      - `id` (uuid, primary key)
      - `schema_type_id` (uuid, FK to schema_types)
      - `field_path` (text, nullable) - Dot-notation path to field, null = type-level
      - `note` (text) - The annotation text
      - `priority` (text) - must-have, nice-to-have, future
      - `tags` (text[]) - Freeform tags
      - `created_at` / `updated_at` (timestamptz)

    - `sample_events` - Named sample event scenarios
      - `id` (uuid, primary key)
      - `name` (text) - Scenario name
      - `description` (text, nullable)
      - `created_at` / `updated_at` (timestamptz)

    - `sample_components` - Individual component instances within sample events
      - `id` (uuid, primary key)
      - `sample_event_id` (uuid, FK to sample_events)
      - `schema_type_key` (text) - Which component type
      - `component_id` (text) - The id field within the data
      - `parent_component_id` (text, nullable) - Parent reference
      - `data` (jsonb) - The actual component data
      - `created_at` (timestamptz)

    - `metrics` - Raw metrics extracted from schema fields
      - `id` (uuid, primary key)
      - `schema_type_key` (text) - Which component type
      - `field_path` (text) - Dot-notation path
      - `display_name` (text) - Human-readable name
      - `data_type` (text) - integer, number, boolean
      - `description` (text, nullable)
      - `created_at` (timestamptz)

    - `kpi_definitions` - PM-defined KPI formulas
      - `id` (uuid, primary key)
      - `name` (text) - KPI name
      - `description` (text, nullable)
      - `formula` (text) - Text representation of formula
      - `formula_config` (jsonb) - Structured formula definition
      - `metric_ids` (uuid[]) - References to metrics used
      - `unit` (text) - EUR, %, count, days
      - `display_format` (text) - number, currency, percentage
      - `category` (text) - Financial, Operational, Capacity, Timeline
      - `chart_type` (text) - stat, bar, line, pie, table
      - `created_at` / `updated_at` (timestamptz)

    - `dashboard_layouts` - Saved dashboard widget positions
      - `id` (uuid, primary key)
      - `name` (text) - Dashboard name
      - `widgets` (jsonb) - Array of widget configs with positions
      - `created_at` / `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for anonymous access (no auth required for this PM tool)
*/

CREATE TABLE IF NOT EXISTS schema_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_key text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  json_schema jsonb NOT NULL DEFAULT '{}',
  parent_types text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE schema_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on schema_types"
  ON schema_types FOR SELECT
  TO anon
  USING (type_key IS NOT NULL);

CREATE POLICY "Allow anonymous insert on schema_types"
  ON schema_types FOR INSERT
  TO anon
  WITH CHECK (type_key IS NOT NULL);

CREATE TABLE IF NOT EXISTS annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_type_id uuid NOT NULL REFERENCES schema_types(id),
  field_path text,
  note text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'nice-to-have',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on annotations"
  ON annotations FOR SELECT
  TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anonymous insert on annotations"
  ON annotations FOR INSERT
  TO anon
  WITH CHECK (note <> '');

CREATE POLICY "Allow anonymous update on annotations"
  ON annotations FOR UPDATE
  TO anon
  USING (id IS NOT NULL)
  WITH CHECK (note <> '');

CREATE POLICY "Allow anonymous delete on annotations"
  ON annotations FOR DELETE
  TO anon
  USING (id IS NOT NULL);

CREATE TABLE IF NOT EXISTS sample_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sample_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on sample_events"
  ON sample_events FOR SELECT
  TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anonymous insert on sample_events"
  ON sample_events FOR INSERT
  TO anon
  WITH CHECK (name <> '');

CREATE POLICY "Allow anonymous update on sample_events"
  ON sample_events FOR UPDATE
  TO anon
  USING (id IS NOT NULL)
  WITH CHECK (name <> '');

CREATE POLICY "Allow anonymous delete on sample_events"
  ON sample_events FOR DELETE
  TO anon
  USING (id IS NOT NULL);

CREATE TABLE IF NOT EXISTS sample_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_event_id uuid NOT NULL REFERENCES sample_events(id),
  schema_type_key text NOT NULL,
  component_id text NOT NULL,
  parent_component_id text,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sample_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on sample_components"
  ON sample_components FOR SELECT
  TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anonymous insert on sample_components"
  ON sample_components FOR INSERT
  TO anon
  WITH CHECK (component_id <> '');

CREATE POLICY "Allow anonymous update on sample_components"
  ON sample_components FOR UPDATE
  TO anon
  USING (id IS NOT NULL)
  WITH CHECK (component_id <> '');

CREATE POLICY "Allow anonymous delete on sample_components"
  ON sample_components FOR DELETE
  TO anon
  USING (id IS NOT NULL);

CREATE TABLE IF NOT EXISTS metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_type_key text NOT NULL,
  field_path text NOT NULL,
  display_name text NOT NULL,
  data_type text NOT NULL DEFAULT 'number',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(schema_type_key, field_path)
);

ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on metrics"
  ON metrics FOR SELECT
  TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anonymous insert on metrics"
  ON metrics FOR INSERT
  TO anon
  WITH CHECK (display_name <> '');

CREATE TABLE IF NOT EXISTS kpi_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  formula text NOT NULL DEFAULT '',
  formula_config jsonb NOT NULL DEFAULT '{}',
  metric_ids uuid[] NOT NULL DEFAULT '{}',
  unit text NOT NULL DEFAULT 'count',
  display_format text NOT NULL DEFAULT 'number',
  category text NOT NULL DEFAULT 'Operational',
  chart_type text NOT NULL DEFAULT 'stat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on kpi_definitions"
  ON kpi_definitions FOR SELECT
  TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anonymous insert on kpi_definitions"
  ON kpi_definitions FOR INSERT
  TO anon
  WITH CHECK (name <> '');

CREATE POLICY "Allow anonymous update on kpi_definitions"
  ON kpi_definitions FOR UPDATE
  TO anon
  USING (id IS NOT NULL)
  WITH CHECK (name <> '');

CREATE POLICY "Allow anonymous delete on kpi_definitions"
  ON kpi_definitions FOR DELETE
  TO anon
  USING (id IS NOT NULL);

CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  widgets jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on dashboard_layouts"
  ON dashboard_layouts FOR SELECT
  TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anonymous insert on dashboard_layouts"
  ON dashboard_layouts FOR INSERT
  TO anon
  WITH CHECK (name <> '');

CREATE POLICY "Allow anonymous update on dashboard_layouts"
  ON dashboard_layouts FOR UPDATE
  TO anon
  USING (id IS NOT NULL)
  WITH CHECK (name <> '');

CREATE POLICY "Allow anonymous delete on dashboard_layouts"
  ON dashboard_layouts FOR DELETE
  TO anon
  USING (id IS NOT NULL);
