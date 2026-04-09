import type { SchemaRelationship } from './types';

export const SCHEMA_RELATIONSHIPS: SchemaRelationship[] = [
  { from: 'event', to: 'budget', label: 'has budget' },
  { from: 'event', to: 'company-info', label: 'has organizer' },
  { from: 'event', to: 'venue', label: 'at venue' },
  { from: 'event', to: 'meeting-room', label: 'uses rooms' },
  { from: 'event', to: 'food-and-beverage', label: 'has F&B' },
  { from: 'event', to: 'equipment', label: 'needs equipment' },
  { from: 'event', to: 'datetime', label: 'scheduled at' },
  { from: 'event', to: 'source', label: 'sourced from' },
  { from: 'event', to: 'conference-day', label: 'has days' },
  { from: 'event', to: 'room-block', label: 'has room block' },
  { from: 'event', to: 'deadline', label: 'has deadlines' },
  { from: 'event', to: 'policy-terms', label: 'has terms' },
  { from: 'event', to: 'stats', label: 'has stats' },
  { from: 'event', to: 'content', label: 'has content' },
  { from: 'event', to: 'availability-check', label: 'checked availability' },
  { from: 'event', to: 'misc', label: 'has misc data' },
  { from: 'venue', to: 'location', label: 'located at' },
  { from: 'conference-day', to: 'package', label: 'includes packages' },
  { from: 'package', to: 'line-item', label: 'contains items' },
  { from: 'source', to: 'integration-log', label: 'has logs' },
];

export const PRESET_COLORS = [
  '#0e7490', '#0d9488', '#059669', '#d97706', '#0284c7',
  '#2563eb', '#dc2626', '#64748b', '#0f766e', '#ea580c',
  '#0891b2', '#16a34a', '#65a30d', '#0369a1', '#b91c1c',
  '#92400e', '#be185d', '#047857', '#78716c', '#334155',
  '#b45309', '#0c4a6e',
];

export function getColorForTypeKey(typeKey: string): string {
  if (COMPONENT_COLORS[typeKey]) return COMPONENT_COLORS[typeKey];
  const hash = typeKey.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PRESET_COLORS[hash % PRESET_COLORS.length];
}

export const COMPONENT_COLORS: Record<string, string> = {
  'event': '#0e7490',
  'location': '#0d9488',
  'budget': '#059669',
  'company-info': '#d97706',
  'venue': '#0284c7',
  'meeting-room': '#2563eb',
  'food-and-beverage': '#dc2626',
  'equipment': '#64748b',
  'datetime': '#0f766e',
  'misc': '#6b7280',
  'source': '#ea580c',
  'conference-day': '#0891b2',
  'package': '#16a34a',
  'line-item': '#65a30d',
  'room-block': '#0369a1',
  'deadline': '#b91c1c',
  'policy-terms': '#92400e',
  'stats': '#1d4ed8',
  'content': '#be185d',
  'availability-check': '#047857',
  'integration-log': '#78716c',
};

export const HIERARCHY_LEVELS: Record<string, number> = {
  'event': 0,
  'budget': 1,
  'company-info': 1,
  'venue': 1,
  'meeting-room': 1,
  'food-and-beverage': 1,
  'equipment': 1,
  'datetime': 1,
  'source': 1,
  'conference-day': 1,
  'room-block': 1,
  'deadline': 1,
  'policy-terms': 1,
  'stats': 1,
  'content': 1,
  'availability-check': 1,
  'misc': 1,
  'location': 2,
  'package': 2,
  'integration-log': 2,
  'line-item': 3,
};
