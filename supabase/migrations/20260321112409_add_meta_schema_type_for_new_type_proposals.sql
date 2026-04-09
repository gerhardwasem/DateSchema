/*
  # Add _meta schema type as container for "create new type" proposals

  ## Summary
  Inserts a special sentinel schema type with type_key `_meta` that acts as
  the foreign key anchor for `create_type` change proposals. These proposals
  do not belong to any real component type (because they are proposing one),
  so they reference this placeholder instead.

  ## Changes
  - **New Row in schema_types**: `_meta` (display_name: "New Type Proposals")
    - type_key: _meta
    - description: Container record for "create new type" proposals
    - json_schema: empty properties object
    - parent_types: [] (no parents — not a real component)
    - sort_order: 999 (intentionally high so it never appears in normal listings)

  ## Notes
  1. The UI filters out `_meta` from the Schema Explorer grid.
  2. No metrics are added for this type.
  3. RLS policies already cover this row through the existing schema_types policies.
*/

INSERT INTO schema_types (type_key, display_name, description, json_schema, parent_types, sort_order)
VALUES (
  '_meta',
  'New Type Proposals',
  'Internal placeholder — anchor for create_type change proposals',
  '{"properties": {}, "required": []}',
  '{}',
  999
)
ON CONFLICT (type_key) DO NOTHING;
