import React, { useState, useRef, useEffect } from 'react';
import { 
  FolderGit2, 
  Plus, 
  ChevronDown, 
  Check, 
  Cpu, 
  Sparkles,
  Server,
  Moon,
  Sun
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Button } from '../common/Button';
import { TaskBadge } from '../common/Badge';

export const Header: React.FC = () => {
  const { 
    activeProject, 
    projects, 
    activateProject, 
    setIsCreateModalOpen,
    systemHealth,
    theme,
    setTheme
  } = useProject();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOnline = systemHealth?.status === 'online';

  return (
    <header className="app-header">
      <div className="header-left">
        {/* Project Selector Dropdown */}
        <div className="project-selector-dropdown" ref={dropdownRef}>
          <button
            className="project-selector-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="點擊切換專案"
          >
            <FolderGit2 size={16} color="#EB7E83" />
            <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeProject ? activeProject.name : '選擇或建立專案'}
            </span>
            {activeProject && <TaskBadge taskType={activeProject.task_type} />}
            <ChevronDown size={14} color="#96878e" />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: '320px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '0.5rem',
                zIndex: 50,
                animation: 'scaleIn 0.15s ease'
              }}
            >
              <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                切換專案 ({projects.length})
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {projects.length === 0 ? (
                  <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    尚無專案，請先建立新專案
                  </div>
                ) : (
                  projects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        activateProject(p.id);
                        setDropdownOpen(false);
                      }}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: activeProject?.id === p.id ? 'rgba(235, 126, 131, 0.15)' : 'transparent',
                        color: activeProject?.id === p.id ? '#EB7E83' : 'var(--text-primary)',
                        marginBottom: '2px',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        if (activeProject?.id !== p.id) e.currentTarget.style.background = 'var(--bg-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (activeProject?.id !== p.id) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          更新於 {p.updated_at.split(' ')[0]}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TaskBadge taskType={p.task_type} />
                        {activeProject?.id === p.id && <Check size={14} color="#818cf8" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  icon={<Plus size={14} />}
                  onClick={() => {
                    setDropdownOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                >
                  建立新專案
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* Quick Theme Toggle Button */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? '切換為溫潤燕麥亮色風格' : '切換為煙燻暖岩暗色風格'}
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-card)',
            color: 'var(--text-primary)',
            padding: '0.45rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.8rem',
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-card)'; }}
        >
          {theme === 'dark' ? <Sun size={14} color="#E1998A" /> : <Moon size={14} color="#EB7E83" />}
          <span style={{ fontSize: '0.75rem' }}>{theme === 'dark' ? '亮色' : '暗色'}</span>
        </button>

        {/* System Health / GPU Indicator */}
        <div className="system-status-indicator" title={isOnline ? `Python: ${systemHealth?.python_version} | ${systemHealth?.platform}` : '後端服務未啟動'}>
          <div className={`project-status-dot ${!isOnline ? 'offline' : ''}`} />
          <Server size={13} />
          <span>{isOnline ? '後端已連線' : '後端離線'}</span>
          {isOnline && systemHealth?.gpu.available && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '6px', color: '#67a390' }}>
              <Cpu size={13} />
              <span>{systemHealth.gpu.device.replace('NVIDIA GeForce ', '')}</span>
            </span>
          )}
        </div>

        {/* Create Project Button */}
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={15} />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          新增專案
        </Button>
      </div>
    </header>
  );
};
