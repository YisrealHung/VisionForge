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
  Sun,
  Palette
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
    t
  } = useProject();

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

  const currentThemeDef = THEME_REGISTRY.find((t) => t.id === theme) || THEME_REGISTRY[0];
  const isOnline = systemHealth?.status === 'online';

  return (
    <header className="app-header">
      <div className="header-left">
        {/* Project Selector Dropdown */}
        <div className="project-selector-dropdown" ref={dropdownRef}>
          <button
            className="project-selector-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title={t.switchProject}
          >
            <FolderGit2 size={16} color="var(--accent-primary)" />
            <span className="header-project-name">
              {activeProject ? activeProject.name : t.selectOrCreateProject}
            </span>
            {activeProject && <span className="header-task-badge"><TaskBadge taskType={activeProject.task_type} /></span>}
            <ChevronDown size={14} color="var(--text-muted)" />
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
                {t.switchProject} ({projects.length})
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {projects.length === 0 ? (
                  <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {t.noProjectsFound}
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
                        background: activeProject?.id === p.id ? 'var(--accent-primary-glow)' : 'transparent',
                        color: activeProject?.id === p.id ? 'var(--accent-primary)' : 'var(--text-primary)',
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
                  {t.createNewProject}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* Quick Theme Selector Dropdown */}
        <div style={{ position: 'relative' }} ref={themeDropdownRef}>
          <button
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            title={`${t.themeSelector}：${language === 'zh-TW' ? currentThemeDef.name : currentThemeDef.nameEn}`}
            aria-label={`${t.themeSelector}：${language === 'zh-TW' ? currentThemeDef.name : currentThemeDef.nameEn}`}
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-primary)',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-card)'; }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: currentThemeDef.accentSample,
                boxShadow: `0 0 6px ${currentThemeDef.accentSample}`,
              }}
            />
            {currentThemeDef.mode === 'dark' ? (
              <Moon size={13} color="var(--accent-primary)" />
            ) : (
              <Sun size={13} color="var(--accent-primary)" />
            )}
            <span className="header-label" style={{ fontSize: '0.78rem' }}>{language === 'zh-TW' ? currentThemeDef.name : currentThemeDef.nameEn}</span>
            <ChevronDown size={13} style={{ opacity: 0.6, transform: themeDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </button>

          {themeDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '280px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '0.5rem',
                zIndex: 100,
                animation: 'scaleIn 0.15s ease forwards',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div
                style={{
                  padding: '4px 8px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{t.themeSelector}</span>
                <span style={{ fontSize: '0.65rem' }}>{THEME_REGISTRY.length} {t.themeCountLabel}</span>
              </div>

              <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {THEME_REGISTRY.map((tItem) => {
                  const isCur = theme === tItem.id;
                  return (
                    <div
                      key={tItem.id}
                      onClick={() => {
                        setTheme(tItem.id);
                        setThemeDropdownOpen(false);
                      }}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-xs)',
                        background: isCur ? 'var(--accent-primary-glow)' : 'transparent',
                        border: `1px solid ${isCur ? 'var(--border-highlight)' : 'transparent'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        transition: 'all 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isCur) e.currentTarget.style.background = 'var(--bg-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isCur) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {tItem.palette.slice(0, 3).map((c, i) => (
                            <div
                              key={i}
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: c,
                                border: '1px solid rgba(128, 128, 128, 0.35)',
                              }}
                            />
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: isCur ? 700 : 500, color: 'var(--text-primary)' }}>
                            {language === 'zh-TW' ? tItem.name : tItem.nameEn}
                          </div>
                          <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                            {language === 'zh-TW' ? tItem.nameEn : tItem.name} · {tItem.mode === 'dark' ? (language === 'zh-TW' ? '深色' : 'Dark') : (language === 'zh-TW' ? '淺色' : 'Light')}
                          </div>
                        </div>
                      </div>

                      {isCur && <Check size={14} color="var(--accent-primary)" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* System Health / GPU Indicator */}
        <div className="system-status-indicator" title={isOnline ? `Python: ${systemHealth?.python_version} | ${systemHealth?.platform}` : t.offline}>
          <div className={`project-status-dot ${!isOnline ? 'offline' : ''}`} />
          <Server size={13} />
          <span className="header-label">{isOnline ? t.online : t.offline}</span>
          {isOnline && systemHealth?.gpu.available && (
            <span className="header-gpu" style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '6px', color: 'var(--accent-emerald)' }}>
              <Cpu size={13} />
              <span className="header-label">{systemHealth.gpu.device.replace('NVIDIA GeForce ', '')}</span>
            </span>
          )}
        </div>

        {/* Create Project Button */}
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={15} />}
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
