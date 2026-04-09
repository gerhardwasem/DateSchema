/*
  # Update source constraint to allow catalog imports

  1. Modified Tables
    - `schema_types`
      - Updates `schema_types_source_check` constraint to allow 'initial', 'proposal', and 'catalog' values

  2. Important Notes
    - This enables schema types to be auto-generated from JSON catalog files during project creation
*/

ALTER TABLE schema_types DROP CONSTRAINT IF EXISTS schema_types_source_check;
ALTER TABLE schema_types ADD CONSTRAINT schema_types_source_check CHECK (source IN ('initial', 'proposal', 'catalog'));
