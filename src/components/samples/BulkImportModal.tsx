import { useState, useRef } from 'react';
import { X, Package, Upload, CheckSquare, Square, Loader } from 'lucide-react';
import { SCENARIO_PACKS, getEventTemplates, TEMPLATES } from '../../lib/sample-events-catalog';
import { VENUES } from '../../lib/venue-data';
import { supabase } from '../../lib/supabase';

interface Props {
  onClose: () => void;
  onImported: () => void;
}

export default function BulkImportModal({ onClose, onImported }: Props) {
  const [tab, setTab] = useState<'packs' | 'json'>('packs');
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePackSelect = (packId: string) => {
    const pack = SCENARIO_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    setSelectedPack(packId);
    setSelectedIndices(new Set(pack.eventIndices));
  };

  const toggleIndex = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
    setSelectedPack(null);
  };

  const toggleAll = () => {
    if (selectedIndices.size === TEMPLATES.length) {
      setSelectedIndices(new Set());
      setSelectedPack(null);
    } else {
      setSelectedIndices(new Set(TEMPLATES.map((_, i) => i)));
      setSelectedPack('all');
    }
  };

  const importSelected = async () => {
    const indices = Array.from(selectedIndices);
    if (indices.length === 0) return;

    setImporting(true);
    const events = getEventTemplates(indices);
    setProgress({ current: 0, total: events.length });

    for (let i = 0; i < events.length; i++) {
      const evt = events[i];
      const { data, error } = await supabase
        .from('sample_events')
        .insert({ name: evt.name })
        .select()
        .maybeSingle();

      if (!error && data) {
        const rows = Object.entries(evt.components).map(([typeKey, compData]) => ({
          sample_event_id: data.id,
          schema_type_key: typeKey,
          component_id: `${typeKey}_${Date.now()}_${i}`,
          data: compData,
        }));
        await supabase.from('sample_components').insert(rows);
      }
      setProgress({ current: i + 1, total: events.length });
    }

    setImporting(false);
    onImported();
  };

  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : [parsed];

      setImporting(true);
      setProgress({ current: 0, total: arr.length });

      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        const name = item.name || `Imported Event ${i + 1}`;
        const components = item.components || item;

        const { data, error } = await supabase
          .from('sample_events')
          .insert({ name })
          .select()
          .maybeSingle();

        if (!error && data) {
          const rows = Object.entries(components)
            .filter(([key]) => key !== 'name')
            .map(([typeKey, compData]) => ({
              sample_event_id: data.id,
              schema_type_key: typeKey,
              component_id: `${typeKey}_${Date.now()}_${i}`,
              data: compData as Record<string, unknown>,
            }));
          if (rows.length > 0) {
            await supabase.from('sample_components').insert(rows);
          }
        }
        setProgress({ current: i + 1, total: arr.length });
      }

      setImporting(false);
      onImported();
    } catch {
      setImporting(false);
    }
  };

  const groupedTemplates = VENUES.map((venue, vIdx) => ({
    venue,
    events: TEMPLATES.map((t, i) => ({ ...t, globalIndex: i })).filter((t) => t.venueIndex === vIdx),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Bulk Import Scenarios</h2>
            <p className="text-sm text-slate-500 mt-0.5">Import pre-built event scenarios or upload JSON</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setTab('packs')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'packs' ? 'text-cyan-600 border-b-2 border-cyan-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package className="w-3.5 h-3.5 inline mr-1.5" />
            Scenario Packs
          </button>
          <button
            onClick={() => setTab('json')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'json' ? 'text-cyan-600 border-b-2 border-cyan-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5 inline mr-1.5" />
            JSON Upload
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {tab === 'packs' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {SCENARIO_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => handlePackSelect(pack.id)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      selectedPack === pack.id
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-800">{pack.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{pack.description}</p>
                    <span className="inline-block mt-1.5 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {pack.eventIndices.length} events
                    </span>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Individual Events
                  </span>
                  <button
                    onClick={toggleAll}
                    className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    {selectedIndices.size === TEMPLATES.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {groupedTemplates.map(({ venue, events }) => (
                  <div key={venue.venue_id} className="mb-3">
                    <p className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-500" />
                      {venue.venue_name}
                      <span className="text-slate-400 font-normal">({venue.locality})</span>
                    </p>
                    <div className="grid grid-cols-2 gap-1 ml-3.5">
                      {events.map((evt) => (
                        <button
                          key={evt.globalIndex}
                          onClick={() => toggleIndex(evt.globalIndex)}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-left transition-colors"
                        >
                          {selectedIndices.has(evt.globalIndex) ? (
                            <CheckSquare className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          )}
                          <span className="text-xs text-slate-700 truncate">{evt.name}</span>
                          <span className="text-xs text-slate-400 ml-auto shrink-0">
                            {(evt.event as { guests: number }).guests}p
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'json' && (
            <div className="flex flex-col items-center justify-center py-12">
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleJsonUpload}
              />
              <div
                onClick={() => fileRef.current?.click()}
                className="w-full max-w-sm border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/30 transition-colors"
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600">Click to upload JSON</p>
                <p className="text-xs text-slate-400 mt-1">
                  Array of objects with name + components
                </p>
              </div>
            </div>
          )}
        </div>

        {importing && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <Loader className="w-4 h-4 text-cyan-600 animate-spin" />
              <span className="text-sm text-slate-600">
                Importing {progress.current} of {progress.total} events...
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {tab === 'packs' && !importing && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {selectedIndices.size} event{selectedIndices.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="text-sm text-slate-500 px-4 py-2">
                Cancel
              </button>
              <button
                onClick={importSelected}
                disabled={selectedIndices.size === 0}
                className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Import {selectedIndices.size} Event{selectedIndices.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
