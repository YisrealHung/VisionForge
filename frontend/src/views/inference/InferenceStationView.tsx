import React, { useState, useEffect } from 'react';
import { ScanEye, Video, Cpu, ArrowRight, Boxes } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { TriggerRule, TriggerEvent, TrainedModelInfo, ALL_CLASSES } from '../../types';
import { api } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { TaskBadge } from '../../components/common/Badge';
import { CameraInferenceCanvas } from '../../components/inference/CameraInferenceCanvas';
import { TriggerRulePanel } from '../../components/inference/TriggerRulePanel';
import { CodeSnippetGenerator } from '../../components/inference/CodeSnippetGenerator';

export const InferenceStationView: React.FC = () => {
  const { activeProject, setCurrentView, projects, activateProject, language } = useProject();
  const isZh = language === 'zh-TW';
  const [categories, setCategories] = useState<string[]>([isZh ? '貓' : 'Cat', isZh ? '狗' : 'Dog', isZh ? '鳥' : 'Bird']);
  const [trainedModels, setTrainedModels] = useState<TrainedModelInfo[]>([]);
  const [selectedArchitecture, setSelectedArchitecture] = useState<string>('');
  const [rules, setRules] = useState<TriggerRule[]>([
    { id: 'rule_1', class_name: ALL_CLASSES, min_confidence: 40, enabled: true, action_type: 'alert' },
  ]);
  const [events, setEvents] = useState<TriggerEvent[]>([]);

  useEffect(() => {
    if (activeProject) {
      api
        .getCategories(activeProject.id)
        .then((cats) => {
          if (cats.length > 0) {
            const names = cats.map((c) => c.name);
            setCategories(names);
            setRules([
              { id: 'rule_1', class_name: names[0] || ALL_CLASSES, min_confidence: 40, enabled: true, action_type: 'alert' },
            ]);
          }
        })
        .catch(() => {});

      api
        .getTrainedModels(activeProject.id)
        .then((models) => {
          setTrainedModels(models);
          if (models.length > 0) {
            const latest = models.find((m) => m.is_latest) || models[0];
            setSelectedArchitecture(latest.architecture);
          } else {
            setSelectedArchitecture('');
          }
        })
        .catch(() => {
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
    setEvents((prev) => [event, ...prev.slice(0, 49)]);
  };

  if (!activeProject) {
    return (
      <div className="vf-container">
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            {isZh ? '請先在頂部選單選擇或建立專案' : 'Select or create a project from the header first'}
          </p>
        </Card>
      </div>
    );
  }

  const currentModelInfo = trainedModels.find((m) => m.architecture === selectedArchitecture);

  return (
    <div className="vf-container">
      <div className="vf-page-header">
        <div className="vf-page-heading">
          <div className="vf-page-eyebrow">
            <ScanEye size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>{isZh ? '推論工作站' : 'Inference station'}</span>
            <TaskBadge taskType={activeProject.task_type} />
          </div>
          <div className="vf-page-title-row">
            <h1 className="vf-page-title">{activeProject.name}</h1>
            {currentModelInfo ? (
              <span className="badge badge-indigo">
                <Cpu size={12} strokeWidth={1.5} /> {currentModelInfo.name} · {currentModelInfo.best_val_acc}%
              </span>
            ) : (
              <span className="badge badge-neutral">{isZh ? '即時推論' : 'Live inference'}</span>
            )}
          </div>
        </div>

        <div className="vf-page-actions">
          {trainedModels.length > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                height: '36px',
                background: 'var(--bg-surface)',
                padding: '0 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
              }}
            >
              <Boxes size={14} strokeWidth={1.5} color="var(--text-secondary)" />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {isZh ? '模型' : 'Model'}
              </span>
              <select
                className="vf-num"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  outline: 'none',
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
                    {m.name} ({m.best_val_acc}%){m.is_latest ? (isZh ? ' · 最新' : ' · Latest') : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              height: '36px',
              background: 'var(--bg-surface)',
              padding: '0 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-strong)',
            }}
          >
            <Cpu size={14} strokeWidth={1.5} color="var(--text-secondary)" />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {isZh ? '專案' : 'Project'}
            </span>
            <select
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                outline: 'none',
              }}
              value={activeProject.id}
              onChange={(e) => activateProject(e.target.value)}
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
            size="sm"
            icon={<ArrowRight size={15} strokeWidth={1.5} />}
            onClick={() => setCurrentView('api_server')}
          >
            {isZh ? '推論 API 伺服器' : 'API server'}
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Canvas vs Right Rules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Video size={16} strokeWidth={1.5} color="var(--text-secondary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 500 }}>
              {isZh ? '即時視覺串流與 ROI 監控' : 'Live stream & ROI monitor'}
            </h3>
          </div>
          <CameraInferenceCanvas
            projectId={activeProject.id}
            architecture={selectedArchitecture}
            triggerRules={rules}
            onTriggerEvent={handleTriggerEvent}
          />
        </Card>

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

      <CodeSnippetGenerator projectId={activeProject.id} />
    </div>
  );
};
