import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FilterProvider } from './contexts/FilterContext';
import { ProjectProvider } from './contexts/ProjectContext';
import AppShell from './components/layout/AppShell';
import ProjectsHome from './pages/ProjectsHome';
import SchemaExplorer from './pages/SchemaExplorer';
import SampleDataBuilder from './pages/SampleDataBuilder';
import KpiBuilder from './pages/KpiBuilder';
import Dashboard from './pages/Dashboard';
import DevHandoff from './pages/DevHandoff';

function ProjectRoutes() {
  return (
    <ProjectProvider>
      <FilterProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="schema" element={<SchemaExplorer />} />
            <Route path="samples" element={<SampleDataBuilder />} />
            <Route path="kpi-builder" element={<KpiBuilder />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dev-handoff" element={<DevHandoff />} />
            <Route index element={<Navigate to="schema" replace />} />
          </Route>
        </Routes>
      </FilterProvider>
    </ProjectProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectsHome />} />
        <Route path="/p/:projectSlug/*" element={<ProjectRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}
