/*
  # Add Scope Column to KPI Definitions and Seed Venue-Level Metrics

  1. Modified Tables
    - `kpi_definitions`
      - Added `scope` (text, default 'event') - Controls whether a KPI is computed per-event or aggregated across a venue
        Accepts values: 'event' or 'venue'

  2. New Metrics
    - Venue-level aggregate metrics for cross-event analysis:
      - Events Count, Avg Guest Count, Total Revenue, Avg Budget per Event
      - Total Room Nights, Avg Lead Time

  3. Important Notes
    - The scope column acts as a modifier on any KPI category (Financial, Operational, etc.)
    - 'event' scope: KPI is computed using data from a single event
    - 'venue' scope: KPI is aggregated across all events at a venue
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kpi_definitions' AND column_name = 'scope'
  ) THEN
    ALTER TABLE kpi_definitions ADD COLUMN scope text NOT NULL DEFAULT 'event';
  END IF;
END $$;

INSERT INTO metrics (schema_type_key, field_path, display_name, data_type, description) VALUES
  ('venue', 'aggregate.events_count', 'Events Count', 'integer', 'Total number of events at a venue'),
  ('venue', 'aggregate.avg_guest_count', 'Avg Guest Count', 'number', 'Average number of guests across events at a venue'),
  ('venue', 'aggregate.total_revenue', 'Total Revenue', 'number', 'Sum of budgets across all events at a venue'),
  ('venue', 'aggregate.avg_budget_per_event', 'Avg Budget per Event', 'number', 'Mean budget per event at a venue'),
  ('venue', 'aggregate.total_room_nights', 'Total Room Nights', 'integer', 'Total room nights across all events at a venue'),
  ('venue', 'aggregate.avg_lead_time', 'Avg Lead Time (days)', 'number', 'Average days of lead time across events at a venue')
ON CONFLICT (schema_type_key, field_path) DO NOTHING;
