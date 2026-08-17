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
    systemHealth
  } = useProject();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Welcome / Hero Banner */}
      <div
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(235, 126, 131, 0.14) 0%, rgba(225, 153, 138, 0.1) 50%, rgba(85, 123, 134, 0.12) 100%)',
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
              本地 No-Code AI 影像模型訓練與推論平台
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.6rem', lineHeight: '1.2' }}>
            {activeProject ? (
              <>當前專案：<span style={{ color: '#EB7E83' }}>{activeProject.name}</span></>
            ) : (
              <>鍛造屬於你的專屬 <span style={{ color: '#E1998A' }}>AI 視覺模型</span></>
            )}
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            {activeProject
              ? activeProject.description || '零程式碼匯入資料、影像標註、GPU 加速訓練與一鍵匯出 ONNX 模型。'
              : '透過直覺的圖形化介面，輕鬆完成資料集管理、模型訓練與即時推論。'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              icon={<FolderPlus size={16} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              建立新專案
            </Button>
            {activeProject && (
              <Button
                variant="secondary"
                icon={<ArrowRight size={16} />}
                onClick={() => setCurrentView('dataset')}
              >
                前往資料集管理
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* System & Workspace Overview Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>總專案數量</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(235, 126, 131, 0.16)', color: '#EB7E83', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderGit2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{projects.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            本地 SQLite 儲存庫
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>算力裝置</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(103, 163, 144, 0.16)', color: '#67a390', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: systemHealth?.gpu.available ? '#67a390' : 'var(--text-primary)' }}>
            {systemHealth?.gpu.available ? systemHealth.gpu.device : 'CPU 運算模式'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {systemHealth?.gpu.available ? '🟢 CUDA 加速已啟用' : '🟡 未偵測到 GPU，將使用 CPU'}
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>架構雙模式</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(85, 123, 134, 0.18)', color: '#557B86', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Boxes size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>訓練 + 獨立推論</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            支援 WebSocket / MQTT API
          </div>
        </Card>
      </div>

      {/* Projects Grid Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>所有專案清單</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              點選即可將專案切換為當前工作目標
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<FolderPlus size={14} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            建立專案
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
                目前尚無任何專案
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>
                立即建立您的第一個 AI 專案，開始匯入圖片或啟動攝影機進行訓練！
              </p>
            </div>
            <Button
              variant="primary"
              icon={<FolderPlus size={16} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              建立第一個專案
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
