/*
  # Add hidden column to schema_change_proposals

  1. Modified Tables
    - `schema_change_proposals`
      - Added `hidden` (boolean, default false) - allows users to hide proposals from default views without deleting them

  2. Notes
    - Existing proposals will default to hidden = false (visible)
    - This is a soft-hide mechanism; hidden proposals remain in the database and can be shown via toggle
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schema_change_proposals' AND column_name = 'hidden'
  ) THEN
    ALTER TABLE schema_change_proposals ADD COLUMN hidden boolean DEFAULT false NOT NULL;
  END IF;
END $$;
