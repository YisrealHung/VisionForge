import React, { useState, useRef, useEffect } from 'react';
import {
  FolderGit2,
  Plus,
  ChevronDown,
  Check,
  Cpu,
  Server,
  Moon,
  Sun,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Button } from '../common/Button';
import { TaskBadge } from '../common/Badge';
import { THEME_REGISTRY } from '../../types';

export const Header: React.FC = () => {
  const {
    activeProject,
    projects,
    activateProject,
    setIsCreateModalOpen,
    systemHealth,
    theme,
    setTheme,
    language,
    t,
  } = useProject();

  const isZh = language === 'zh-TW';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentThemeDef = THEME_REGISTRY.find((item) => item.id === theme) || THEME_REGISTRY[0];
  const isOnline = systemHealth?.status === 'online';

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="project-selector-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="project-selector-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title={t.switchProject}
          >
            <FolderGit2 size={16} strokeWidth={1.5} color="var(--text-secondary)" aria-hidden="true" />
            <span className="header-project-name">
              {activeProject ? activeProject.name : t.selectOrCreateProject}
            </span>
            {activeProject && (
              <span className="header-task-badge">
                <TaskBadge taskType={activeProject.task_type} />
              </span>
            )}
            <ChevronDown size={14} strokeWidth={1.5} color="var(--text-muted)" aria-hidden="true" />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: '320px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '8px',
                zIndex: 50,
                animation: 'enterUp var(--dur-fast) var(--ease-out) forwards',
              }}
            >
              <div
                style={{
                  padding: '6px 8px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}
              >
                {t.switchProject} (<span className="vf-num">{projects.length}</span>)
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {projects.length === 0 ? (
                  <div style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {t.noProjectsFound}
                  </div>
                ) : (
                  projects.map((p) => {
                    const isSelected = activeProject?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          activateProject(p.id);
                          setDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          border: 'none',
                          background: isSelected ? 'var(--accent-primary-soft)' : 'transparent',
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                          transition: 'background-color var(--dur-fast) var(--ease-out)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'var(--bg-surface-elevated)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                          <span style={{ fontWeight: 500, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </span>
                          <span className="vf-num" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {isZh ? '更新於' : 'Updated'} {p.updated_at.split(' ')[0]}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <TaskBadge taskType={p.task_type} />
                          {isSelected && <Check size={14} strokeWidth={1.75} color="var(--accent-primary)" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '8px', paddingTop: '8px' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  icon={<Plus size={14} strokeWidth={1.5} />}
                  onClick={() => {
                    setDropdownOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                >
                  {t.createNewProject}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        <div style={{ position: 'relative' }} ref={themeDropdownRef}>
          <button
            type="button"
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            title={`${t.themeSelector}: ${isZh ? currentThemeDef.name : currentThemeDef.nameEn}`}
            aria-label={`${t.themeSelector}: ${isZh ? currentThemeDef.name : currentThemeDef.nameEn}`}
            style={{
              height: '32px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              padding: '0 10px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'border-color var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: currentThemeDef.accentSample,
                flexShrink: 0,
              }}
            />
            {currentThemeDef.mode === 'dark' ? (
              <Moon size={14} strokeWidth={1.5} color="var(--text-secondary)" aria-hidden="true" />
            ) : (
              <Sun size={14} strokeWidth={1.5} color="var(--text-secondary)" aria-hidden="true" />
            )}
            <span className="header-label">{isZh ? currentThemeDef.name : currentThemeDef.nameEn}</span>
            <ChevronDown
              size={14}
              strokeWidth={1.5}
              color="var(--text-muted)"
              style={{
                transform: themeDropdownOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform var(--dur-fast) var(--ease-out)',
              }}
              aria-hidden="true"
            />
          </button>

          {themeDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '272px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '8px',
                zIndex: 100,
                animation: 'enterUp var(--dur-fast) var(--ease-out) forwards',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div
                style={{
                  padding: '4px 8px 8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{t.themeSelector}</span>
                <span className="vf-num">{THEME_REGISTRY.length} {t.themeCountLabel}</span>
              </div>

              <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {THEME_REGISTRY.map((tItem) => {
                  const isCur = theme === tItem.id;
                  return (
                    <button
                      key={tItem.id}
                      type="button"
                      onClick={() => {
                        setTheme(tItem.id);
                        setThemeDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        background: isCur ? 'var(--accent-primary-soft)' : 'transparent',
                        border: `1px solid ${isCur ? 'var(--accent-primary-border)' : 'transparent'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        transition: 'background-color var(--dur-fast) var(--ease-out)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isCur) e.currentTarget.style.background = 'var(--bg-surface-elevated)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isCur) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {tItem.palette.slice(0, 3).map((c, i) => (
                            <span
                              key={i}
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: c,
                                border: '1px solid var(--border-strong)',
                              }}
                            />
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: isCur ? 500 : 400, color: 'var(--text-primary)' }}>
                            {isZh ? tItem.name : tItem.nameEn}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {isZh ? tItem.nameEn : tItem.name} · {tItem.mode === 'dark' ? (isZh ? '深色' : 'Dark') : (isZh ? '淺色' : 'Light')}
                          </div>
                        </div>
                      </div>

                      {isCur && <Check size={14} strokeWidth={1.75} color="var(--accent-primary)" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          className="system-status-indicator"
          title={isOnline ? `Python: ${systemHealth?.python_version} | ${systemHealth?.platform}` : t.offline}
        >
          <span className={`vf-status-dot ${isOnline ? 'online' : 'offline'}`} aria-hidden="true" />
          <Server size={14} strokeWidth={1.5} color="var(--text-muted)" aria-hidden="true" />
          <span className="header-label">{isOnline ? t.online : t.offline}</span>
          {isOnline && systemHealth?.gpu.available && (
            <span className="header-gpu" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '6px', color: 'var(--text-primary)' }}>
              <Cpu size={14} strokeWidth={1.5} color="var(--text-muted)" aria-hidden="true" />
              <span className="header-label">{systemHealth.gpu.device.replace('NVIDIA GeForce ', '')}</span>
            </span>
          )}
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={15} strokeWidth={1.5} />}
          onClick={() => setIsCreateModalOpen(true)}
          aria-label={t.createNewProject}
          title={t.createNewProject}
        >
          <span className="header-label">{t.createNewProject}</span>
        </Button>
      </div>
    </header>
  );
};
