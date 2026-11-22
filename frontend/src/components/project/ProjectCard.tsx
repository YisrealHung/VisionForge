import React, { useState } from 'react';
import { Trash2, ArrowRight, Images, Boxes, Calendar } from 'lucide-react';
import { Project } from '../../types';
import { TaskBadge } from '../common/Badge';
import { useProject } from '../../context/ProjectContext';

interface ProjectCardProps {
  project: Project;
  isActive: boolean;
  onActivate: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isActive,
  onActivate,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { language } = useProject();
  const isZh = language === 'zh-TW';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onActivate(project.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate(project.id);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="glass-card"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        cursor: 'pointer',
        border: isActive
          ? '1.5px solid var(--accent-primary)'
          : isHovered
          ? '1px solid var(--border-strong)'
          : '1px solid var(--border-card)',
        background: 'var(--bg-surface)',
        transition: 'border-color var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out)',
        outline: 'none',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <TaskBadge taskType={project.task_type} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isActive && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: 'var(--accent-primary)',
                  fontWeight: 500,
                }}
              >
                <span className="vf-status-dot online" aria-hidden="true" />
                {isZh ? '使用中' : 'Active'}
              </span>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ width: '28px', height: '28px', padding: 0, color: 'var(--text-muted)' }}
              title={isZh ? '刪除專案' : 'Delete project'}
              aria-label={isZh ? `刪除專案 ${project.name}` : `Delete project ${project.name}`}
              onClick={(e) => {
                e.stopPropagation();
                const msg = isZh
                  ? `確定要刪除專案「${project.name}」嗎？所有資料集與模型將一併移除。`
                  : `Delete project "${project.name}"? All datasets and models will be removed.`;
                if (confirm(msg)) {
                  onDelete(project.id);
                }
              }}
            >
              <Trash2 size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <h3
          style={{
            fontSize: '16px',
            fontWeight: 500,
            marginBottom: '6px',
            color: 'var(--text-primary)',
          }}
        >
          {project.name}
        </h3>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            minHeight: '38px',
            marginBottom: '16px',
            lineHeight: 1.45,
          }}
        >
          {project.description || (isZh ? '無描述資訊' : 'No description')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Images size={14} strokeWidth={1.5} aria-hidden="true" />
              <span>{isZh ? '圖片數量' : 'Images'}</span>
            </div>
            <div className="vf-num" style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)' }}>
              {project.dataset_count.toLocaleString()}
            </div>
          </div>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Boxes size={14} strokeWidth={1.5} aria-hidden="true" />
              <span>{isZh ? '模型數量' : 'Models'}</span>
            </div>
            <div className="vf-num" style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)' }}>
              {project.model_count.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="vf-num" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <Calendar size={14} strokeWidth={1.5} aria-hidden="true" />
          <span>{project.created_at.split(' ')[0]}</span>
        </div>
        {isActive ? (
          <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 500 }}>
            {isZh ? '目前專案' : 'Selected'}
          </span>
        ) : (
          <span
            style={{
              fontSize: '12px',
              color: isHovered ? 'var(--accent-primary)' : 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'color var(--dur-fast) var(--ease-out)',
            }}
          >
            <span>{isZh ? '切換至此專案' : 'Switch project'}</span>
            <ArrowRight size={13} strokeWidth={1.5} aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );
};
