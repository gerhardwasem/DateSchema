import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FilterProvider } from './contexts/FilterContext';
import AppShell from './components/layout/AppShell';
import SchemaExplorer from './pages/SchemaExplorer';
import SampleDataBuilder from './pages/SampleDataBuilder';
import KpiBuilder from './pages/KpiBuilder';
import Dashboard from './pages/Dashboard';
import DevHandoff from './pages/DevHandoff';

export default function App() {
  return (
    <BrowserRouter>
      <FilterProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<SchemaExplorer />} />
            <Route path="/samples" element={<SampleDataBuilder />} />
            <Route path="/kpi-builder" element={<KpiBuilder />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dev-handoff" element={<DevHandoff />} />
          </Route>
        </Routes>
      </FilterProvider>
    </BrowserRouter>
  );
}
