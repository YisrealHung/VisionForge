import React from 'react';
import { Zap, Scale, Award, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { PresetType, Hyperparameters } from '../../types';
import { useProject } from '../../context/ProjectContext';

interface PresetSelectorProps {
  currentPreset: PresetType;
  onSelectPreset: (preset: PresetType) => void;
}

interface PresetConfig {
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
  icon: React.ReactNode;
  color: string;
  badgeZh: string;
  badgeEn: string;
  params: Partial<Hyperparameters>;
}

export const PRESET_CONFIGS: Record<PresetType, PresetConfig & { title: string; desc: string; badge: string }> = {
  fast: {
    titleZh: '快速實驗 (Fast Prototype)',
    titleEn: 'Fast Prototype',
    title: 'Fast Prototype',
    descZh: 'Epoch: 5 · LR: 0.001 · 適合快速檢查資料集與訓練流程是否順暢',
    descEn: 'Epoch: 5 · LR: 0.001 · Quickly validate dataset and training pipeline',
    desc: 'Epoch: 5 · LR: 0.001 · Quickly validate dataset and training pipeline',
    icon: <Zap size={20} />,
    color: '#557B86',
    badgeZh: '推薦初步驗證',
    badgeEn: 'Recommended for initial tests',
    badge: 'Recommended for initial tests',
    params: {
      epochs: 5,
      batch_size: 16,
      learning_rate: 0.001,
      optimizer: 'adamw',
      pretrained: true,
      early_stopping_patience: 0,
    },
  },
  balanced: {
    titleZh: '均衡訓練 (Balanced Standard)',
    titleEn: 'Balanced Standard',
    title: 'Balanced Standard',
    descZh: 'Epoch: 20 · LR: 0.0005 · 達到精準度與訓練耗時的最佳平衡',
    descEn: 'Epoch: 20 · LR: 0.0005 · Best balance between accuracy and training time',
    desc: 'Epoch: 20 · LR: 0.0005 · Best balance between accuracy and training time',
    icon: <Scale size={20} />,
    color: '#EB7E83',
    badgeZh: '一般場景推薦',
    badgeEn: 'General use recommended',
    badge: 'General use recommended',
    params: {
      epochs: 20,
      batch_size: 32,
      learning_rate: 0.0005,
      optimizer: 'adamw',
      pretrained: true,
      early_stopping_patience: 0,
    },
  },
  accurate: {
    titleZh: '精確訓練 (High Accuracy)',
    titleEn: 'High Accuracy',
    title: 'High Accuracy',
    descZh: 'Epoch: 50 · LR: 0.0001 · 使用 Cosine 退火調度，追求最高指標',
    descEn: 'Epoch: 50 · LR: 0.0001 · Cosine annealing schedule, maximum metrics',
    desc: 'Epoch: 50 · LR: 0.0001 · Cosine annealing schedule, maximum metrics',
    icon: <Award size={20} />,
    color: '#67a390',
    badgeZh: '工業級產線部署',
    badgeEn: 'Industrial production deployment',
    badge: 'Industrial production deployment',
    params: {
      epochs: 50,
      batch_size: 32,
      learning_rate: 0.0001,
      optimizer: 'adamw',
      pretrained: true,
      early_stopping_patience: 0,
    },
  },
  custom: {
    titleZh: '自訂超參數 (Custom)',
    titleEn: 'Custom Hyperparams',
    title: 'Custom Hyperparams',
    descZh: '手動微調 Epochs, Learning Rate, Batch Size 與 Optimizer',
    descEn: 'Manually tune Epochs, Learning Rate, Batch Size & Optimizer',
    desc: 'Manually tune Epochs, Learning Rate, Batch Size & Optimizer',
    icon: <SlidersHorizontal size={20} />,
    color: '#E1998A',
    badgeZh: '進階開發者',
    badgeEn: 'Advanced developers',
    badge: 'Advanced developers',
    params: {},
  },
};

export const PresetSelector: React.FC<PresetSelectorProps> = ({ currentPreset, onSelectPreset }) => {
  const { language } = useProject();
  const isZh = language === 'zh-TW';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
      {(['fast', 'balanced', 'accurate', 'custom'] as PresetType[]).map((key) => {
        const item = PRESET_CONFIGS[key];
        const isSelected = currentPreset === key;
        return (
          <div
            key={key}
            onClick={() => onSelectPreset(key)}
            style={{
              padding: '1.1rem',
              borderRadius: 'var(--radius-md)',
              background: isSelected ? `${item.color}18` : 'var(--bg-surface-elevated)',
              border: `1px solid ${isSelected ? item.color : 'var(--border-subtle)'}`,
              boxShadow: isSelected ? `0 0 16px ${item.color}30` : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: 'var(--radius-sm)',
                    background: `${item.color}25`,
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </div>
                {isSelected ? (
                  <CheckCircle2 size={18} color={item.color} />
                ) : (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                    {isZh ? item.badgeZh : item.badgeEn}
                  </span>
                )}
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                {isZh ? item.titleZh : item.titleEn}
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {isZh ? item.descZh : item.descEn}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
