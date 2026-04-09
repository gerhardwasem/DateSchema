import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Hexagon,
  BarChart3,
  Network,
  Database,
  Box,
  Layers,
  FolderOpen,
  ArrowRight,
  Upload,
  X,
} from 'lucide-react';
import type { Project } from '../lib/types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Hexagon,
  BarChart3,
  Network,
  Database,
  Box,
  Layers,
  FolderOpen,
};

const ACCENT_COLORS = [
  '#0891b2', '#059669', '#0284c7', '#d97706',
  '#dc2626', '#2563eb', '#0d9488', '#ca8a04',
  '#ea580c', '#16a34a',
];

const ICON_OPTIONS = ['Hexagon', 'BarChart3', 'Network', 'Database', 'Box', 'Layers', 'FolderOpen'];

interface ProjectStats {
  projectId: string;
  typeCount: number;
}

export default function ProjectsHome() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at');
    if (data) setProjects(data as Project[]);

    const { data: typeCounts } = await supabase
      .from('schema_types')
      .select('project_id');
    if (typeCounts) {
      const counts: Record<string, number> = {};
      for (const row of typeCounts) {
        const pid = (row as { project_id: string }).project_id;
        counts[pid] = (counts[pid] || 0) + 1;
      }
      setStats(Object.entries(counts).map(([projectId, typeCount]) => ({ projectId, typeCount })));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const getStats = (projectId: string) => stats.find((s) => s.projectId === projectId);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Schema Workbench</h1>
          </div>
          <p className="text-slate-400 text-sm ml-[52px]">
            Select a project to explore its data model, or create a new one.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => {
            const s = getStats(project.id);
            const IconComp = ICON_MAP[project.icon] || Hexagon;

            return (
              <button
                key={project.id}
                onClick={() => navigate(`/p/${project.slug}/schema`)}
                className="group relative bg-slate-900 border border-slate-800/60 rounded-xl p-6 text-left
                  hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: project.color + '20' }}
                  >
                    <IconComp className="w-5 h-5" style={{ color: project.color }} />
                  </div>
                  <ArrowRight
                    className="w-4 h-4 text-slate-600 group-hover:text-slate-400
                      translate-x-0 group-hover:translate-x-1 transition-all duration-200"
                  />
                </div>

                <h3 className="text-white font-semibold text-base mb-1.5">{project.name}</h3>
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-5">
                  {project.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    {s?.typeCount ?? 0} types
                  </span>
                  <span>
                    {new Date(project.updated_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div
                  className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: project.color }}
                />
              </button>
            );
          })}

          <button
            onClick={() => setShowCreate(true)}
            className="group bg-slate-900/40 border border-dashed border-slate-700/60 rounded-xl p-6
              flex flex-col items-center justify-center gap-3 min-h-[200px]
              hover:border-slate-600 hover:bg-slate-900/60 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          >
            <div className="w-11 h-11 rounded-lg bg-slate-800 flex items-center justify-center
              group-hover:bg-slate-700 transition-colors">
              <Plus className="w-5 h-5 text-slate-400" />
            </div>
            <span className="text-slate-400 text-sm font-medium">New Project</span>
          </button>
        </div>
      </main>

      {showCreate && (
        <CreateProjectDialog
          onClose={() => setShowCreate(false)}
          onCreated={(slug) => {
            navigate(`/p/${slug}/schema`);
          }}
        />
      )}
    </div>
  );
}

function CreateProjectDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (slug: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(ACCENT_COLORS[0]);
  const [icon, setIcon] = useState('Hexagon');
  const [catalogFile, setCatalogFile] = useState<File | null>(null);
  const [catalogPreview, setCatalogPreview] = useState<{ domains: number; kpis: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCatalogFile(file);

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const domains = json.Domains?.length ?? 0;
      let kpis = 0;
      for (const d of json.Domains || []) {
        for (const g of d.KPIGroups || []) {
          kpis += g.KPIs?.length ?? 0;
        }
      }
      setCatalogPreview({ domains, kpis });
    } catch {
      setCatalogPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug) return;

    setSaving(true);
    setError('');

    let sourceCatalog: Record<string, unknown> | null = null;
    if (catalogFile) {
      try {
        const text = await catalogFile.text();
        sourceCatalog = JSON.parse(text);
      } catch {
        setError('Invalid JSON file');
        setSaving(false);
        return;
      }
    }

    const { data, error: insertError } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        slug,
        description: description.trim(),
        color,
        icon,
        source_catalog: sourceCatalog,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.code === '23505' ? 'A project with this name already exists.' : insertError.message);
      setSaving(false);
      return;
    }

    if (sourceCatalog && data) {
      await seedFromCatalog(data.id, sourceCatalog);
    }

    setSaving(false);
    onCreated(slug);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-semibold text-lg">New Project</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40"
              placeholder="My Data Model"
              autoFocus
            />
            {slug && (
              <p className="text-xs text-slate-500 mt-1">Slug: {slug}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40 resize-none"
              placeholder="Brief description of this project..."
            />
          </div>

          <div className="flex gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c, outlineColor: color === c ? c : undefined }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Icon</label>
              <div className="flex flex-wrap gap-1.5">
                {ICON_OPTIONS.map((iconName) => {
                  const Ic = ICON_MAP[iconName] || Hexagon;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        icon === iconName
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Ic className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Import JSON Catalog (optional)
            </label>
            <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
              cursor-pointer hover:border-slate-600 transition-colors">
              <Upload className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">
                {catalogFile ? catalogFile.name : 'Choose a JSON file...'}
              </span>
              <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            </label>
            {catalogPreview && (
              <p className="text-xs text-emerald-400 mt-1.5">
                Found {catalogPreview.domains} domains with {catalogPreview.kpis} KPIs
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed
                text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

async function seedFromCatalog(projectId: string, catalog: Record<string, unknown>) {
  const domains = (catalog.Domains || []) as Array<{
    DomainId: string;
    Name: string;
    Description: string;
    DataSources?: string[];
    KPIGroups?: Array<{
      GroupId: string;
      Name: string;
      KPIs?: Array<{
        Id: string;
        Label: string;
        Format: string;
        Source: string;
        Computation?: string;
        Dimensions?: string[];
      }>;
    }>;
  }>;

  let sortOrder = 1;

  for (const domain of domains) {
    const properties: Record<string, unknown> = {};

    for (const group of domain.KPIGroups || []) {
      for (const kpi of group.KPIs || []) {
        properties[kpi.Id] = {
          type: kpi.Format === 'number' ? 'number'
            : kpi.Format === 'currency' ? 'number'
            : kpi.Format === 'percentage' ? 'number'
            : kpi.Format === 'days' ? 'number'
            : kpi.Format === 'hours' ? 'number'
            : kpi.Format === 'ms' ? 'number'
            : 'string',
          description: `${kpi.Label}${kpi.Computation ? ' — ' + kpi.Computation : ''}`,
          format: kpi.Format,
        };
      }
    }

    await supabase.from('schema_types').insert({
      project_id: projectId,
      type_key: domain.DomainId,
      display_name: domain.Name,
      description: domain.Description || '',
      json_schema: { properties, description: domain.Description },
      parent_types: [],
      sort_order: sortOrder++,
      source: 'catalog',
    });
  }
}
