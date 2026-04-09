import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Database,
  Gauge,
  Code2,
  Hexagon,
} from 'lucide-react';
import { useChangeProposals } from '../../hooks/useChangeProposals';

const navItems = [
  { to: '/', icon: Network, label: 'Schema Explorer' },
  { to: '/samples', icon: Database, label: 'Sample Data' },
  { to: '/kpi-builder', icon: Gauge, label: 'KPI Builder' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dev-handoff', icon: Code2, label: 'Dev Specs' },
];

export default function Sidebar() {
  const { proposals } = useChangeProposals();
  const submittedCount = proposals.filter((p) => p.status === 'submitted').length;

  return (
    <aside className="w-64 bg-slate-900 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
            <Hexagon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm tracking-tight">Schema Workbench</h1>
            <p className="text-slate-500 text-xs">Event API Insight Tool</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            <item.icon className="w-4.5 h-4.5" />
            <span className="flex-1">{item.label}</span>
            {item.to === '/' && submittedCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-400 text-amber-900 font-semibold">
                {submittedCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700/50">
        <div className="text-xs text-slate-500">
          <p>21 Component Types</p>
          <p className="text-slate-600 mt-0.5">Event Management Schema v1</p>
        </div>
      </div>
    </aside>
  );
}
