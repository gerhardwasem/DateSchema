import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useFilters } from '../contexts/FilterContext';
import type { SampleEvent, SampleComponent } from '../lib/types';

export interface EnrichedEvent extends SampleEvent {
  venueName: string | null;
  eventType: string | null;
  fromDate: string | null;
  guestCount: number;
  globalBudget: number;
  leadTimeDays: number;
  roomNights: number;
}

export interface VenueGroup {
  venueName: string;
  events: EnrichedEvent[];
  components: SampleComponent[];
  totalGuests: number;
  totalBudget: number;
  totalRoomNights: number;
  avgLeadTime: number;
}

export function useSampleData() {
  const [allEvents, setAllEvents] = useState<SampleEvent[]>([]);
  const [allComponents, setAllComponents] = useState<SampleComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const filters = useFilters();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [evtRes, compRes] = await Promise.all([
      supabase.from('sample_events').select('*').order('created_at', { ascending: false }),
      supabase.from('sample_components').select('*'),
    ]);
    if (evtRes.data) setAllEvents(evtRes.data as SampleEvent[]);
    if (compRes.data) setAllComponents(compRes.data as SampleComponent[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const componentsByEvent = useMemo(() => {
    const map: Record<string, SampleComponent[]> = {};
    for (const c of allComponents) {
      if (!map[c.sample_event_id]) map[c.sample_event_id] = [];
      map[c.sample_event_id].push(c);
    }
    return map;
  }, [allComponents]);

  const enrichedEvents: EnrichedEvent[] = useMemo(() => {
    return allEvents.map((evt) => {
      const comps = componentsByEvent[evt.id] || [];
      const venueComp = comps.find((c) => c.schema_type_key === 'venue');
      const eventComp = comps.find((c) => c.schema_type_key === 'event');
      const dateComp = comps.find((c) => c.schema_type_key === 'datetime');
      const budgetComp = comps.find((c) => c.schema_type_key === 'budget');
      const statsComp = comps.find((c) => c.schema_type_key === 'stats');

      return {
        ...evt,
        venueName: (venueComp?.data as Record<string, unknown>)?.venue_name as string | null,
        eventType: (eventComp?.data as Record<string, unknown>)?.eventType as string | null,
        fromDate: (dateComp?.data as Record<string, unknown>)?.from_date as string | null,
        guestCount: ((eventComp?.data as Record<string, unknown>)?.guests as number) || 0,
        globalBudget: ((budgetComp?.data as Record<string, unknown>)?.global_budget as number) || 0,
        leadTimeDays: ((statsComp?.data as Record<string, unknown>)?.lead_time_days as number) || 0,
        roomNights: ((statsComp?.data as Record<string, unknown>)?.rooms_nights_total as number) || 0,
      };
    });
  }, [allEvents, componentsByEvent]);

  const filteredEvents: EnrichedEvent[] = useMemo(() => {
    let result = enrichedEvents;

    if (filters.selectedVenues.length > 0) {
      result = result.filter((e) => e.venueName && filters.selectedVenues.includes(e.venueName));
    }

    if (filters.eventTypes.length > 0) {
      result = result.filter((e) => e.eventType && filters.eventTypes.includes(e.eventType));
    }

    if (filters.dateRange) {
      result = result.filter((e) => {
        if (!e.fromDate) return false;
        return e.fromDate >= filters.dateRange!.start && e.fromDate <= filters.dateRange!.end;
      });
    }

    return result;
  }, [enrichedEvents, filters.selectedVenues, filters.eventTypes, filters.dateRange]);

  const filteredComponents: SampleComponent[] = useMemo(() => {
    const ids = new Set(filteredEvents.map((e) => e.id));
    return allComponents.filter((c) => ids.has(c.sample_event_id));
  }, [filteredEvents, allComponents]);

  const venueGroups: VenueGroup[] = useMemo(() => {
    const groups: Record<string, { events: EnrichedEvent[]; components: SampleComponent[] }> = {};
    for (const evt of filteredEvents) {
      const key = evt.venueName || 'Unknown';
      if (!groups[key]) groups[key] = { events: [], components: [] };
      groups[key].events.push(evt);
      groups[key].components.push(...(componentsByEvent[evt.id] || []));
    }
    return Object.entries(groups).map(([venueName, g]) => ({
      venueName,
      events: g.events,
      components: g.components,
      totalGuests: g.events.reduce((s, e) => s + e.guestCount, 0),
      totalBudget: g.events.reduce((s, e) => s + e.globalBudget, 0),
      totalRoomNights: g.events.reduce((s, e) => s + e.roomNights, 0),
      avgLeadTime:
        g.events.length > 0
          ? Math.round(g.events.reduce((s, e) => s + e.leadTimeDays, 0) / g.events.length)
          : 0,
    }));
  }, [filteredEvents, componentsByEvent]);

  const availableVenues = useMemo(
    () => [...new Set(enrichedEvents.map((e) => e.venueName).filter(Boolean) as string[])].sort(),
    [enrichedEvents]
  );

  const availableEventTypes = useMemo(
    () => [...new Set(enrichedEvents.map((e) => e.eventType).filter(Boolean) as string[])].sort(),
    [enrichedEvents]
  );

  const dateMin = useMemo(() => {
    const dates = enrichedEvents.map((e) => e.fromDate).filter(Boolean) as string[];
    return dates.length > 0 ? dates.sort()[0] : undefined;
  }, [enrichedEvents]);

  const dateMax = useMemo(() => {
    const dates = enrichedEvents.map((e) => e.fromDate).filter(Boolean) as string[];
    return dates.length > 0 ? dates.sort().pop() : undefined;
  }, [enrichedEvents]);

  return {
    allEvents,
    enrichedEvents,
    filteredEvents,
    filteredComponents,
    componentsByEvent,
    venueGroups,
    availableVenues,
    availableEventTypes,
    dateMin,
    dateMax,
    loading,
    refresh: fetchAll,
  };
}
