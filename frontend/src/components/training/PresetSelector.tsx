import React from 'react';
import { Zap, Scale, Award, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { PresetType, Hyperparameters } from '../../types';

interface PresetSelectorProps {
  currentPreset: PresetType;
  onSelectPreset: (preset: PresetType) => void;
}

export const PRESET_CONFIGS: Record<PresetType, { title: string; desc: string; icon: React.ReactNode; color: string; badge: string; params: Partial<Hyperparameters> }> = {
  fast: {
    title: '快速實驗 (Fast Prototype)',
    desc: 'Epoch: 5 · LR: 0.001 · 適合快速檢查資料集與訓練流程是否順暢',
    icon: <Zap size={20} />,
    color: '#557B86',
    badge: '推薦初步驗證',
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
    title: '均衡訓練 (Balanced Standard)',
    desc: 'Epoch: 20 · LR: 0.0005 · 達到精準度與訓練耗時的最佳平衡',
    icon: <Scale size={20} />,
    color: '#EB7E83',
    badge: '一般場景推薦',
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
    title: '精確訓練 (High Accuracy)',
    desc: 'Epoch: 50 · LR: 0.0001 · 使用 Cosine 退火調度，追求最高指標',
    icon: <Award size={20} />,
    color: '#67a390',
    badge: '工業級產線部署',
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
    title: '自訂超參數 (Custom)',
    desc: '手動微調 Epochs, Learning Rate, Batch Size 與 Optimizer',
    icon: <SlidersHorizontal size={20} />,
    color: '#E1998A',
    badge: '進階開發者',
    params: {},
  },
};

export const PresetSelector: React.FC<PresetSelectorProps> = ({ currentPreset, onSelectPreset }) => {
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
                    {item.badge}
                  </span>
                )}
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                {item.title}
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {item.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
