import React, { useState } from 'react';
import { 
  Trash2, 
  ArrowRight, 
  Images, 
  Boxes, 
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { Project } from '../../types';
import { TaskBadge } from '../common/Badge';

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
      className={`glass-card ${isActive ? 'active-card' : ''}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        cursor: 'pointer',
        border: isActive
          ? '2px solid var(--accent-primary)'
          : isHovered
          ? '1.5px solid var(--border-highlight)'
          : '1px solid var(--border-card)',
        boxShadow: isActive
          ? 'var(--shadow-glow), 0 0 0 1px var(--accent-primary)'
          : isHovered
          ? 'var(--shadow-md)'
          : 'var(--shadow-sm)',
        background: 'var(--bg-glass-card)',
        transform: !isActive && isHovered ? 'translateY(-2px)' : 'none',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
      }}
    >
      <div>
        {/* Top bar with TaskBadge and active indicator / delete button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <TaskBadge taskType={project.task_type} />
          {isActive ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
              <CheckCircle2 size={14} color="var(--accent-primary)" /> 當前啟用中
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--text-muted)', padding: '4px' }}
              title="刪除專案"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`確定要刪除專案「${project.name}」嗎？所有資料集與模型將一併移除。`)) {
                  onDelete(project.id);
                }
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Project Name & Description */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem', color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
          {project.name}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minHeight: '2.4em', marginBottom: '1.25rem', lineHeight: '1.4' }}>
          {project.description || '無描述資訊'}
        </p>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
              <Images size={13} /> 圖片數量
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {project.dataset_count}
            </div>
          </div>
          <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
              <Boxes size={13} /> 模型數量
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {project.model_count}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Calendar size={13} /> {project.created_at.split(' ')[0]}
        </div>
        {isActive ? (
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            ● 操作中
          </span>
        ) : (
          <span style={{ fontSize: '0.75rem', color: isHovered ? 'var(--accent-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.15s' }}>
            點擊切換 <ArrowRight size={12} />
          </span>
        )}
      </div>
    </div>
  );
};
