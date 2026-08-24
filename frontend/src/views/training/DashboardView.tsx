import React from 'react';
import {
  FolderPlus,
  FolderGit2,
  Sparkles,
  Layers,
  Cpu,
  ArrowRight,
  TrendingUp,
  Boxes
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ProjectCard } from '../../components/project/ProjectCard';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

export const DashboardView: React.FC = () => {
  const {
    projects,
    activeProject,
    activateProject,
    deleteProject,
    setIsCreateModalOpen,
    setCurrentView,
    systemHealth,
    language,
    t
  } = useProject();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Welcome / Hero Banner */}
      <div
        className="glass-card"
        style={{
          background: 'var(--gradient-brand-subtle)',
          border: '1px solid var(--border-highlight)',
          position: 'relative',
          overflow: 'hidden',
          padding: '2rem'
        }}
      >
        <div style={{ maxWidth: '640px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <span className="badge badge-indigo">
              <Sparkles size={13} /> VisionForge v1.0
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t.platformSubtitle}
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.6rem', lineHeight: '1.2' }}>
            {activeProject ? (
              <>{t.dashboardHeroCurrentProject}<span style={{ color: 'var(--accent-primary)' }}>{activeProject.name}</span></>
            ) : (
              <>{language === 'zh-TW' ? '鍛造屬於你的專屬 ' : 'Forge Your Custom '}<span style={{ color: 'var(--accent-primary)' }}>{language === 'zh-TW' ? 'AI 視覺模型' : 'AI Vision Models'}</span></>
            )}
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            {activeProject
              ? activeProject.description || t.dashboardHeroCurrentDesc
              : t.dashboardHeroSubtitleDefault}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              icon={<FolderPlus size={16} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              {t.dashboardBtnNewProject}
            </Button>
            {activeProject && (
              <Button
                variant="secondary"
                icon={<ArrowRight size={16} />}
                onClick={() => setCurrentView('dataset')}
              >
                {t.dashboardBtnGoDataset}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* System & Workspace Overview Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.dashboardStatsTotalProjects}</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderGit2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{projects.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {language === 'zh-TW' ? '本地 SQLite 儲存庫' : 'Local SQLite Storage'}
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.dashboardStatsGpuStatus}</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: systemHealth?.gpu.available ? '#10b981' : 'var(--text-primary)' }}>
            {systemHealth?.gpu.available ? systemHealth.gpu.device : (language === 'zh-TW' ? 'CPU 運算模式' : 'CPU Mode')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {systemHealth?.gpu.available ? (language === 'zh-TW' ? '🟢 CUDA 加速已啟用' : '🟢 CUDA Accelerated') : (language === 'zh-TW' ? '🟡 未偵測到 GPU，將使用 CPU' : '🟡 CPU compute mode')}
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{language === 'zh-TW' ? '架構雙模式' : 'Workspace Mode'}</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Boxes size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{language === 'zh-TW' ? '訓練 + 獨立推論' : 'Train & Inference'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {language === 'zh-TW' ? '支援 WebSocket / REST API' : 'REST & WebSocket API'}
          </div>
        </Card>
      </div>

      {/* Projects Grid Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t.dashboardProjectsTitle}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {language === 'zh-TW' ? '點選即可將專案切換為當前工作目標' : 'Click to select project as current working target'}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<FolderPlus size={14} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            {t.dashboardBtnNewProject}
          </Button>
        </div>

        {projects.length === 0 ? (
          <div
            className="glass-card"
            style={{
              padding: '3.5rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderPlus size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {t.dashboardNoProjects}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>
                {t.dashboardCreateFirstPrompt}
              </p>
            </div>
            <Button
              variant="primary"
              icon={<FolderPlus size={16} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              {t.dashboardBtnNewProject}
            </Button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isActive={activeProject?.id === project.id}
                onActivate={activateProject}
                onDelete={deleteProject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
