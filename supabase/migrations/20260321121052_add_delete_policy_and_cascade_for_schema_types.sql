/*
  # Enable schema type deletion

  1. Security Changes
    - Add DELETE RLS policy on `schema_types` for anonymous users
  2. Modified Tables
    - `annotations`: Change FK to schema_types to CASCADE on delete
    - `schema_versions`: Change FK to schema_types to CASCADE on delete
    - `schema_change_proposals`: Change FK to schema_types to CASCADE on delete
  3. Notes
    - Dropping and re-creating FKs to enable cascade delete so related
      rows are automatically removed when a schema type is deleted
*/

CREATE POLICY "Allow anonymous delete on schema_types"
  ON schema_types
  FOR DELETE
  TO anon
  USING (id IS NOT NULL);

ALTER TABLE annotations
  DROP CONSTRAINT IF EXISTS annotations_schema_type_id_fkey,
  ADD CONSTRAINT annotations_schema_type_id_fkey
    FOREIGN KEY (schema_type_id) REFERENCES schema_types(id) ON DELETE CASCADE;

ALTER TABLE schema_versions
  DROP CONSTRAINT IF EXISTS schema_versions_schema_type_id_fkey,
  ADD CONSTRAINT schema_versions_schema_type_id_fkey
    FOREIGN KEY (schema_type_id) REFERENCES schema_types(id) ON DELETE CASCADE;

ALTER TABLE schema_change_proposals
  DROP CONSTRAINT IF EXISTS schema_change_proposals_schema_type_id_fkey,
  ADD CONSTRAINT schema_change_proposals_schema_type_id_fkey
    FOREIGN KEY (schema_type_id) REFERENCES schema_types(id) ON DELETE CASCADE;
