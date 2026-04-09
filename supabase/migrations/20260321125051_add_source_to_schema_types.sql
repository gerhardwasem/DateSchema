/*
  # Add source tracking to schema_types

  1. Modified Tables
    - `schema_types`
      - `source` (text, default 'initial') - Tracks whether the type was created directly or via a proposal
      - `source_proposal_id` (uuid, nullable, FK to schema_change_proposals) - Links to the originating proposal if created via proposal flow

  2. Important Notes
    - Existing rows default to 'initial' source
    - Constraint ensures source is one of: 'initial', 'proposal'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schema_types' AND column_name = 'source'
  ) THEN
    ALTER TABLE schema_types ADD COLUMN source text NOT NULL DEFAULT 'initial';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schema_types' AND column_name = 'source_proposal_id'
  ) THEN
    ALTER TABLE schema_types ADD COLUMN source_proposal_id uuid REFERENCES schema_change_proposals(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'schema_types' AND constraint_name = 'schema_types_source_check'
  ) THEN
    ALTER TABLE schema_types ADD CONSTRAINT schema_types_source_check CHECK (source IN ('initial', 'proposal'));
  END IF;
END $$;