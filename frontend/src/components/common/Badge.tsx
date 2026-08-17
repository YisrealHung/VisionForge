import React from 'react';
import { TaskType } from '../../types';

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
  const config = {
    classification: { label: '影像分類', variant: 'indigo' as const },
    detection: { label: '物件偵測', variant: 'cyan' as const },
    regression: { label: '圖像迴歸', variant: 'amber' as const },
    feature: { label: '特徵辨識', variant: 'emerald' as const },
  }[taskType] || { label: taskType, variant: 'indigo' as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};
