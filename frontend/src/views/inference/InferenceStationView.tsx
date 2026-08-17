import React, { useState, useEffect } from 'react';
import {
  ScanEye,
  Video,
  Radio,
  Cpu,
  BellRing,
  Crop,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Boxes
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { TriggerRule, TriggerEvent, CategoryItem, TrainedModelInfo } from '../../types';
import { api } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { CameraInferenceCanvas } from '../../components/inference/CameraInferenceCanvas';
import { TriggerRulePanel } from '../../components/inference/TriggerRulePanel';
import { CodeSnippetGenerator } from '../../components/inference/CodeSnippetGenerator';

export const InferenceStationView: React.FC = () => {
  const { activeProject, setCurrentView, projects, activateProject } = useProject();
  const [categories, setCategories] = useState<string[]>(['貓', '狗', '鳥']);
  const [trainedModels, setTrainedModels] = useState<TrainedModelInfo[]>([]);
  const [selectedArchitecture, setSelectedArchitecture] = useState<string>('');
  const [rules, setRules] = useState<TriggerRule[]>([
    { id: 'rule_1', class_name: '全部類別', min_confidence: 40, enabled: true, action_type: 'alert' },
  ]);
  const [events, setEvents] = useState<TriggerEvent[]>([]);

  useEffect(() => {
    if (activeProject) {
      // 1. Fetch categories
      api.getCategories(activeProject.id).then((cats) => {
        if (cats.length > 0) {
          const names = cats.map((c) => c.name);
          setCategories(names);
          setRules([
            { id: 'rule_1', class_name: names[0] || '全部類別', min_confidence: 40, enabled: true, action_type: 'alert' },
          ]);
        }
      }).catch(() => { });

      // 2. Fetch distinct trained models list
      api.getTrainedModels(activeProject.id).then((models) => {
        setTrainedModels(models);
        if (models.length > 0) {
          const latest = models.find((m) => m.is_latest) || models[0];
          setSelectedArchitecture(latest.architecture);
        } else {
          setSelectedArchitecture('');
        }
      }).catch(() => {
        setTrainedModels([]);
        setSelectedArchitecture('');
      });
    }
  }, [activeProject]);

  const handleAddRule = (newRule: TriggerRule) => {
    setRules((prev) => [...prev, newRule]);
  };

  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  const handleTriggerEvent = (event: TriggerEvent) => {
    setEvents((prev) => [event, ...prev.slice(0, 49)]); // Keep last 50 events
  };

  if (!activeProject) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>請先在頂部選單選擇或建立一個專案</p>
      </div>
    );
  }

  const currentModelInfo = trainedModels.find((m) => m.architecture === selectedArchitecture);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>🚀 獨立推論工作站</h1>
            {currentModelInfo ? (
              <span className="badge badge-indigo" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={12} /> {currentModelInfo.name} · {currentModelInfo.best_val_acc}%
              </span>
            ) : (
              <span className="badge badge-cyan">即時推論引擎</span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            多模型隨選推論 · 關注區域 (ROI) 裁剪 · 條件觸發規則 · 多語言 API 串接
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Trained Model Selector Dropdown */}
          {trainedModels.length > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'var(--bg-surface-elevated)', 
              padding: '6px 12px', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--border-card)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <Boxes size={15} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>切換推論模型:</span>
              <select
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                value={selectedArchitecture}
                onChange={(e) => setSelectedArchitecture(e.target.value)}
              >
                {trainedModels.map((m) => (
                  <option 
                    key={m.architecture} 
                    value={m.architecture} 
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  >
                    {m.name} ({m.best_val_acc}%){m.is_latest ? ' ★最新' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Project Switcher */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'var(--bg-surface-elevated)', 
            padding: '6px 12px', 
            borderRadius: 'var(--radius-sm)', 
            border: '1px solid var(--border-card)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Cpu size={14} color="var(--accent-teal)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>專案:</span>
            <select
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              value={activeProject.id}
              onChange={(e) => {
                activateProject(e.target.value);
              }}
            >
              {projects.map((p) => (
                <option 
                  key={p.id} 
                  value={p.id} 
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                >
                  {p.name} ({p.task_type})
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            icon={<ArrowRight size={15} />}
            onClick={() => setCurrentView('api_server')}
          >
            前往推論 API 伺服器
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Canvas vs Right Rules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left: Camera Inference & ROI Canvas */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={18} color="#06b6d4" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>即時視覺串流與 ROI 監控</h3>
            </div>
          </div>
          <CameraInferenceCanvas
            projectId={activeProject.id}
            architecture={selectedArchitecture}
            triggerRules={rules}
            onTriggerEvent={handleTriggerEvent}
          />
        </Card>

        {/* Right: Trigger Rules Panel */}
        <Card>
          <TriggerRulePanel
            rules={rules}
            events={events}
            availableCategories={categories}
            onAddRule={handleAddRule}
            onToggleRule={handleToggleRule}
            onDeleteRule={handleDeleteRule}
            onClearEvents={() => setEvents([])}
          />
        </Card>
      </div>

      {/* Bottom: Multi-Language Code Snippet Generator */}
      <CodeSnippetGenerator projectId={activeProject.id} />
    </div>
  );
};
