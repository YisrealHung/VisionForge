import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, ProjectCreateInput, SystemHealth, NavView, ActiveWorkspace } from '../types';
import { api } from '../services/api';

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  systemHealth: SystemHealth | null;
  loading: boolean;
  activeWorkspace: ActiveWorkspace;
  currentView: NavView;
  isCreateModalOpen: boolean;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  setIsCreateModalOpen: (open: boolean) => void;
  setActiveWorkspace: (ws: ActiveWorkspace) => void;
  setCurrentView: (view: NavView) => void;
  fetchProjects: () => Promise<void>;
  createProject: (input: ProjectCreateInput) => Promise<Project>;
  activateProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeWorkspace, setActiveWorkspace] = useState<ActiveWorkspace>('training');
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('visionforge_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    localStorage.setItem('visionforge_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const list = await api.listProjects();
      setProjects(list);
      const active = list.find((p) => p.is_active) || (list.length > 0 ? list[0] : null);
      setActiveProject(active);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    const health = await api.getSystemHealth();
    setSystemHealth((prev) => {
      if (prev?.status !== 'online' && health.status === 'online') {
        fetchProjects();
      }
      return health;
    });
  }, [fetchProjects]);

  useEffect(() => {
    fetchProjects();
    checkHealth();
    const interval = setInterval(checkHealth, 3000);
    return () => clearInterval(interval);
  }, [fetchProjects, checkHealth]);

  const handleCreateProject = async (input: ProjectCreateInput): Promise<Project> => {
    const newProj = await api.createProject(input);
    await fetchProjects();
    setActiveProject(newProj);
    return newProj;
  };

  const handleActivateProject = async (id: string) => {
    const activated = await api.activateProject(id);
    setActiveProject(activated);
    setProjects((prev) =>
      prev.map((p) => ({
        ...p,
        is_active: p.id === id,
      }))
    );
  };

  const handleDeleteProject = async (id: string) => {
    await api.deleteProject(id);
    await fetchProjects();
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        systemHealth,
        loading,
        activeWorkspace,
        currentView,
        isCreateModalOpen,
        theme,
        setTheme,
        setIsCreateModalOpen,
        setActiveWorkspace,
        setCurrentView,
        fetchProjects,
        createProject: handleCreateProject,
        activateProject: handleActivateProject,
        deleteProject: handleDeleteProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
