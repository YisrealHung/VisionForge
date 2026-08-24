import React from 'react';
import { TaskType } from '../../types';
import { useProject } from '../../context/ProjectContext';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'indigo' | 'cyan' | 'emerald' | 'amber';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'indigo',
  className = '',
}) => {
  const variantClass = {
    indigo: 'badge-indigo',
    cyan: 'badge-cyan',
    emerald: 'badge-emerald',
    amber: 'badge-amber',
  }[variant];

  return <span className={`badge ${variantClass} ${className}`}>{children}</span>;
};

export const TaskBadge: React.FC<{ taskType: TaskType }> = ({ taskType }) => {
  const { language } = useProject();
  const isZh = language === 'zh-TW';

  const config = {
    classification: { label: isZh ? '影像分類' : 'Image Classification', variant: 'indigo' as const },
    detection: { label: isZh ? '物件偵測' : 'Object Detection', variant: 'cyan' as const },
    regression: { label: isZh ? '圖像迴歸' : 'Image Regression', variant: 'amber' as const },
    feature: { label: isZh ? '特徵辨識' : 'Feature Extraction', variant: 'emerald' as const },
  }[taskType] || { label: taskType, variant: 'indigo' as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};
