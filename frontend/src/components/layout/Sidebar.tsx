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
  Sparkles
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { NavView } from '../../types';

export const Sidebar: React.FC = () => {
  const { 
    activeWorkspace, 
    setActiveWorkspace, 
    currentView, 
    setCurrentView,
    t
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
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-badge">
          <div className="brand-icon-box">
            <Flame size={20} />
          </div>
          <div>
            <div className="brand-name">VisionForge</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="brand-tag">No-Code AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <div className="sidebar-nav">
        {/* Workspace 1: Training Section */}
        <div>
          <div className="nav-section-title">
            <span>🛠️ {t.trainingWorkspace}</span>
            <span className="nav-section-badge">{t.trainingWorkspaceBadge}</span>
          </div>
          <ul className="nav-list">
            {trainingNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeWorkspace === 'training' && currentView === item.id;
              return (
                <li key={item.id}>
                  <button
                    className={`nav-item-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id, 'training')}
                  >
                    <Icon className="nav-item-icon" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Workspace 2: Inference Section */}
        <div>
          <div className="nav-section-title">
            <span>🚀 {t.inferenceWorkspace}</span>
            <span className="nav-section-badge" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)' }}>
              {t.inferenceWorkspaceBadge}
            </span>
          </div>
          <ul className="nav-list">
            {inferenceNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeWorkspace === 'inference' && currentView === item.id;
              return (
                <li key={item.id}>
                  <button
                    className={`nav-item-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id, 'inference')}
                  >
                    <Icon className="nav-item-icon" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Footer / System Settings */}
      <div className="sidebar-footer">
        <button
          className={`nav-item-btn ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentView('settings')}
        >
          <Settings className="nav-item-icon" />
          <span>{t.navSettings}</span>
        </button>
      </div>
    </aside>
  );
};
