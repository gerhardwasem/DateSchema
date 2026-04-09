/*
  # Seed Projects and HIVR KPI Schema Types

  1. New Data
    - Insert "Event Management Schema" project (default) with slug "event-management"
    - Insert "HIVR KPI Data Catalog" project with slug "hivr-kpi"
    - Backfill existing schema_types rows with the event-management project_id
    - Create 12 domain-level schema types for HIVR project (Sales Pipeline, Bookings & Proposals, etc.)
    - Create ~50+ data source schema types as children of their respective domains

  2. Notes
    - Each HIVR domain becomes a top-level schema type
    - Each DataSource within a domain becomes a child schema type
    - KPI groups and their KPIs are stored in the json_schema of the domain types
    - Data sources get fields inferred from KPI computations and dimensions
*/

-- Insert projects
INSERT INTO projects (id, name, slug, description, color, icon)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Event Management Schema',
  'event-management',
  'Event API data model with venues, bookings, budgets, and conference management components.',
  '#0891b2',
  'Hexagon'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO projects (id, name, slug, description, color, icon)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'HIVR KPI Data Catalog',
  'hivr-kpi',
  'Complete KPI & Data Insight Catalog for HIVR Platform covering sales pipeline, bookings, revenue, PACE intelligence, and more.',
  '#059669',
  'BarChart3'
) ON CONFLICT (slug) DO NOTHING;

-- Backfill existing rows with event-management project_id
UPDATE schema_types SET project_id = 'a0000000-0000-0000-0000-000000000001' WHERE project_id IS NULL;
UPDATE schema_versions SET project_id = 'a0000000-0000-0000-0000-000000000001' WHERE project_id IS NULL;
UPDATE schema_change_proposals SET project_id = 'a0000000-0000-0000-0000-000000000001' WHERE project_id IS NULL;
UPDATE proposal_comments SET project_id = 'a0000000-0000-0000-0000-000000000001' WHERE project_id IS NULL;
UPDATE schema_audit_log SET project_id = 'a0000000-0000-0000-0000-000000000001' WHERE project_id IS NULL;
UPDATE annotations SET project_id = 'a0000000-0000-0000-0000-000000000001' WHERE project_id IS NULL;
UPDATE sample_events SET project_id = 'a0000000-0000-0000-0000-000000000001' WHERE project_id IS NULL;
UPDATE sample_components SET project_id = 'a0000000-0000-0000-0000-000000000001' WHERE project_id IS NULL;
UPDATE metrics SET project_id = 'a0000000-0000-0000-0000-000000000001' WHERE project_id IS NULL;
UPDATE kpi_definitions SET project_id = 'a0000000-0000-0000-0000-000000000001' WHERE project_id IS NULL;
UPDATE dashboard_layouts SET project_id = 'a0000000-0000-0000-0000-000000000001' WHERE project_id IS NULL;

-- ============================================================
-- HIVR KPI Domain Schema Types (Top-Level)
-- ============================================================

-- 1. Sales Pipeline
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'sales-pipeline', 'Sales Pipeline', 'Lead-to-deal conversion and pipeline health',
  '{"type":"object","properties":{"domainId":{"type":"string","const":"sales_pipeline"},"dataSources":{"type":"array","items":{"type":"string"}},"kpiGroupCount":{"type":"integer"}}}'::jsonb,
  '{}'::text[], 1)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- 2. Bookings & Proposals
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'bookings-proposals', 'Bookings & Proposals', 'Proposal lifecycle, booking stages, and function space utilization',
  '{"type":"object","properties":{"domainId":{"type":"string","const":"bookings_proposals"},"dataSources":{"type":"array","items":{"type":"string"}},"kpiGroupCount":{"type":"integer"}}}'::jsonb,
  '{}'::text[], 2)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- 3. Revenue & Deal Economics
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'revenue-economics', 'Revenue & Deal Economics', 'P&L evaluation, NIV, displacement, risk adjustments',
  '{"type":"object","properties":{"domainId":{"type":"string","const":"revenue_economics"},"dataSources":{"type":"array","items":{"type":"string"}},"kpiGroupCount":{"type":"integer"}}}'::jsonb,
  '{}'::text[], 3)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- 4. PACE Intelligence
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'pace-intelligence', 'PACE Intelligence', 'Potential-Availability-Compression-Economics scoring and decisions',
  '{"type":"object","properties":{"domainId":{"type":"string","const":"pace_intelligence"},"dataSources":{"type":"array","items":{"type":"string"}},"kpiGroupCount":{"type":"integer"}}}'::jsonb,
  '{}'::text[], 4)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- 5. Behavioral Analytics
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'behavioral-analytics', 'Behavioral Analytics', 'Historical behavioral rates, priors, overrides, and account profiles',
  '{"type":"object","properties":{"domainId":{"type":"string","const":"behavioral_analytics"},"dataSources":{"type":"array","items":{"type":"string"}},"kpiGroupCount":{"type":"integer"}}}'::jsonb,
  '{}'::text[], 5)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- 6. CRM - Contacts & Companies
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'crm', 'CRM - Contacts & Companies', 'Client relationship metrics and engagement',
  '{"type":"object","properties":{"domainId":{"type":"string","const":"crm"},"dataSources":{"type":"array","items":{"type":"string"}},"kpiGroupCount":{"type":"integer"}}}'::jsonb,
  '{}'::text[], 6)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- 7. Email & Communications
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'email-communications', 'Email & Communications', 'Email volume, engagement, and responsiveness',
  '{"type":"object","properties":{"domainId":{"type":"string","const":"email_communications"},"dataSources":{"type":"array","items":{"type":"string"}},"kpiGroupCount":{"type":"integer"}}}'::jsonb,
  '{}'::text[], 7)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- 8. Operations & Process
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'operations-process', 'Operations & Process', 'Pipeline velocity, stage durations, deal aging, responsiveness scores',
  '{"type":"object","properties":{"domainId":{"type":"string","const":"operations_process"},"dataSources":{"type":"array","items":{"type":"string"}},"kpiGroupCount":{"type":"integer"}}}'::jsonb,
  '{}'::text[], 8)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- 9. People & Team Performance
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'people-team', 'People & Team Performance', 'Individual and team productivity metrics',
  '{"type":"object","properties":{"domainId":{"type":"string","const":"people_team"},"dataSources":{"type":"array","items":{"type":"string"}},"kpiGroupCount":{"type":"integer"}}}'::jsonb,
  '{}'::text[], 9)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- 10. Demand & Inventory
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'demand-inventory', 'Demand & Inventory', 'Demand calendar, compression, and inventory management',
  '{"type":"object","properties":{"domainId":{"type":"string","const":"demand_inventory"},"dataSources":{"type":"array","items":{"type":"string"}},"kpiGroupCount":{"type":"integer"}}}'::jsonb,
  '{}'::text[], 10)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- 11. Tasks & Automation
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'tasks-automation', 'Tasks & Automation', 'Task management, agent execution, and workflow performance',
  '{"type":"object","properties":{"domainId":{"type":"string","const":"tasks_automation"},"dataSources":{"type":"array","items":{"type":"string"}},"kpiGroupCount":{"type":"integer"}}}'::jsonb,
  '{}'::text[], 11)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- 12. Housing & Guest Management
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'housing-guests', 'Housing & Guest Management', 'Room lists, guest profiles, and housing operations',
  '{"type":"object","properties":{"domainId":{"type":"string","const":"housing_guests"},"dataSources":{"type":"array","items":{"type":"string"}},"kpiGroupCount":{"type":"integer"}}}'::jsonb,
  '{}'::text[], 12)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- 13. Venue & Property
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'venue-property', 'Venue & Property', 'Multi-venue property metrics and configuration',
  '{"type":"object","properties":{"domainId":{"type":"string","const":"venue_property"},"dataSources":{"type":"array","items":{"type":"string"}},"kpiGroupCount":{"type":"integer"}}}'::jsonb,
  '{}'::text[], 13)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- ============================================================
-- HIVR Data Source Schema Types (Children of Domains)
-- ============================================================

-- Sales Pipeline data sources
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'leads', 'Leads', 'Lead records with scoring, status, and conversion tracking',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"status":{"type":"string","enum":["New","Qualified","Converted","Archived"]},"score":{"type":"number"},"source":{"type":"string"},"priority":{"type":"string"},"ownerId":{"type":"string","format":"uuid"},"venueId":{"type":"string","format":"uuid"},"segmentId":{"type":"string","format":"uuid"},"convertedAt":{"type":"string","format":"date-time"},"convertedDealId":{"type":"string","format":"uuid"},"isArchived":{"type":"boolean"},"createdAt":{"type":"string","format":"date-time"}}}'::jsonb,
  '{"sales-pipeline"}'::text[], 100)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'deals', 'Deals', 'Deal pipeline with stages, value, probability, and ownership',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"stage":{"type":"string","enum":["InProgress","Won","Lost","Held"]},"value":{"type":"number"},"probability":{"type":"number"},"priority":{"type":"string"},"channel":{"type":"string"},"ownerId":{"type":"string","format":"uuid"},"venueId":{"type":"string","format":"uuid"},"segmentId":{"type":"string","format":"uuid"},"stageChangedAt":{"type":"string","format":"date-time"},"createdAt":{"type":"string","format":"date-time"}}}'::jsonb,
  '{"sales-pipeline"}'::text[], 101)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'bookings', 'Bookings', 'Booking records with stage lifecycle, versioning, and sharing',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"dealId":{"type":"string","format":"uuid"},"stage":{"type":"string","enum":["draft","pending_approval","prospect","tentative","contracted","confirmed","lost","cancelled"]},"versionNumber":{"type":"integer"},"venueId":{"type":"string","format":"uuid"},"shareToken":{"type":"string"},"shareFirstViewedAt":{"type":"string","format":"date-time"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}'::jsonb,
  '{"sales-pipeline","bookings-proposals"}'::text[], 102)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'deal-emails', 'Deal Emails', 'Email communications linked to deals',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"dealId":{"type":"string","format":"uuid"},"direction":{"type":"string","enum":["Inbound","Outbound"]},"threadId":{"type":"string"},"isRead":{"type":"boolean"},"sentAt":{"type":"string","format":"date-time"}}}'::jsonb,
  '{"sales-pipeline","email-communications"}'::text[], 103)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'contacts', 'Contacts', 'Contact records linked to companies and deals',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"companyId":{"type":"string","format":"uuid"},"email":{"type":"string","format":"email"},"isArchived":{"type":"boolean"},"createdAt":{"type":"string","format":"date-time"}}}'::jsonb,
  '{"sales-pipeline","crm"}'::text[], 104)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'companies', 'Companies', 'Company/organization records',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"name":{"type":"string"},"industry":{"type":"string"},"createdAt":{"type":"string","format":"date-time"}}}'::jsonb,
  '{"sales-pipeline","crm"}'::text[], 105)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'segments', 'Segments', 'Market segments for categorizing leads and deals',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"name":{"type":"string"},"description":{"type":"string"}}}'::jsonb,
  '{"sales-pipeline","venue-property"}'::text[], 106)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- Bookings domain data sources
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'function-space-blocks', 'Function Space Blocks', 'Booked function space time blocks with attendee counts',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"bookingId":{"type":"string","format":"uuid"},"functionSpaceId":{"type":"string","format":"uuid"},"status":{"type":"string","enum":["tentative","confirmed","cancelled"]},"pax":{"type":"integer"},"startTime":{"type":"string","format":"date-time"},"endTime":{"type":"string","format":"date-time"}}}'::jsonb,
  '{"bookings-proposals"}'::text[], 200)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'function-items', 'Function Items', 'Line items within function space blocks (catering, AV, etc.)',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"blockId":{"type":"string","format":"uuid"},"name":{"type":"string"},"quantity":{"type":"number"},"unitPrice":{"type":"number"}}}'::jsonb,
  '{"bookings-proposals"}'::text[], 201)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'room-blocks', 'Room Blocks', 'Contracted room blocks with attrition settings',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"bookingId":{"type":"string","format":"uuid"},"contractedRate":{"type":"number"},"attritionPercentage":{"type":"number"},"cutoffDate":{"type":"string","format":"date"},"status":{"type":"string"}}}'::jsonb,
  '{"bookings-proposals"}'::text[], 202)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'room-block-items', 'Room Block Items', 'Individual room allocations within a room block',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"roomBlockId":{"type":"string","format":"uuid"},"date":{"type":"string","format":"date"},"quantity":{"type":"integer"},"pickedUp":{"type":"integer"},"roomTypeId":{"type":"string","format":"uuid"}}}'::jsonb,
  '{"bookings-proposals"}'::text[], 203)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'room-block-item-types', 'Room Block Item Types', 'Room type details within block items with contracted rates',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"roomBlockItemId":{"type":"string","format":"uuid"},"roomTypeId":{"type":"string","format":"uuid"},"contractedRate":{"type":"number"},"pickedUp":{"type":"integer"}}}'::jsonb,
  '{"bookings-proposals"}'::text[], 204)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'reservations', 'Reservations', 'Guest room reservations with check-in/out dates and rates',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"roomBlockId":{"type":"string","format":"uuid"},"status":{"type":"string","enum":["Tentative","Confirmed","CheckedIn","CheckedOut","NoShow","Cancelled"]},"checkInDate":{"type":"string","format":"date"},"checkOutDate":{"type":"string","format":"date"},"roomCount":{"type":"integer"},"rate":{"type":"number"},"roomTypeId":{"type":"string","format":"uuid"}}}'::jsonb,
  '{"bookings-proposals","housing-guests"}'::text[], 205)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- Revenue & Economics data sources
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'deal-pnl-evaluations', 'Deal P&L Evaluations', 'Net incremental value calculations per deal',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"dealId":{"type":"string","format":"uuid"},"netIncrementalValue":{"type":"number"},"totalDirectRevenue":{"type":"number"},"totalDisplacement":{"type":"number"},"totalShoulderCost":{"type":"number"},"totalRisk":{"type":"number"},"surplus":{"type":"number"},"confidence":{"type":"string","enum":["High","Medium","Low"]},"directRevenue":{"type":"object","properties":{"roomRevenue":{"type":"number"},"fbRevenue":{"type":"number"},"spaceRental":{"type":"number"},"avRevenue":{"type":"number"},"ancillaryRevenue":{"type":"number"}}},"riskAdjustments":{"type":"object","properties":{"attritionCost":{"type":"number"},"cancellationCost":{"type":"number"},"concessionCost":{"type":"number"},"noshowCost":{"type":"number"},"attritionRecovery":{"type":"number"},"rebookingCredit":{"type":"number"}}}}}'::jsonb,
  '{"revenue-economics"}'::text[], 300)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'deal-pnl-configs', 'Deal P&L Configs', 'Configuration for P&L evaluation parameters',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"venueId":{"type":"string","format":"uuid"},"parameters":{"type":"object"}}}'::jsonb,
  '{"revenue-economics"}'::text[], 301)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'hurdle-rates', 'Hurdle Rates', 'Minimum acceptable rates by venue and date',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"venueId":{"type":"string","format":"uuid"},"date":{"type":"string","format":"date"},"rate":{"type":"number"}}}'::jsonb,
  '{"revenue-economics"}'::text[], 302)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'sell-limits', 'Sell Limits', 'Inventory sell limit adjustments',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"venueId":{"type":"string","format":"uuid"},"date":{"type":"string","format":"date"},"limit":{"type":"integer"}}}'::jsonb,
  '{"revenue-economics"}'::text[], 303)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'availability-restrictions', 'Availability Restrictions', 'Date-based booking restrictions',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"venueId":{"type":"string","format":"uuid"},"isActive":{"type":"boolean"},"startDate":{"type":"string","format":"date"},"endDate":{"type":"string","format":"date"}}}'::jsonb,
  '{"revenue-economics"}'::text[], 304)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- PACE Intelligence data sources
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'pace-evaluations', 'PACE Evaluations', 'PACE scoring evaluations with P/A/C/E component scores',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"dealId":{"type":"string","format":"uuid"},"totalScore":{"type":"number"},"pScore":{"type":"number"},"aScore":{"type":"number"},"cScore":{"type":"number"},"eScore":{"type":"number"},"decision":{"type":"string","enum":["Accept","Counter","Decline"]},"confidence":{"type":"string","enum":["High","Medium","Low"]},"fitGrade":{"type":"string","enum":["A","B","C","D"]},"intentGrade":{"type":"string","enum":["1","2","3","4"]},"missingFields":{"type":"array","items":{"type":"string"}}}}'::jsonb,
  '{"pace-intelligence"}'::text[], 400)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'pace-models', 'PACE Models', 'PACE scoring model configurations',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"name":{"type":"string"},"weights":{"type":"object"}}}'::jsonb,
  '{"pace-intelligence"}'::text[], 401)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'pace-overrides', 'PACE Overrides', 'Manual overrides of PACE decisions',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"evaluationId":{"type":"string","format":"uuid"},"originalDecision":{"type":"string"},"newDecision":{"type":"string"},"reason":{"type":"string"}}}'::jsonb,
  '{"pace-intelligence"}'::text[], 402)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'pace-signals', 'PACE Signals', 'Input signals for PACE evaluations',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"evaluationId":{"type":"string","format":"uuid"},"signalType":{"type":"string"},"value":{"type":"number"}}}'::jsonb,
  '{"pace-intelligence"}'::text[], 403)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'pace-blockers', 'PACE Blockers', 'Blocking conditions that prevent deal acceptance',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"evaluationId":{"type":"string","format":"uuid"},"blockerType":{"type":"string"},"description":{"type":"string"}}}'::jsonb,
  '{"pace-intelligence"}'::text[], 404)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'pace-scenarios', 'PACE Scenarios', 'What-if scenario analyses',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"evaluationId":{"type":"string","format":"uuid"},"scenarioName":{"type":"string"},"adjustments":{"type":"object"}}}'::jsonb,
  '{"pace-intelligence"}'::text[], 405)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- Behavioral Analytics data sources
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'behavioral-priors', 'Behavioral Priors', 'Historical behavioral rate baselines by segment and dimensions',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"venueId":{"type":"string","format":"uuid"},"segment":{"type":"string"},"sizeTier":{"type":"string"},"leadTimeBand":{"type":"string"},"demandPeriod":{"type":"string"},"dowPattern":{"type":"string"},"washRate":{"type":"number"},"cancellationRate":{"type":"number"},"attritionRate":{"type":"number"},"concessionRate":{"type":"number"},"noshowRate":{"type":"number"},"rebookingRate":{"type":"number"},"trendDirection":{"type":"string"},"trendMagnitude":{"type":"number"},"confidence":{"type":"string","enum":["High","Medium","Low"]}}}'::jsonb,
  '{"behavioral-analytics"}'::text[], 500)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'behavioral-defaults', 'Behavioral Defaults', 'Default behavioral rate fallbacks',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"metricType":{"type":"string"},"defaultValue":{"type":"number"}}}'::jsonb,
  '{"behavioral-analytics"}'::text[], 501)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'behavioral-overrides', 'Behavioral Overrides', 'Manual overrides of behavioral rates',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"scope":{"type":"string","enum":["Global","Segment","Account"]},"isActive":{"type":"boolean"},"metricType":{"type":"string"},"overrideValue":{"type":"number"}}}'::jsonb,
  '{"behavioral-analytics"}'::text[], 502)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'account-behavioral-profiles', 'Account Behavioral Profiles', 'Per-company behavioral rate profiles',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"companyId":{"type":"string","format":"uuid"},"rates":{"type":"object"}}}'::jsonb,
  '{"behavioral-analytics"}'::text[], 503)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'lead-lifecycle-facts', 'Lead Lifecycle Facts', 'Historical lead lifecycle metrics for behavioral analysis',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"leadId":{"type":"string","format":"uuid"},"leadTimeDays":{"type":"integer"},"totalRoomNights":{"type":"integer"},"peakRooms":{"type":"integer"},"attendees":{"type":"integer"},"outcome":{"type":"string","enum":["Converted","Lost","Cancelled"]},"isCancelled":{"type":"boolean"},"didRebook":{"type":"boolean"}}}'::jsonb,
  '{"behavioral-analytics"}'::text[], 504)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'evaluation-behavioral-snapshots', 'Evaluation Behavioral Snapshots', 'Point-in-time behavioral rate snapshots used in evaluations',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"evaluationId":{"type":"string","format":"uuid"},"rates":{"type":"object"},"snapshotAt":{"type":"string","format":"date-time"}}}'::jsonb,
  '{"behavioral-analytics"}'::text[], 505)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- Email domain data sources
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'deal-email-attachments', 'Deal Email Attachments', 'File attachments on deal emails',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"emailId":{"type":"string","format":"uuid"},"fileName":{"type":"string"},"fileSize":{"type":"integer"},"mimeType":{"type":"string"}}}'::jsonb,
  '{"email-communications"}'::text[], 600)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'email-labels', 'Email Labels', 'Label definitions for categorizing emails',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"name":{"type":"string"},"color":{"type":"string"}}}'::jsonb,
  '{"email-communications"}'::text[], 601)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'email-classifications', 'Email Classifications', 'AI/rule-based email classification results',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"emailId":{"type":"string","format":"uuid"},"classification":{"type":"string"},"confidence":{"type":"number"}}}'::jsonb,
  '{"email-communications"}'::text[], 602)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- Tasks & Automation data sources
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'step-instances', 'Step Instances', 'Task/step instances with status, priority, and assignment',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"status":{"type":"string","enum":["Open","InProgress","Waiting","Done","Canceled"]},"type":{"type":"string"},"priority":{"type":"string"},"queueId":{"type":"string","format":"uuid"},"assigneeId":{"type":"string","format":"uuid"},"dueDate":{"type":"string","format":"date-time"},"completedAt":{"type":"string","format":"date-time"},"source":{"type":"string","enum":["Manual","Automation","Agent"]},"createdAt":{"type":"string","format":"date-time"}}}'::jsonb,
  '{"tasks-automation"}'::text[], 700)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'agents', 'Agents', 'AI agent definitions',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"name":{"type":"string"},"description":{"type":"string"},"isActive":{"type":"boolean"}}}'::jsonb,
  '{"tasks-automation"}'::text[], 701)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'agent-execution-metrics', 'Agent Execution Metrics', 'Agent execution performance tracking',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"agentId":{"type":"string","format":"uuid"},"status":{"type":"string","enum":["Success","Failed"]},"durationMs":{"type":"integer"},"timeReturnedMs":{"type":"integer"},"executedAt":{"type":"string","format":"date-time"}}}'::jsonb,
  '{"tasks-automation"}'::text[], 702)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'agent-skills', 'Agent Skills', 'Skills/capabilities registered for agents',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"agentId":{"type":"string","format":"uuid"},"skillName":{"type":"string"},"parameters":{"type":"object"}}}'::jsonb,
  '{"tasks-automation"}'::text[], 703)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- Housing & Guest data sources
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'room-lists', 'Room Lists', 'Room assignment lists for group bookings',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"bookingId":{"type":"string","format":"uuid"},"status":{"type":"string","enum":["Active","Completed","Cancelled"]},"totalEntries":{"type":"integer"}}}'::jsonb,
  '{"housing-guests"}'::text[], 800)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'room-list-entries', 'Room List Entries', 'Individual room assignments within a room list',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"roomListId":{"type":"string","format":"uuid"},"guestProfileId":{"type":"string","format":"uuid"},"roomTypeId":{"type":"string","format":"uuid"}}}'::jsonb,
  '{"housing-guests"}'::text[], 801)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'guest-profiles', 'Guest Profiles', 'Guest profile records with stay history',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"name":{"type":"string"},"email":{"type":"string","format":"email"},"stayCount":{"type":"integer"}}}'::jsonb,
  '{"housing-guests"}'::text[], 802)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- Demand & Inventory data sources
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'demand-calendar', 'Demand Calendar', 'Daily demand level entries per venue',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"venueId":{"type":"string","format":"uuid"},"date":{"type":"string","format":"date"},"demandLevelId":{"type":"string","format":"uuid"}}}'::jsonb,
  '{"demand-inventory"}'::text[], 900)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'demand-levels', 'Demand Levels', 'Demand level definitions (peak, shoulder, off-peak)',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"name":{"type":"string"},"level":{"type":"integer"},"color":{"type":"string"}}}'::jsonb,
  '{"demand-inventory"}'::text[], 901)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'function-spaces', 'Function Spaces', 'Function/event space definitions',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"venueId":{"type":"string","format":"uuid"},"name":{"type":"string"},"capacity":{"type":"integer"}}}'::jsonb,
  '{"demand-inventory","venue-property"}'::text[], 902)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'meeting-rooms', 'Meeting Rooms', 'Meeting room definitions',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"venueId":{"type":"string","format":"uuid"},"name":{"type":"string"},"capacity":{"type":"integer"}}}'::jsonb,
  '{"demand-inventory","venue-property"}'::text[], 903)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'room-types', 'Room Types', 'Hotel room type definitions',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"venueId":{"type":"string","format":"uuid"},"name":{"type":"string"},"baseRate":{"type":"number"},"inventory":{"type":"integer"}}}'::jsonb,
  '{"demand-inventory","venue-property"}'::text[], 904)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'pricing-schedules', 'Pricing Schedules', 'Date-based pricing schedules',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"venueId":{"type":"string","format":"uuid"},"date":{"type":"string","format":"date"},"barRate":{"type":"number"}}}'::jsonb,
  '{"demand-inventory"}'::text[], 905)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'rate-plans', 'Rate Plans', 'Rate plan definitions',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"name":{"type":"string"},"isActive":{"type":"boolean"}}}'::jsonb,
  '{"demand-inventory"}'::text[], 906)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'rate-overrides', 'Rate Overrides', 'Manual rate override entries',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"ratePlanId":{"type":"string","format":"uuid"},"date":{"type":"string","format":"date"},"overrideRate":{"type":"number"}}}'::jsonb,
  '{"demand-inventory"}'::text[], 907)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- Venue & Property data sources
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'venues', 'Venues', 'Venue/property definitions',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"name":{"type":"string"},"isActive":{"type":"boolean"},"totalRooms":{"type":"integer"},"avgRating":{"type":"number"}}}'::jsonb,
  '{"venue-property"}'::text[], 1000)
ON CONFLICT (project_id, type_key) DO NOTHING;

-- People & Team data sources
INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'profiles', 'Profiles', 'User/team member profiles',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"name":{"type":"string"},"email":{"type":"string","format":"email"},"role":{"type":"string"}}}'::jsonb,
  '{"people-team"}'::text[], 1100)
ON CONFLICT (project_id, type_key) DO NOTHING;

INSERT INTO schema_types (project_id, type_key, display_name, description, json_schema, parent_types, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'tenant-members', 'Tenant Members', 'Tenant membership records linking profiles to tenants',
  '{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"profileId":{"type":"string","format":"uuid"},"tenantId":{"type":"string","format":"uuid"},"role":{"type":"string"}}}'::jsonb,
  '{"people-team"}'::text[], 1101)
ON CONFLICT (project_id, type_key) DO NOTHING;
