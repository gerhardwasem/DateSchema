import { useState, useRef } from 'react';
import { X, Upload, FileJson, Check, AlertTriangle, ArrowRight, User } from 'lucide-react';
import type { SchemaType } from '../../lib/types';
import { useSchemaImport, type ImportEntry, type ImportPreview } from '../../hooks/useSchemaImport';

interface Props {
  schemaTypes: SchemaType[];
  onClose: () => void;
  onImported: () => void;
}

type InputMode = 'paste' | 'file';
type Step = 'input' | 'preview' | 'result';

export default function SchemaImportDialog({ schemaTypes, onClose, onImported }: Props) {
  const { parseInput, preview, executeImport, importing } = useSchemaImport(schemaTypes);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<InputMode>('paste');
  const [step, setStep] = useState<Step>('input');
  const [rawJson, setRawJson] = useState('');
  const [parseError, setParseError] = useState('');
  const [entries, setEntries] = useState<ImportEntry[]>([]);
  const [previews, setPreviews] = useState<ImportPreview[]>([]);
  const [actor, setActor] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [results, setResults] = useState<{ type_key: string; success: boolean; error?: string }[]>([]);

  const handleParse = (json: string) => {
    setParseError('');
    const parsed = parseInput(json);
    if (!parsed) {
      setParseError('Invalid JSON. Expected an object with type_key or an array of objects.');
      return;
    }
    setEntries(parsed);
    setPreviews(preview(parsed));
    setStep('preview');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawJson(text);
      handleParse(text);
    };
    reader.readAsText(file);
  };

  const handleConfirm = async () => {
    const res = await executeImport(entries, actor, changeSummary);
    setResults(res);
    setStep('result');
    onImported();
  };

  const changedCount = previews.filter((p) => p.matched && !p.unchanged).length;
  const unmatchedCount = previews.filter((p) => !p.matched).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
              <FileJson className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Import Schema Update</h2>
              <p className="text-xs text-slate-500">
                {step === 'input' && 'Paste JSON or upload a file'}
                {step === 'preview' && 'Review changes before applying'}
                {step === 'result' && 'Import complete'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5">
          {step === 'input' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {(['paste', 'file'] as InputMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors ${
                      mode === m
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m === 'paste' ? <FileJson className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    {m === 'paste' ? 'Paste JSON' : 'Upload File'}
                  </button>
                ))}
              </div>

              {mode === 'paste' ? (
                <textarea
                  value={rawJson}
                  onChange={(e) => setRawJson(e.target.value)}
                  placeholder={'Paste a single schema object or an array of schema objects...\n\n{\n  "type_key": "venue",\n  "json_schema": { "properties": { ... }, "required": [...] }\n}'}
                  className="w-full h-64 px-4 py-3 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                />
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors"
                >
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600 font-medium">Click to upload .json file</p>
                  <p className="text-xs text-slate-400 mt-1">Single object or array of schema types</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {parseError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {parseError}
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full font-medium">
                  {changedCount} to update
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">
                  {previews.filter((p) => p.unchanged).length} unchanged
                </span>
                {unmatchedCount > 0 && (
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full">
                    {unmatchedCount} unmatched
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {previews.map((p) => (
                  <div
                    key={p.type_key}
                    className={`rounded-xl border p-4 ${
                      !p.matched
                        ? 'border-amber-200 bg-amber-50/50'
                        : p.unchanged
                          ? 'border-slate-200 bg-slate-50/50'
                          : 'border-teal-200 bg-teal-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-xs font-mono font-semibold text-slate-800">{p.type_key}</code>
                      <span className="text-xs text-slate-400">{p.display_name}</span>
                      {!p.matched && (
                        <span className="text-xs text-amber-600 font-medium ml-auto">Not found in current schema</span>
                      )}
                      {p.unchanged && (
                        <span className="text-xs text-slate-500 ml-auto">No changes</span>
                      )}
                    </div>
                    {p.diffs.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {p.diffs.map((d) => (
                          <div
                            key={d.path}
                            className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono ${
                              d.kind === 'added'
                                ? 'bg-emerald-50 text-emerald-700'
                                : d.kind === 'removed'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            <span className="font-semibold">
                              {d.kind === 'added' ? '+' : d.kind === 'removed' ? '-' : '~'}
                            </span>
                            <span>{d.path}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={actor}
                    onChange={(e) => setActor(e.target.value)}
                    placeholder="Your name"
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  />
                </div>
                <textarea
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="Describe what changed (e.g. 'Added wifi_password field to venue')..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="space-y-3">
              {results.map((r) => (
                <div
                  key={r.type_key}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                    r.success ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'
                  }`}
                >
                  {r.success ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <code className="text-sm font-mono text-slate-800">{r.type_key}</code>
                  {r.error && <span className="text-xs text-red-600 ml-auto">{r.error}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          {step === 'input' && (
            <>
              <div />
              <button
                onClick={() => handleParse(rawJson)}
                disabled={!rawJson.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Preview Changes
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('input')}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={importing || changedCount === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? 'Importing...' : `Confirm Import (${changedCount})`}
              </button>
            </>
          )}

          {step === 'result' && (
            <>
              <div />
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
