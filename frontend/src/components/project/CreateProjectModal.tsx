import React, { useState } from 'react';
import { Layers, Scan, TrendingUp, Focus, CheckCircle2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { TaskType } from '../../types';

export const CreateProjectModal: React.FC = () => {
  const { isCreateModalOpen, setIsCreateModalOpen, createProject, language, t } = useProject();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('classification');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isZh = language === 'zh-TW';

  const taskOptions: {
    type: TaskType;
    title: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      type: 'classification',
      title: isZh ? '影像分類' : 'Image Classification',
      desc: isZh
        ? '為整張圖片指定分類標籤（如良品與瑕疵、物件種類），支援 ResNet 與 ViT 架構'
        : 'Assign one class label per image (Pass/NG, object type). Supports ResNet and ViT',
      icon: <Layers size={16} strokeWidth={1.5} />,
    },
    {
      type: 'detection',
      title: isZh ? '物件偵測' : 'Object Detection',
      desc: isZh
        ? '在影像中定位多個目標物並標記邊界框，支援 YOLO26 與 D-FINE 架構'
        : 'Locate multiple objects with bounding boxes. Supports YOLO26 and D-FINE',
      icon: <Scan size={16} strokeWidth={1.5} />,
    },
    {
      type: 'regression',
      title: isZh ? '圖像迴歸' : 'Feature Regression',
      desc: isZh
        ? '依據影像特徵輸出連續數值預測（如角度、位置座標或品質評分）'
        : 'Predict continuous numerical values (angle, temperature, or coordinates)',
      icon: <TrendingUp size={16} strokeWidth={1.5} />,
    },
    {
      type: 'feature',
      title: isZh ? '特徵辨識' : 'Feature Representation',
      desc: isZh
        ? '自訂 ROI 關注區域或全圖特徵提取，支援 Swin-Tiny 與 ResNet-50 FPN'
        : 'Extract ROI or full-image feature embeddings with Swin or ResNet-50 FPN',
      icon: <Focus size={16} strokeWidth={1.5} />,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(isZh ? '請輸入專案名稱' : 'Please enter a project name');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        task_type: taskType,
      });
      setName('');
      setDescription('');
      setTaskType('classification');
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setError(err.message || (isZh ? '建立專案失敗' : 'Failed to create project'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
      title={t.createProjectModalTitle}
      closeLabel={isZh ? '關閉' : 'Close'}
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-rose-soft)',
              border: '1px solid rgba(200, 30, 30, 0.25)',
              color: 'var(--accent-rose)',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">{t.createProjectNameLabel} *</label>
          <input
            type="text"
            className="form-input"
            placeholder={t.createProjectNamePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t.createProjectDescLabel}</label>
          <textarea
            className="form-textarea"
            rows={2}
            placeholder={t.createProjectDescPlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t.createProjectTaskLabel} *</label>
          <div className="task-type-grid">
            {taskOptions.map((opt) => {
              const isSelected = taskType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  className={`task-type-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setTaskType(opt.type)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="task-type-icon-wrapper">{opt.icon}</div>
                    {isSelected && <CheckCircle2 size={16} strokeWidth={1.5} color="var(--accent-primary)" />}
                  </div>
                  <div className="task-type-title">{opt.title}</div>
                  <div className="task-type-desc">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsCreateModalOpen(false)}
            disabled={loading}
          >
            {t.cancel}
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {t.btnCreateProject}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
