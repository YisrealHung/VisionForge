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
  badgeZh: string;
  badgeEn: string;
  params: Partial<Hyperparameters>;
}

export const PRESET_CONFIGS: Record<PresetType, PresetConfig & { title: string; desc: string; badge: string }> = {
  fast: {
    titleZh: '快速實驗',
    titleEn: 'Fast Check',
    title: 'Fast Check',
    descZh: 'Epoch 5 · LR 0.001 · 快速驗證資料集與管線',
    descEn: '5 epochs · LR 0.001 · Quick dataset & pipeline check',
    desc: '5 epochs · LR 0.001 · Quick dataset & pipeline check',
    icon: <Zap size={16} strokeWidth={1.5} />,
    badgeZh: '初步驗證',
    badgeEn: 'Initial check',
    badge: 'Initial check',
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
    titleZh: '均衡訓練',
    titleEn: 'Balanced',
    title: 'Balanced',
    descZh: 'Epoch 20 · LR 0.0005 · 兼顧速度與收斂穩定度',
    descEn: '20 epochs · LR 0.0005 · Balance of speed and accuracy',
    desc: '20 epochs · LR 0.0005 · Balance of speed and accuracy',
    icon: <Scale size={16} strokeWidth={1.5} />,
    badgeZh: '一般推薦',
    badgeEn: 'Recommended',
    badge: 'Recommended',
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
    titleZh: '深度收斂',
    titleEn: 'Extended',
    title: 'Extended',
    descZh: 'Epoch 50 · LR 0.0001 · Cosine 調度充分訓練',
    descEn: '50 epochs · LR 0.0001 · Cosine schedule for full convergence',
    desc: '50 epochs · LR 0.0001 · Cosine schedule for full convergence',
    icon: <Award size={16} strokeWidth={1.5} />,
    badgeZh: '高準確度',
    badgeEn: 'Production',
    badge: 'Production',
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
    titleZh: '自訂超參數',
    titleEn: 'Custom',
    title: 'Custom',
    descZh: '手動調整 Epochs、Learning Rate 與優化器',
    descEn: 'Tune Epochs, Learning Rate, Batch Size & Optimizer manually',
    desc: 'Tune Epochs, Learning Rate, Batch Size & Optimizer manually',
    icon: <SlidersHorizontal size={16} strokeWidth={1.5} />,
    badgeZh: '自訂',
    badgeEn: 'Manual',
    badge: 'Manual',
    params: {},
  },
};

export const PresetSelector: React.FC<PresetSelectorProps> = ({ currentPreset, onSelectPreset }) => {
  const { language } = useProject();
  const isZh = language === 'zh-TW';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
      {(['fast', 'balanced', 'accurate', 'custom'] as PresetType[]).map((key) => {
        const item = PRESET_CONFIGS[key];
        const isSelected = currentPreset === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelectPreset(key)}
            style={{
              textAlign: 'left',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: isSelected ? 'var(--accent-primary-soft)' : 'var(--bg-surface)',
              border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-card)'}`,
              cursor: 'pointer',
              transition: 'background-color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                    border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    color: isSelected ? 'var(--accent-on-primary)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </div>
                {isSelected ? (
                  <CheckCircle2 size={16} strokeWidth={1.5} color="var(--accent-primary)" />
                ) : (
                  <span className="badge badge-neutral">
                    {isZh ? item.badgeZh : item.badgeEn}
                  </span>
                )}
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px', color: 'var(--text-primary)' }}>
                {isZh ? item.titleZh : item.titleEn}
              </h4>
              <p className="vf-num" style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                {isZh ? item.descZh : item.descEn}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
