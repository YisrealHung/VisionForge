import React, { useState } from 'react';
import { Layers, Scan, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
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

  const taskOptions: {
    type: TaskType;
    title: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      type: 'classification',
      title: language === 'zh-TW' ? '影像分類' : 'Image Classification',
      desc: language === 'zh-TW' ? '為整張圖片指定分類標籤（如：良品/瑕疵、種類辨識）。支援 ResNet、ViT 等深度架構。' : 'Assign category label to whole image (Pass/NG, object class). Supports ResNet, ViT.',
      icon: <Layers size={18} />,
      color: '#EB7E83',
    },
    {
      type: 'detection',
      title: language === 'zh-TW' ? '物件偵測' : 'Object Detection',
      desc: language === 'zh-TW' ? '在影像中定位多個目標物並繪製 Bounding Box。支援 YOLO26、D-FINE HGNetv2 等即時架構。' : 'Locate multiple objects with Bounding Boxes. Supports YOLO26, D-FINE HGNetv2.',
      icon: <Scan size={18} />,
      color: '#557B86',
    },
    {
      type: 'regression',
      title: language === 'zh-TW' ? '圖像迴歸' : 'Feature Regression',
      desc: language === 'zh-TW' ? '依據影像特徵輸出連續數值預測（如：溫度估算、角度測量、關鍵點座標定位）。' : 'Predict continuous numerical outputs (angle, temperature, coordinates).',
      icon: <TrendingUp size={18} />,
      color: '#E1998A',
    },
    {
      type: 'feature',
      title: language === 'zh-TW' ? '特徵辨識' : 'Feature Representation',
      desc: language === 'zh-TW' ? '自訂 ROI 關注區域或全圖高維特徵提取，支援 Swin-Tiny、ResNet-50+FPN 比對。' : 'Extract high-dimensional ROI or full image features with Swin / ResNet-50 FPN.',
      icon: <Sparkles size={18} />,
      color: '#67a390',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === 'zh-TW' ? '請輸入專案名稱' : 'Please enter project name');
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
      setError(err.message || (language === 'zh-TW' ? '建立專案失敗' : 'Failed to create project'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
      title={`🚀 ${t.createProjectModalTitle}`}
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fda4af',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
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
                <div
                  key={opt.type}
                  className={`task-type-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setTaskType(opt.type)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                      className="task-type-icon-wrapper"
                      style={{
                        background: isSelected ? `${opt.color}30` : 'rgba(255,255,255,0.05)',
                        color: opt.color,
                      }}
                    >
                      {opt.icon}
                    </div>
                    {isSelected && <CheckCircle2 size={16} color={opt.color} />}
                  </div>
                  <div className="task-type-title">{opt.title}</div>
                  <div className="task-type-desc">{opt.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
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
