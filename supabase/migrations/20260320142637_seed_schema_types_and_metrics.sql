/*
  # Seed Schema Types and Metrics

  1. Data Seeded
    - All 21 component type definitions from the Confluence API schema
    - Raw metrics extracted from numeric/countable fields across all schemas
  
  2. Purpose
    - Provides the foundation data for the Schema Explorer
    - Provides the metric catalog for the KPI Builder
*/

INSERT INTO schema_types (type_key, display_name, description, json_schema, parent_types, sort_order)
VALUES
  ('event', 'Event', 'Top-level event/RFP', '{"properties":{"eventType":{"type":"string"},"eventName":{"type":"string"},"guests":{"type":"integer","minimum":0},"agenda":{"type":"string"},"need_spaces":{"type":"boolean"},"spaces_count":{"type":"integer","minimum":0},"need_catering":{"type":"boolean"},"catering_needs_count":{"type":"integer","minimum":0},"need_housing":{"type":"boolean"},"housing_need_count":{"type":"integer","minimum":0,"nullable":true},"single_rooms_count":{"type":"integer","minimum":0,"nullable":true},"need_activity":{"type":"boolean"},"dates_flexible":{"type":"boolean"},"dates_flexible_details":{"type":"string"},"eventFormat":{"type":"string","enum":["conference","meeting","training","gala","wedding","incentive","hybrid","virtual","other"]},"status":{"type":"string","enum":["inquiry","tentative","option","contracted","canceled"]},"status_external":{"type":"string"},"status_internal":{"type":"string"},"hold_expires_at":{"type":"string","format":"date-time"},"timezone":{"type":"string"},"setup_minutes":{"type":"integer","minimum":0},"teardown_minutes":{"type":"integer","minimum":0},"confidentiality":{"type":"string","enum":["standard","restricted","embargoed"]},"languages":{"type":"array","items":{"type":"string"}},"accessibility_requirements":{"type":"object","properties":{"wheelchair_users":{"type":"integer","minimum":0},"asl_interpreters":{"type":"boolean"},"hearing_loop":{"type":"boolean"},"service_animals":{"type":"boolean"},"accessible_rooms_needed":{"type":"integer","minimum":0}}},"channel":{"type":"string"},"source_name":{"type":"string"},"series_id":{"type":"string"},"status_history":{"type":"array","items":{"type":"object","properties":{"at":{"type":"string","format":"date-time"},"hivr_status":{"type":"string"},"external_status":{"type":"string"},"comment":{"type":"string"}},"required":["at"]}}},"required":["eventName"]}', '{}', 1),

  ('location', 'Location', 'Geocoded address for venues, hotels, or offsite spaces', '{"properties":{"name":{"type":"string"},"address":{"type":"string"},"lat":{"type":"number"},"lng":{"type":"number"},"locality":{"type":"string"},"administrative_area_level_1":{"type":"string"},"administrative_area_level_2":{"type":"string"},"zipcode":{"type":"string"},"country":{"type":"string"},"country_code":{"type":"string"}}}', '{venue}', 2),

  ('budget', 'Budget', 'Budget intent and caps', '{"properties":{"budget_defined":{"type":"boolean"},"budget_flexible":{"type":"boolean"},"budget_info":{"type":"string"},"global_budget":{"type":"number"},"global_budget_max":{"type":"number","nullable":true},"budget_per_person":{"type":"number"},"budget_per_person_max":{"type":"number","nullable":true},"budget_type":{"type":"string"},"price_format":{"type":"string"},"currency":{"type":"string"},"tax_inclusive":{"type":"boolean"},"tax_breakdown":{"type":"object","properties":{"vat_percent":{"type":"number"},"service_charge_percent":{"type":"number"},"city_tax_percent":{"type":"number"}}},"category_caps":{"type":"object","properties":{"space_max":{"type":"number"},"av_max":{"type":"number"},"fnb_max":{"type":"number"},"rooms_max":{"type":"number"}}},"deposit_schedule":{"type":"array","items":{"type":"object","properties":{"due_date":{"type":"string","format":"date"},"percent":{"type":"number"}},"required":["due_date","percent"]}}}}', '{event}', 3),

  ('company-info', 'Company Info', 'Organizer/company contact info', '{"properties":{"organizer":{"type":"object","properties":{"first_name":{"type":"string"},"last_name":{"type":"string"},"email":{"type":"string"},"phone":{"type":"string"},"company_name":{"type":"string"},"job_title":{"type":"string"}},"required":["first_name","last_name","email"]},"customer_contact":{"type":"object","properties":{"name":{"type":"string"},"email":{"type":"string"},"phone":{"type":"string"}}},"internal_owner":{"type":"object","properties":{"name":{"type":"string"},"email":{"type":"string"},"employee_code":{"type":"string"}}},"billing_contact":{"type":"object","properties":{"name":{"type":"string"},"email":{"type":"string"},"phone":{"type":"string"},"vat_id":{"type":"string"}}}}}', '{event}', 4),

  ('venue', 'Venue', 'Venue identity linked to locations and rooms', '{"properties":{"venue_id":{"type":"integer"},"venue_name":{"type":"string"}},"required":["venue_id","venue_name"]}', '{event}', 5),

  ('meeting-room', 'Meeting Room', 'Room specs and requested setup/time window', '{"properties":{"capacity":{"type":"integer"},"dispositions":{"type":"array","items":{"type":"string"}},"natural_light":{"type":"boolean","nullable":true},"seating":{"type":"string"},"time_from":{"type":"string"},"time_to":{"type":"string"},"ceiling_height_m":{"type":"number"},"floor_area_sqm":{"type":"number"},"divisible":{"type":"boolean"},"pillars":{"type":"boolean"},"sound_curfew_time":{"type":"string"},"power":{"type":"object","properties":{"single_phase_amps":{"type":"integer"},"three_phase_available":{"type":"boolean"}}},"network":{"type":"object","properties":{"dedicated_bandwidth_mbps":{"type":"number"},"hardline_ports":{"type":"integer"}}},"loading":{"type":"object","properties":{"freight_elevator_dims_m":{"type":"string"},"loading_bay_clearance_m":{"type":"number"}}}}}', '{event,venue}', 6),

  ('food-and-beverage', 'Food & Beverage', 'F&B summary plus optional line-items/packages references', '{"properties":{"abstract":{"type":"string"},"description":{"type":"string","nullable":true},"service_style":{"type":"string","enum":["plated","buffet","family","stations","reception"],"nullable":true},"dayparts":{"type":"array","items":{"type":"string","enum":["breakfast","coffee_break","lunch","pm_break","dinner","reception"]}},"dietary_counts":{"type":"object","properties":{"vegan":{"type":"integer","minimum":0},"vegetarian":{"type":"integer","minimum":0},"gluten_free":{"type":"integer","minimum":0},"halal":{"type":"integer","minimum":0},"kosher":{"type":"integer","minimum":0},"nut_free":{"type":"integer","minimum":0}}},"items":{"type":"array","items":{"type":"string"}}}}', '{event}', 7),

  ('equipment', 'Equipment', 'Equipment summary or inventory pointer', '{"properties":{"name":{"type":"string"},"model":{"type":"string"},"quantity":{"type":"integer","minimum":1},"power_watts":{"type":"number"},"connectors":{"type":"array","items":{"type":"string"}},"operator_required":{"type":"boolean"},"rental_type":{"type":"string","enum":["in-house","third-party"]},"catalog_id":{"type":"string"}}}', '{event}', 8),

  ('datetime', 'Date/Time', 'One time window; create multiples for multi-day events or slots', '{"properties":{"from_date":{"type":"string"},"from_hour":{"type":"string"},"to_date":{"type":"string"},"to_hour":{"type":"string"},"timezone":{"type":"string"}},"required":["from_date","to_date"]}', '{event}', 9),

  ('misc', 'Miscellaneous', 'Catch-all for unstructured or raw payloads', '{"properties":{},"description":"Arbitrary JSON."}', '{event}', 10),

  ('source', 'Source', 'Origin/provenance and raw inbound content', '{"properties":{"channel":{"type":"string"},"external_rfp_id":{"type":"string"},"tracking_id":{"type":"string"},"owner":{"type":"string"},"is_mailbot":{"type":"boolean"},"is_outlook_addin":{"type":"boolean"},"is_quote_generator":{"type":"boolean"},"lead_source_name":{"type":"string"},"supplier_id":{"type":"string"},"hotel_unique_id":{"type":"string"},"portal_name":{"type":"string"},"external_urls":{"type":"array","items":{"type":"object","properties":{"desc":{"type":"string"},"url":{"type":"string"}},"required":["url"]}},"email_html":{"type":"string"}},"required":["channel"]}', '{event}', 11),

  ('conference-day', 'Conference Day', 'One operational day of the event', '{"properties":{"date":{"type":"string","format":"date"},"persons":{"type":"integer","minimum":0},"timezone":{"type":"string"},"packages":{"type":"array","items":{"type":"string"}},"rooms":{"type":"array","items":{"type":"string"}},"equipment":{"type":"array","items":{"type":"string"}},"remarks":{"type":"string"}},"required":["date","persons"]}', '{event}', 12),

  ('package', 'Package', 'Priced/included bundle such as a Day Delegate Rate', '{"properties":{"name":{"type":"string"},"description":{"type":"string","nullable":true},"count":{"type":"integer","minimum":1},"calc_per":{"type":"string","enum":["person","room","day","event"]},"items":{"type":"array","items":{"type":"string"}}},"required":["name","count","calc_per"]}', '{conference-day,event}', 13),

  ('line-item', 'Line Item', 'Atomic schedulable item (AV, Wi-Fi, coffee break, lunch...)', '{"properties":{"catalog_id":{"type":"string"},"title":{"type":"string"},"title_multilang":{"type":"array","items":{"type":"object","properties":{"lang":{"type":"string"},"value":{"type":"string"}},"required":["lang","value"]}},"count":{"type":"integer","minimum":1},"time_from":{"type":"string"},"time_to":{"type":"string"},"price_unit":{"type":"string","nullable":true},"included_in_package":{"type":"boolean"},"notes":{"type":"string","nullable":true}},"required":["title","count","included_in_package"]}', '{package,event}', 14),

  ('room-block', 'Room Block', 'Accommodation requirements and commercial terms', '{"properties":{"arrival_date":{"type":"string","format":"date"},"departure_date":{"type":"string","format":"date"},"cutoff_date":{"type":"string","format":"date","nullable":true},"currency":{"type":"string"},"rooms":{"type":"array","items":{"type":"object","properties":{"room_type":{"type":"string","enum":["single","double","twin","suite","accessible","other"]},"count":{"type":"integer","minimum":0},"rate":{"type":"number"},"breakfast_included":{"type":"boolean"}},"required":["room_type","count"]}},"attrition_percent":{"type":"number","nullable":true},"remarks":{"type":"string","nullable":true}},"required":["arrival_date","departure_date","currency","rooms"]}', '{event}', 15),

  ('deadline', 'Deadlines & Options', 'Offer validity, option-hold expiry, and timeout with history', '{"properties":{"offer_deadline":{"type":"string","format":"date-time"},"option_due_date":{"type":"string","format":"date-time"},"timeout_date":{"type":"string","format":"date-time","nullable":true},"policy_check_results":{"type":"array","items":{"type":"object","properties":{"rule":{"type":"string"},"passed":{"type":"boolean"},"details":{"type":"string"}},"required":["rule","passed"]}},"history":{"type":"array","items":{"type":"object","properties":{"at":{"type":"string","format":"date-time"},"by":{"type":"string"},"change":{"type":"string"}},"required":["at","change"]}}}}', '{event}', 16),

  ('policy-terms', 'Policy Terms', 'Structured cancellation and deposit milestones', '{"properties":{"cancellation_terms":{"type":"array","items":{"type":"object","properties":{"deadline":{"type":"string","format":"date-time"},"penalty_type":{"type":"string","enum":["percent","fixed","nights"]},"penalty_value":{"type":"number"},"notes":{"type":"string","nullable":true}},"required":["deadline","penalty_type","penalty_value"]}},"deposit_terms":{"type":"array","items":{"type":"object","properties":{"due_date":{"type":"string","format":"date"},"percent":{"type":"number"},"notes":{"type":"string","nullable":true}},"required":["due_date","percent"]}}}}', '{event}', 17),

  ('stats', 'Stats', 'Write-once computed metrics for BI/reporting', '{"properties":{"lead_time_days":{"type":"integer"},"persons_total":{"type":"integer"},"rooms_nights_total":{"type":"integer"},"peak_day_persons":{"type":"integer","nullable":true},"generated_at":{"type":"string","format":"date-time"},"version":{"type":"string"},"details":{"type":"object"}},"required":["generated_at"]}', '{event}', 18),

  ('content', 'Content', 'UI-facing timeline, labels and file attachments', '{"properties":{"currency":{"type":"string"},"process_overview":{"type":"array","items":{"type":"object","properties":{"label":{"type":"string"},"at":{"type":"string","format":"date-time"},"status":{"type":"string","nullable":true},"price_hint":{"type":"string","nullable":true}},"required":["label","at"]}},"form_info_lines":{"type":"array","items":{"type":"object","properties":{"key":{"type":"string"},"value":{"type":"string"},"lang":{"type":"string","nullable":true}},"required":["key","value"]}},"attachments":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"url":{"type":"string"},"mime":{"type":"string"}},"required":["name","url"]}},"remarks":{"type":"array","items":{"type":"object","properties":{"remark_type":{"type":"string","enum":["MAIN","BILL_BF","LEGAL","TANDC","OTHER"]},"text":{"type":"string"},"source_system":{"type":"string"},"created_at":{"type":"string","format":"date-time"}},"required":["remark_type","text"]}}}}', '{event}', 19),

  ('availability-check', 'Availability Check', 'Capacity/space availability calculations for audit and reuse', '{"properties":{"date":{"type":"string","format":"date"},"timezone":{"type":"string"},"is_calculated":{"type":"boolean"},"event_date_available":{"type":"boolean"},"alternate_date_available":{"type":"boolean"},"capacity_confirmed":{"type":"boolean"},"availability_confirmed":{"type":"boolean"},"criteria":{"type":"object","properties":{"pax":{"type":"integer"},"seating":{"type":"string"},"time_from":{"type":"string"},"time_to":{"type":"string"}}},"matching_rooms":{"type":"array","items":{"type":"object","properties":{"room_id":{"type":"string"},"is_available":{"type":"boolean"}},"required":["room_id","is_available"]}},"available_rooms_without_combinations":{"type":"array","items":{"type":"string"}}},"required":["date","is_calculated","availability_confirmed"]}', '{event}', 20),

  ('integration-log', 'Integration Log', 'Outbound/inbound system transactions and errors', '{"properties":{"system":{"type":"string"},"operation":{"type":"string"},"request_at":{"type":"string","format":"date-time"},"response_at":{"type":"string","format":"date-time"},"http_status":{"type":"integer"},"result_status":{"type":"string","enum":["SUCCESS","FAIL","PARTIAL"]},"error_code":{"type":"string"},"error_description":{"type":"string"},"retryable":{"type":"boolean"},"request_ref":{"type":"string"},"response_ref":{"type":"string"},"stack":{"type":"string"}},"required":["system","operation","result_status"]}', '{event,source}', 21)

ON CONFLICT (type_key) DO NOTHING;

-- Seed metrics: extract all numeric/countable fields from schemas
INSERT INTO metrics (schema_type_key, field_path, display_name, data_type, description) VALUES
  ('event', 'data.guests', 'Guest Count', 'integer', 'Number of guests for the event'),
  ('event', 'data.spaces_count', 'Spaces Count', 'integer', 'Number of spaces needed'),
  ('event', 'data.catering_needs_count', 'Catering Needs Count', 'integer', 'Number of catering setups'),
  ('event', 'data.housing_need_count', 'Housing Need Count', 'integer', 'Number of housing units needed'),
  ('event', 'data.single_rooms_count', 'Single Rooms Count', 'integer', 'Number of single rooms'),
  ('event', 'data.setup_minutes', 'Setup Time (min)', 'integer', 'Setup time in minutes'),
  ('event', 'data.teardown_minutes', 'Teardown Time (min)', 'integer', 'Teardown time in minutes'),
  ('event', 'data.accessibility_requirements.wheelchair_users', 'Wheelchair Users', 'integer', 'Number of wheelchair users'),
  ('event', 'data.accessibility_requirements.accessible_rooms_needed', 'Accessible Rooms Needed', 'integer', 'Number of accessible rooms needed'),
  ('budget', 'data.global_budget', 'Global Budget', 'number', 'Total event budget'),
  ('budget', 'data.global_budget_max', 'Global Budget Max', 'number', 'Maximum budget cap'),
  ('budget', 'data.budget_per_person', 'Budget Per Person', 'number', 'Budget allocated per person'),
  ('budget', 'data.budget_per_person_max', 'Budget Per Person Max', 'number', 'Maximum per-person budget'),
  ('budget', 'data.tax_breakdown.vat_percent', 'VAT %', 'number', 'VAT percentage'),
  ('budget', 'data.tax_breakdown.service_charge_percent', 'Service Charge %', 'number', 'Service charge percentage'),
  ('budget', 'data.tax_breakdown.city_tax_percent', 'City Tax %', 'number', 'City tax percentage'),
  ('budget', 'data.category_caps.space_max', 'Space Cap', 'number', 'Maximum budget for spaces'),
  ('budget', 'data.category_caps.av_max', 'AV Cap', 'number', 'Maximum budget for AV'),
  ('budget', 'data.category_caps.fnb_max', 'F&B Cap', 'number', 'Maximum budget for food & beverage'),
  ('budget', 'data.category_caps.rooms_max', 'Rooms Cap', 'number', 'Maximum budget for rooms'),
  ('meeting-room', 'data.capacity', 'Room Capacity', 'integer', 'Seating capacity of the room'),
  ('meeting-room', 'data.ceiling_height_m', 'Ceiling Height (m)', 'number', 'Ceiling height in meters'),
  ('meeting-room', 'data.floor_area_sqm', 'Floor Area (sqm)', 'number', 'Floor area in square meters'),
  ('meeting-room', 'data.network.dedicated_bandwidth_mbps', 'Bandwidth (Mbps)', 'number', 'Dedicated network bandwidth'),
  ('meeting-room', 'data.network.hardline_ports', 'Hardline Ports', 'integer', 'Number of hardline network ports'),
  ('meeting-room', 'data.power.single_phase_amps', 'Power (Amps)', 'integer', 'Single phase amperage'),
  ('meeting-room', 'data.loading.loading_bay_clearance_m', 'Loading Bay Clearance (m)', 'number', 'Loading bay clearance in meters'),
  ('food-and-beverage', 'data.dietary_counts.vegan', 'Vegan Count', 'integer', 'Number of vegan meals'),
  ('food-and-beverage', 'data.dietary_counts.vegetarian', 'Vegetarian Count', 'integer', 'Number of vegetarian meals'),
  ('food-and-beverage', 'data.dietary_counts.gluten_free', 'Gluten Free Count', 'integer', 'Number of gluten-free meals'),
  ('food-and-beverage', 'data.dietary_counts.halal', 'Halal Count', 'integer', 'Number of halal meals'),
  ('food-and-beverage', 'data.dietary_counts.kosher', 'Kosher Count', 'integer', 'Number of kosher meals'),
  ('food-and-beverage', 'data.dietary_counts.nut_free', 'Nut Free Count', 'integer', 'Number of nut-free meals'),
  ('equipment', 'data.quantity', 'Equipment Quantity', 'integer', 'Number of equipment items'),
  ('equipment', 'data.power_watts', 'Power (Watts)', 'number', 'Power consumption in watts'),
  ('conference-day', 'data.persons', 'Day Persons', 'integer', 'Number of persons for the day'),
  ('package', 'data.count', 'Package Count', 'integer', 'Number of packages'),
  ('line-item', 'data.count', 'Line Item Count', 'integer', 'Quantity of line items'),
  ('room-block', 'data.attrition_percent', 'Attrition %', 'number', 'Room block attrition percentage'),
  ('stats', 'data.lead_time_days', 'Lead Time (days)', 'integer', 'Days between inquiry and event'),
  ('stats', 'data.persons_total', 'Total Persons', 'integer', 'Total persons across all days'),
  ('stats', 'data.rooms_nights_total', 'Total Room Nights', 'integer', 'Total room nights booked'),
  ('stats', 'data.peak_day_persons', 'Peak Day Persons', 'integer', 'Highest person count on any single day'),
  ('availability-check', 'data.criteria.pax', 'Availability Check PAX', 'integer', 'Number of persons checked for availability'),
  ('integration-log', 'data.http_status', 'HTTP Status', 'integer', 'HTTP response status code')
ON CONFLICT (schema_type_key, field_path) DO NOTHING;
