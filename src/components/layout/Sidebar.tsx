import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Database,
  Gauge,
  Code2,
  Hexagon,
  BarChart3,
  Box,
  Layers,
  FolderOpen,
  ChevronDown,
  ArrowLeft,
  Settings,
} from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { useChangeProposals } from '../../hooks/useChangeProposals';
import { useSchemaTypes } from '../../hooks/useSchemaTypes';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Hexagon, BarChart3, Network, Database, Box, Layers, FolderOpen,
};

export default function Sidebar() {
  const { activeProject, projects, switchProject } = useProject();
  const { proposals } = useChangeProposals();
  const { schemaTypes } = useSchemaTypes();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const submittedCount = proposals.filter((p) => p.status === 'submitted').length;
  const slug = activeProject?.slug || '';

  const navItems = [
    { to: `/p/${slug}/schema`, icon: Network, label: 'Schema Explorer' },
    { to: `/p/${slug}/samples`, icon: Database, label: 'Sample Data' },
    { to: `/p/${slug}/kpi-builder`, icon: Gauge, label: 'KPI Builder' },
    { to: `/p/${slug}/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
    { to: `/p/${slug}/dev-handoff`, icon: Code2, label: 'Dev Specs' },
  ];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const ProjectIcon = activeProject ? (ICON_MAP[activeProject.icon] || Hexagon) : Hexagon;

  return (
    <aside className="w-64 bg-slate-900 flex flex-col shrink-0">
      <div className="relative px-4 py-4 border-b border-slate-700/50" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center gap-3 px-1 py-1 rounded-lg hover:bg-slate-800/60 transition-colors"
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: (activeProject?.color || '#0891b2') + '20' }}
          >
            <ProjectIcon className="w-5 h-5" style={{ color: activeProject?.color || '#0891b2' }} />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {activeProject?.name || 'Select Project'}
            </p>
            <p className="text-slate-500 text-xs truncate">
              {schemaTypes.length} types
            </p>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute left-3 right-3 top-[64px] z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 max-h-72 overflow-auto">
            {projects.map((p) => {
              const Ic = ICON_MAP[p.icon] || Hexagon;
              const isActive = p.id === activeProject?.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    switchProject(p.slug);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isActive ? 'bg-slate-700/50' : 'hover:bg-slate-700/30'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: p.color + '20' }}
                  >
                    <Ic className="w-3.5 h-3.5" style={{ color: p.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm truncate">{p.name}</p>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  )}
                </button>
              );
            })}
            <div className="border-t border-slate-700 mt-1 pt-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-slate-400 hover:text-white hover:bg-slate-700/30 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="text-sm">All Projects</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            <item.icon className="w-4.5 h-4.5" />
            <span className="flex-1">{item.label}</span>
            {item.label === 'Schema Explorer' && submittedCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-400 text-amber-900 font-semibold">
                {submittedCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            <p>{schemaTypes.length} Component Types</p>
            <p className="text-slate-600 mt-0.5">{activeProject?.name || 'No project'}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-slate-400 transition-colors p-1"
            title="All projects"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
