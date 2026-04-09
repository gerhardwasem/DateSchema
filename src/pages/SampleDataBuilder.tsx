import { useState, useEffect, useCallback } from 'react';
import { Plus, Save, Trash2, Copy, Download, FileJson, ChevronDown, ChevronRight, PackagePlus, Trash } from 'lucide-react';
import { useSchemaTypes } from '../hooks/useSchemaTypes';
import { supabase } from '../lib/supabase';
import { SAMPLE_EVENT_DATA } from '../lib/sample-data';
import { COMPONENT_COLORS } from '../lib/schema-relationships';
import DynamicForm from '../components/samples/DynamicForm';
import BulkImportModal from '../components/samples/BulkImportModal';
import type { SampleEvent, SampleComponent } from '../lib/types';

export default function SampleDataBuilder() {
  const { schemaTypes, loading: schemaLoading } = useSchemaTypes();
  const [sampleEvents, setSampleEvents] = useState<SampleEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [components, setComponents] = useState<SampleComponent[]>([]);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Record<string, unknown>>({});
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showJson, setShowJson] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase.from('sample_events').select('*').order('created_at', { ascending: false });
    if (data) setSampleEvents(data as SampleEvent[]);
  }, []);

  const fetchComponents = useCallback(async (eventId: string) => {
    const { data } = await supabase.from('sample_components').select('*').eq('sample_event_id', eventId);
    if (data) setComponents(data as SampleComponent[]);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => {
    if (selectedEventId) fetchComponents(selectedEventId);
  }, [selectedEventId, fetchComponents]);

  const createSampleEvent = async () => {
    if (!newName.trim()) return;
    const { data, error } = await supabase.from('sample_events').insert({ name: newName }).select().maybeSingle();
    if (!error && data) {
      const event = data as SampleEvent;
      for (const [typeKey, sampleData] of Object.entries(SAMPLE_EVENT_DATA)) {
        await supabase.from('sample_components').insert({
          sample_event_id: event.id,
          schema_type_key: typeKey,
          component_id: `${typeKey}_${Date.now()}`,
          data: sampleData,
        });
      }
      setSelectedEventId(event.id);
      setCreating(false);
      setNewName('');
      await fetchEvents();
      await fetchComponents(event.id);
    }
  };

  const deleteEvent = async (id: string) => {
    await supabase.from('sample_components').delete().eq('sample_event_id', id);
    await supabase.from('sample_events').delete().eq('id', id);
    if (selectedEventId === id) {
      setSelectedEventId(null);
      setComponents([]);
    }
    await fetchEvents();
  };

  const saveComponent = async (typeKey: string) => {
    const existing = components.find((c) => c.schema_type_key === typeKey);
    if (existing) {
      await supabase.from('sample_components').update({ data: editingData }).eq('id', existing.id);
    }
    await fetchComponents(selectedEventId!);
    setExpandedType(null);
    setEditingData({});
  };

  const handleExpand = (typeKey: string) => {
    if (expandedType === typeKey) {
      setExpandedType(null);
      return;
    }
    setExpandedType(typeKey);
    const comp = components.find((c) => c.schema_type_key === typeKey);
    setEditingData(comp ? (comp.data as Record<string, unknown>) : { ...(SAMPLE_EVENT_DATA[typeKey] || {}) });
  };

  const clearAllEvents = async () => {
    if (!confirm('Delete all sample scenarios? This cannot be undone.')) return;
    for (const evt of sampleEvents) {
      await supabase.from('sample_components').delete().eq('sample_event_id', evt.id);
      await supabase.from('sample_events').delete().eq('id', evt.id);
    }
    setSelectedEventId(null);
    setComponents([]);
    await fetchEvents();
  };

  const exportJson = () => {
    const payload: Record<string, unknown> = {};
    components.forEach((c) => {
      payload[c.schema_type_key] = { id: c.component_id, type: c.schema_type_key, data: c.data };
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-event-${selectedEventId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (schemaLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="w-72 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm text-slate-900">Sample Scenarios</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowBulkImport(true)}
                className="p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                title="Bulk Import"
              >
                <PackagePlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCreating(true)}
                className="p-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                title="Create Single"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {sampleEvents.length > 0 && (
                <button
                  onClick={clearAllEvents}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear All"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {creating && (
            <div className="space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Scenario name..."
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && createSampleEvent()}
              />
              <div className="flex gap-2">
                <button onClick={createSampleEvent} className="flex-1 text-xs bg-cyan-600 text-white py-1.5 rounded-lg hover:bg-cyan-700">
                  Create
                </button>
                <button onClick={() => setCreating(false)} className="text-xs text-slate-500 px-3 py-1.5">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {sampleEvents.map((evt) => (
            <div
              key={evt.id}
              className={`group flex items-center gap-2 px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors ${
                selectedEventId === evt.id ? 'bg-cyan-50 border-l-2 border-l-cyan-500' : 'hover:bg-slate-50'
              }`}
              onClick={() => setSelectedEventId(evt.id)}
            >
              <FileJson className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{evt.name}</p>
                <p className="text-xs text-slate-400">{new Date(evt.created_at).toLocaleDateString()}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteEvent(evt.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {sampleEvents.length === 0 && !creating && (
            <div className="p-6 text-center text-sm text-slate-400">
              No scenarios yet. Click + to create one pre-populated with sample data.
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedEventId ? (
          <>
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  {sampleEvents.find((e) => e.id === selectedEventId)?.name}
                </h1>
                <p className="text-sm text-slate-500">{components.length} components</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowJson(!showJson)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    showJson ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  JSON
                </button>
                <button
                  onClick={exportJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="flex">
                <div className={`flex-1 p-6 ${showJson ? 'w-1/2' : ''}`}>
                  <div className="space-y-2">
                    {schemaTypes.map((st) => {
                      const comp = components.find((c) => c.schema_type_key === st.type_key);
                      const isExpanded = expandedType === st.type_key;
                      const color = COMPONENT_COLORS[st.type_key] || '#64748b';

                      return (
                        <div key={st.type_key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                          <button
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                            onClick={() => handleExpand(st.type_key)}
                          >
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-sm font-medium text-slate-800 flex-1 text-left">{st.display_name}</span>
                            {comp && (
                              <span className="text-xs text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                                has data
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="border-t border-slate-100 p-4">
                              <DynamicForm
                                properties={st.json_schema.properties || {}}
                                values={editingData}
                                onChange={(key, val) => setEditingData((prev) => ({ ...prev, [key]: val }))}
                              />
                              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                                <button
                                  onClick={() => setExpandedType(null)}
                                  className="text-xs text-slate-500 px-3 py-1.5"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => saveComponent(st.type_key)}
                                  className="flex items-center gap-1.5 text-xs bg-cyan-600 text-white px-3 py-1.5 rounded-lg hover:bg-cyan-700 transition-colors"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  Save
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {showJson && (
                  <div className="w-1/2 border-l border-slate-200 bg-slate-900 p-4 overflow-auto">
                    <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                      {JSON.stringify(
                        components.reduce<Record<string, unknown>>((acc, c) => {
                          acc[c.schema_type_key] = { id: c.component_id, type: c.schema_type_key, data: c.data };
                          return acc;
                        }, {}),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileJson className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-slate-600">Select or Create a Scenario</h2>
              <p className="text-sm text-slate-400 mt-1">
                Each scenario is pre-populated with example data from the schema
              </p>
            </div>
          </div>
        )}
      </div>

      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onImported={async () => {
            setShowBulkImport(false);
            await fetchEvents();
          }}
        />
      )}
    </div>
  );
}
