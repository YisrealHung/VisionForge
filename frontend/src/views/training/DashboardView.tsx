import React from 'react';
import { FolderPlus, LayoutDashboard } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ProjectCard } from '../../components/project/ProjectCard';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { TaskBadge } from '../../components/common/Badge';
import { NextStepPanel } from '../../components/project/NextStepPanel';

export const DashboardView: React.FC = () => {
  const {
    projects,
    activeProject,
    activateProject,
    deleteProject,
    setIsCreateModalOpen,
    systemHealth,
    language,
    t,
  } = useProject();

  const isZh = language === 'zh-TW';
  const totalImages = projects.reduce((sum, p) => sum + (p.dataset_count || 0), 0);
  const totalModels = projects.reduce((sum, p) => sum + (p.model_count || 0), 0);
  const gpuAvailable = Boolean(systemHealth?.gpu.available);
  const computeName = gpuAvailable
    ? systemHealth!.gpu.device.replace('NVIDIA GeForce ', '')
    : 'CPU';

  return (
    <div className="vf-container">
      {activeProject ? (
        <>
          <div className="vf-page-header">
            <div className="vf-page-heading">
              <div className="vf-page-eyebrow">
                <LayoutDashboard size={14} strokeWidth={1.5} aria-hidden="true" />
                <span>{t.navDashboard}</span>
              </div>
              <div className="vf-page-title-row">
                <h1 className="vf-page-title">{activeProject.name}</h1>
                <TaskBadge taskType={activeProject.task_type} />
              </div>
            </div>
            <div className="vf-page-actions">
              <Button
                variant="primary"
                icon={<FolderPlus size={16} strokeWidth={1.5} />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                {t.dashboardBtnNewProject}
              </Button>
            </div>
          </div>

          <NextStepPanel project={activeProject} />
        </>
      ) : (
        <section className="vf-next-step vf-reticle" aria-label={isZh ? '開始使用' : 'Get started'}>
          <div className="vf-next-step-body">
            <span className="vf-next-step-pill">{t.brandTagline}</span>
            <h1 className="vf-next-step-title">{t.dashboardHeroTitleDefault}</h1>
            <p className="vf-next-step-sub">{t.dashboardHeroSubtitleDefault}</p>
          </div>
          <button
            type="button"
            className="vf-next-step-cta"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <FolderPlus size={16} strokeWidth={1.5} aria-hidden="true" />
            {t.dashboardBtnNewProject}
          </button>
        </section>
      )}

      {/* Workspace Statistics (4 real metrics, numbers only) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <Card>
          <div className="vf-stat-label">{t.dashboardStatsTotalProjects}</div>
          <div className="vf-stat-value vf-num">{projects.length.toLocaleString()}</div>
          <div className="vf-stat-sub">
            {isZh ? '本機 SQLite 儲存庫' : 'Local SQLite storage'}
          </div>
        </Card>

        <Card>
          <div className="vf-stat-label">{t.dashboardStatsTotalImages}</div>
          <div className="vf-stat-value vf-num">{totalImages.toLocaleString()}</div>
          <div className="vf-stat-sub">
            {isZh ? '所有專案合計' : 'Across all projects'}
          </div>
        </Card>

        <Card>
          <div className="vf-stat-label">{t.dashboardStatsActiveModels}</div>
          <div className="vf-stat-value vf-num">{totalModels.toLocaleString()}</div>
          <div className="vf-stat-sub">
            {isZh ? '已完成訓練檢查點' : 'Trained checkpoints'}
          </div>
        </Card>

        <Card>
          <div className="vf-stat-label">{t.dashboardStatsGpuStatus}</div>
          <div
            className="vf-stat-value vf-num"
            style={{ fontSize: '20px', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={computeName}
          >
            {computeName}
          </div>
          <div className="vf-stat-sub">
            <span className={`vf-status-dot ${gpuAvailable ? 'online' : 'warning'}`} aria-hidden="true" />
            <span>{gpuAvailable ? (isZh ? 'CUDA 加速可用' : 'CUDA acceleration') : (isZh ? 'CPU 運算模式' : 'CPU compute mode')}</span>
          </div>
        </Card>
      </div>

      {/* Projects Grid */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 500 }}>{t.dashboardProjectsTitle}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isZh ? '點選專案卡片可切換為目前工作目標' : 'Select a project card to set it as active'}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<FolderPlus size={14} strokeWidth={1.5} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            {t.dashboardBtnNewProject}
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderPlus size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>
                {t.dashboardNoProjects}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px' }}>
                {t.dashboardCreateFirstPrompt}
              </p>
            </div>
            <Button
              variant="primary"
              icon={<FolderPlus size={16} strokeWidth={1.5} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              {t.dashboardBtnNewProject}
            </Button>
          </Card>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
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
      </section>
    </div>
  );
};
