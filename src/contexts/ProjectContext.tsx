import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Project } from '../lib/types';

interface ProjectContextValue {
  projects: Project[];
  activeProject: Project | null;
  projectId: string | null;
  loading: boolean;
  switchProject: (slug: string) => void;
  createProject: (input: {
    name: string;
    slug: string;
    description: string;
    color: string;
    icon: string;
    source_catalog?: Record<string, unknown> | null;
  }) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'color' | 'icon'>>) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  refetchProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { projectSlug } = useParams<{ projectSlug: string }>();
  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at');

    if (!error && data) {
      setProjects(data as Project[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const activeProject = projects.find((p) => p.slug === projectSlug) ?? null;
  const projectId = activeProject?.id ?? null;

  const switchProject = useCallback((slug: string) => {
    navigate(`/p/${slug}/schema`);
  }, [navigate]);

  const createProject = useCallback(async (input: {
    name: string;
    slug: string;
    description: string;
    color: string;
    icon: string;
    source_catalog?: Record<string, unknown> | null;
  }): Promise<Project | null> => {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: input.name,
        slug: input.slug,
        description: input.description,
        color: input.color,
        icon: input.icon,
        source_catalog: input.source_catalog ?? null,
      })
      .select()
      .single();

    if (error || !data) return null;
    await fetchProjects();
    return data as Project;
  }, [fetchProjects]);

  const updateProject = useCallback(async (id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'color' | 'icon'>>) => {
    const { error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) await fetchProjects();
    return !error;
  }, [fetchProjects]);

  const deleteProject = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (!error) await fetchProjects();
    return !error;
  }, [fetchProjects]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        projectId,
        loading,
        switchProject,
        createProject,
        updateProject,
        deleteProject,
        refetchProjects: fetchProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
