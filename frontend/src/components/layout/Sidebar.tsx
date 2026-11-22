import React from 'react';
import {
  Flame,
  LayoutDashboard,
  FolderSearch,
  Tag,
  BrainCircuit,
  Activity,
  PackageCheck,
  ScanEye,
  Radio,
  Settings,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { NavView } from '../../types';

export const Sidebar: React.FC = () => {
  const {
    activeWorkspace,
    setActiveWorkspace,
    currentView,
    setCurrentView,
    t,
  } = useProject();

  const trainingNavItems = [
    { id: 'dashboard' as NavView, label: t.navDashboard, icon: LayoutDashboard },
    { id: 'dataset' as NavView, label: t.navDataset, icon: FolderSearch },
    { id: 'annotator' as NavView, label: t.navAnnotator, icon: Tag },
    { id: 'train' as NavView, label: t.navTrain, icon: BrainCircuit },
    { id: 'monitor' as NavView, label: t.navMonitor, icon: Activity },
    { id: 'export' as NavView, label: t.navExport, icon: PackageCheck },
  ];

  const inferenceNavItems = [
    { id: 'inference_station' as NavView, label: t.navInferenceStation, icon: ScanEye },
    { id: 'api_server' as NavView, label: t.navApiServer, icon: Radio },
  ];

  const handleNavClick = (view: NavView, ws: 'training' | 'inference') => {
    setActiveWorkspace(ws);
    setCurrentView(view);
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <div className="brand-badge">
          <div className="brand-icon-box" aria-hidden="true">
            <Flame size={16} strokeWidth={1.5} />
          </div>
          <span className="brand-name">VisionForge</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <div className="nav-section">
          <div className="nav-section-title">
            <span>{t.trainingWorkspace}</span>
          </div>
          <ul className="nav-list">
            {trainingNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeWorkspace === 'training' && currentView === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`nav-item-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id, 'training')}
                  >
                    <Icon className="nav-item-icon" size={16} strokeWidth={1.5} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">
            <span>{t.inferenceWorkspace}</span>
          </div>
          <ul className="nav-list">
            {inferenceNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeWorkspace === 'inference' && currentView === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`nav-item-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id, 'inference')}
                  >
                    <Icon className="nav-item-icon" size={16} strokeWidth={1.5} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className={`nav-item-btn ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentView('settings')}
        >
          <Settings className="nav-item-icon" size={16} strokeWidth={1.5} aria-hidden="true" />
          <span>{t.navSettings}</span>
        </button>
      </div>
    </aside>
  );
};
