/*
  # Add audit logging for schema type creation and deletion

  1. New Functions
    - `fn_audit_schema_types()` - logs INSERT and DELETE on schema_types to schema_audit_log
  2. New Triggers
    - `trg_audit_schema_types` on schema_types for INSERT and DELETE
  3. Notes
    - Ensures all schema type additions and removals appear in the audit log
    - Complements the existing proposal audit trigger
*/

CREATE OR REPLACE FUNCTION fn_audit_schema_types() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO schema_audit_log (entity_type, entity_id, action, old_value, new_value, change_summary, actor)
    VALUES (
      'schema_type',
      NEW.id::text,
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
      OLD.id::text,
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

CREATE TRIGGER trg_audit_schema_types
  AFTER INSERT OR DELETE ON schema_types
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_schema_types();
