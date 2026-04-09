/*
  # Fix schema type audit trigger - remove text cast

  1. Changes
    - Remove unnecessary `::text` cast on `entity_id` in `fn_audit_schema_types`
    - The `entity_id` column is uuid; passing `NEW.id` directly (also uuid) avoids
      an implicit text-to-uuid round-trip that was causing inserts to fail

  2. Important Notes
    - This is a non-destructive change; only the trigger function body is replaced
    - Matches the pattern used by the working `fn_audit_proposals` trigger
*/

CREATE OR REPLACE FUNCTION fn_audit_schema_types() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO schema_audit_log (entity_type, entity_id, action, old_value, new_value, change_summary, actor)
    VALUES (
      'schema_type',
      NEW.id,
      'created',
      NULL,
      jsonb_build_object('type_key', NEW.type_key, 'display_name', NEW.display_name, 'description', NEW.description),
      'Schema type created: ' || NEW.display_name,
      'system'
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO schema_audit_log (entity_type, entity_id, action, old_value, new_value, change_summary, actor)
    VALUES (
      'schema_type',
      OLD.id,
      'deleted',
      jsonb_build_object('type_key', OLD.type_key, 'display_name', OLD.display_name, 'description', OLD.description),
      NULL,
      'Schema type deleted: ' || OLD.display_name,
      'system'
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
