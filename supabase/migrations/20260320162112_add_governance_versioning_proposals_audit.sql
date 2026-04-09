/*
  # Add Schema Governance: Versioning, Change Proposals, and Audit Trail

  1. New Tables
    - `schema_versions` - Frozen snapshots of schema definitions
      - `id` (uuid, primary key)
      - `schema_type_id` (uuid, FK to schema_types)
      - `version_number` (integer)
      - `json_schema` (jsonb) - Frozen snapshot of schema at this version
      - `parent_types` (text[]) - Parent types at this version
      - `change_summary` (text) - Human description of what changed
      - `actor` (text) - Who made the change
      - `created_at` (timestamptz)

    - `schema_change_proposals` - Structured change suggestions
      - `id` (uuid, primary key)
      - `schema_type_id` (uuid, FK to schema_types)
      - `change_type` (text) - add_field, modify_field, remove_field, add_relationship, remove_relationship, modify_type
      - `field_path` (text, nullable) - Target field dot-path
      - `title` (text) - Short proposal title
      - `rationale` (text) - Why this change is needed
      - `proposed_value` (jsonb) - The proposed change definition
      - `current_value` (jsonb) - Snapshot of current state
      - `status` (text) - draft, submitted, approved, rejected, implemented
      - `priority` (text) - must-have, nice-to-have, future
      - `tags` (text[]) - Freeform tags
      - `actor` (text) - Who created the proposal
      - `created_at` / `updated_at` (timestamptz)

    - `proposal_comments` - Threaded discussion on proposals
      - `id` (uuid, primary key)
      - `proposal_id` (uuid, FK to schema_change_proposals)
      - `author` (text) - Comment author name
      - `body` (text) - Comment body
      - `created_at` (timestamptz)

    - `schema_audit_log` - Immutable audit trail
      - `id` (uuid, primary key)
      - `entity_type` (text) - schema_type, annotation, proposal, relationship
      - `entity_id` (uuid) - ID of the entity that changed
      - `action` (text) - created, updated, deleted, status_changed, imported
      - `old_value` (jsonb, nullable) - Previous state
      - `new_value` (jsonb, nullable) - New state
      - `change_summary` (text) - Human-readable description
      - `actor` (text) - Who performed the action
      - `created_at` (timestamptz)

  2. Triggers
    - `fn_schema_type_version_snapshot` fires BEFORE UPDATE on schema_types to auto-capture versions
    - `fn_audit_proposals` fires AFTER INSERT/UPDATE/DELETE on schema_change_proposals

  3. Seed Data
    - Inserts version 1 baseline snapshots for all existing schema_types

  4. Security
    - RLS enabled on all new tables
    - Anon read/write policies matching existing pattern
*/

-- schema_versions
CREATE TABLE IF NOT EXISTS schema_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_type_id uuid NOT NULL REFERENCES schema_types(id),
  version_number integer NOT NULL DEFAULT 1,
  json_schema jsonb NOT NULL DEFAULT '{}',
  parent_types text[] NOT NULL DEFAULT '{}',
  change_summary text NOT NULL DEFAULT '',
  actor text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(schema_type_id, version_number)
);

ALTER TABLE schema_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on schema_versions"
  ON schema_versions FOR SELECT
  TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anonymous insert on schema_versions"
  ON schema_versions FOR INSERT
  TO anon
  WITH CHECK (schema_type_id IS NOT NULL);

-- schema_change_proposals
CREATE TABLE IF NOT EXISTS schema_change_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_type_id uuid NOT NULL REFERENCES schema_types(id),
  change_type text NOT NULL DEFAULT 'modify_field',
  field_path text,
  title text NOT NULL DEFAULT '',
  rationale text NOT NULL DEFAULT '',
  proposed_value jsonb NOT NULL DEFAULT '{}',
  current_value jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  priority text NOT NULL DEFAULT 'nice-to-have',
  tags text[] NOT NULL DEFAULT '{}',
  actor text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE schema_change_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on schema_change_proposals"
  ON schema_change_proposals FOR SELECT
  TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anonymous insert on schema_change_proposals"
  ON schema_change_proposals FOR INSERT
  TO anon
  WITH CHECK (title <> '');

CREATE POLICY "Allow anonymous update on schema_change_proposals"
  ON schema_change_proposals FOR UPDATE
  TO anon
  USING (id IS NOT NULL)
  WITH CHECK (title <> '');

CREATE POLICY "Allow anonymous delete on schema_change_proposals"
  ON schema_change_proposals FOR DELETE
  TO anon
  USING (id IS NOT NULL);

-- proposal_comments
CREATE TABLE IF NOT EXISTS proposal_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES schema_change_proposals(id) ON DELETE CASCADE,
  author text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE proposal_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on proposal_comments"
  ON proposal_comments FOR SELECT
  TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anonymous insert on proposal_comments"
  ON proposal_comments FOR INSERT
  TO anon
  WITH CHECK (body <> '');

-- schema_audit_log
CREATE TABLE IF NOT EXISTS schema_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL DEFAULT '',
  entity_id uuid,
  action text NOT NULL DEFAULT '',
  old_value jsonb,
  new_value jsonb,
  change_summary text NOT NULL DEFAULT '',
  actor text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE schema_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on schema_audit_log"
  ON schema_audit_log FOR SELECT
  TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anonymous insert on schema_audit_log"
  ON schema_audit_log FOR INSERT
  TO anon
  WITH CHECK (entity_type <> '');

-- Add update policy for schema_types (needed for import flow)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'schema_types' AND policyname = 'Allow anonymous update on schema_types'
  ) THEN
    CREATE POLICY "Allow anonymous update on schema_types"
      ON schema_types FOR UPDATE
      TO anon
      USING (id IS NOT NULL)
      WITH CHECK (type_key IS NOT NULL);
  END IF;
END $$;

-- Trigger: auto-snapshot versions on schema_types update
CREATE OR REPLACE FUNCTION fn_schema_type_version_snapshot()
RETURNS trigger AS $$
DECLARE
  next_ver integer;
BEGIN
  IF OLD.json_schema IS DISTINCT FROM NEW.json_schema
     OR OLD.parent_types IS DISTINCT FROM NEW.parent_types THEN

    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_ver
    FROM schema_versions
    WHERE schema_type_id = OLD.id;

    INSERT INTO schema_versions (schema_type_id, version_number, json_schema, parent_types, change_summary, actor)
    VALUES (OLD.id, next_ver, OLD.json_schema, OLD.parent_types, 'Auto-snapshot before update', '');

    INSERT INTO schema_audit_log (entity_type, entity_id, action, old_value, new_value, change_summary, actor)
    VALUES (
      'schema_type',
      OLD.id,
      'updated',
      jsonb_build_object('json_schema', OLD.json_schema, 'parent_types', to_jsonb(OLD.parent_types)),
      jsonb_build_object('json_schema', NEW.json_schema, 'parent_types', to_jsonb(NEW.parent_types)),
      'Schema definition updated for ' || OLD.display_name,
      ''
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_schema_type_version_snapshot ON schema_types;
CREATE TRIGGER trg_schema_type_version_snapshot
  BEFORE UPDATE ON schema_types
  FOR EACH ROW
  EXECUTE FUNCTION fn_schema_type_version_snapshot();

-- Trigger: audit proposal changes
CREATE OR REPLACE FUNCTION fn_audit_proposals()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO schema_audit_log (entity_type, entity_id, action, new_value, change_summary, actor)
    VALUES (
      'proposal',
      NEW.id,
      'created',
      to_jsonb(NEW),
      'Proposal created: ' || NEW.title,
      NEW.actor
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO schema_audit_log (entity_type, entity_id, action, old_value, new_value, change_summary, actor)
    VALUES (
      'proposal',
      NEW.id,
      CASE WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status_changed' ELSE 'updated' END,
      to_jsonb(OLD),
      to_jsonb(NEW),
      CASE
        WHEN OLD.status IS DISTINCT FROM NEW.status
        THEN 'Proposal "' || NEW.title || '" status: ' || OLD.status || ' -> ' || NEW.status
        ELSE 'Proposal "' || NEW.title || '" updated'
      END,
      NEW.actor
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO schema_audit_log (entity_type, entity_id, action, old_value, change_summary, actor)
    VALUES (
      'proposal',
      OLD.id,
      'deleted',
      to_jsonb(OLD),
      'Proposal deleted: ' || OLD.title,
      OLD.actor
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_proposals ON schema_change_proposals;
CREATE TRIGGER trg_audit_proposals
  AFTER INSERT OR UPDATE OR DELETE ON schema_change_proposals
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_proposals();

-- Seed baseline v1 snapshots for all existing schema_types
INSERT INTO schema_versions (schema_type_id, version_number, json_schema, parent_types, change_summary, actor)
SELECT id, 1, json_schema, parent_types, 'Initial baseline snapshot', 'system'
FROM schema_types
ON CONFLICT (schema_type_id, version_number) DO NOTHING;
