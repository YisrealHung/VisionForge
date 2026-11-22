import React from 'react';
import { TaskType } from '../../types';
import { useProject } from '../../context/ProjectContext';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const variantClass = {
    indigo: 'badge-indigo',
    cyan: 'badge-cyan',
    emerald: 'badge-emerald',
    amber: 'badge-amber',
    neutral: 'badge-neutral',
  }[variant];

  return <span className={`badge ${variantClass} ${className}`}>{children}</span>;
};

export const TaskBadge: React.FC<{ taskType: TaskType }> = ({ taskType }) => {
  const { language } = useProject();
  const isZh = language === 'zh-TW';

  const config = {
    classification: { label: isZh ? '影像分類' : 'Classification', variant: 'indigo' as const },
    detection: { label: isZh ? '物件偵測' : 'Detection', variant: 'cyan' as const },
    regression: { label: isZh ? '數值迴歸' : 'Regression', variant: 'amber' as const },
    feature: { label: isZh ? '特徵辨識' : 'Feature', variant: 'emerald' as const },
  }[taskType] || { label: taskType, variant: 'neutral' as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};
