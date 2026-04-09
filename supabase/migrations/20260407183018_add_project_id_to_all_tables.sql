/*
  # Add project_id to All Data Tables

  1. Modified Tables (adding project_id column)
    - `schema_types` - project_id (uuid, FK to projects)
    - `schema_versions` - project_id (uuid, FK to projects)
    - `schema_change_proposals` - project_id (uuid, FK to projects)
    - `proposal_comments` - project_id (uuid, FK to projects)
    - `schema_audit_log` - project_id (uuid, FK to projects)
    - `annotations` - project_id (uuid, FK to projects)
    - `sample_events` - project_id (uuid, FK to projects)
    - `sample_components` - project_id (uuid, FK to projects)
    - `metrics` - project_id (uuid, FK to projects)
    - `kpi_definitions` - project_id (uuid, FK to projects)
    - `dashboard_layouts` - project_id (uuid, FK to projects)

  2. Indexes
    - Add index on project_id for each table for query performance

  3. Notes
    - Columns are nullable initially to allow backfill of existing data
    - type_key unique constraint on schema_types is replaced with a composite unique on (project_id, type_key)
*/

-- schema_types
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schema_types' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE schema_types ADD COLUMN project_id uuid REFERENCES projects(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_schema_types_project_id ON schema_types(project_id);

-- Drop the old unique constraint on type_key alone, replace with composite
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'schema_types_type_key_key' AND conrelid = 'schema_types'::regclass
  ) THEN
    ALTER TABLE schema_types DROP CONSTRAINT schema_types_type_key_key;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'schema_types_project_type_key' AND conrelid = 'schema_types'::regclass
  ) THEN
    ALTER TABLE schema_types ADD CONSTRAINT schema_types_project_type_key UNIQUE (project_id, type_key);
  END IF;
END $$;

-- schema_versions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schema_versions' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE schema_versions ADD COLUMN project_id uuid REFERENCES projects(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_schema_versions_project_id ON schema_versions(project_id);

-- schema_change_proposals
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schema_change_proposals' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE schema_change_proposals ADD COLUMN project_id uuid REFERENCES projects(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_schema_change_proposals_project_id ON schema_change_proposals(project_id);

-- proposal_comments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposal_comments' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE proposal_comments ADD COLUMN project_id uuid REFERENCES projects(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_proposal_comments_project_id ON proposal_comments(project_id);

-- schema_audit_log
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schema_audit_log' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE schema_audit_log ADD COLUMN project_id uuid REFERENCES projects(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_schema_audit_log_project_id ON schema_audit_log(project_id);

-- annotations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'annotations' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE annotations ADD COLUMN project_id uuid REFERENCES projects(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_annotations_project_id ON annotations(project_id);

-- sample_events
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sample_events' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE sample_events ADD COLUMN project_id uuid REFERENCES projects(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sample_events_project_id ON sample_events(project_id);

-- sample_components
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sample_components' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE sample_components ADD COLUMN project_id uuid REFERENCES projects(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sample_components_project_id ON sample_components(project_id);

-- metrics
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metrics' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE metrics ADD COLUMN project_id uuid REFERENCES projects(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_metrics_project_id ON metrics(project_id);

-- kpi_definitions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kpi_definitions' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE kpi_definitions ADD COLUMN project_id uuid REFERENCES projects(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_kpi_definitions_project_id ON kpi_definitions(project_id);

-- dashboard_layouts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dashboard_layouts' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE dashboard_layouts ADD COLUMN project_id uuid REFERENCES projects(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_project_id ON dashboard_layouts(project_id);
