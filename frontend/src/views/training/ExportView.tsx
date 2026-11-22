import React, { useState, useEffect, useCallback } from 'react';
import {
  PackageCheck,
  Table2,
  ScanSearch,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ModelExportInfo, ConfusionMatrixData } from '../../types';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { TaskBadge } from '../../components/common/Badge';
import { ConfusionMatrix } from '../../components/export/ConfusionMatrix';
import { SingleImageInference } from '../../components/export/SingleImageInference';
import { PthExportCard } from '../../components/export/PthExportCard';
import { OnnxExportCard } from '../../components/export/OnnxExportCard';
import { TrainedModelList } from '../../components/export/TrainedModelList';

export const ExportView: React.FC = () => {
  const { activeProject, setCurrentView, language } = useProject();
  const isZh = language === 'zh-TW';
  const [modelInfo, setModelInfo] = useState<ModelExportInfo | null>(null);
  const [matrixData, setMatrixData] = useState<ConfusionMatrixData | null>(null);
  const [, setLoadingInfo] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const fetchInfo = useCallback(async () => {
    if (!activeProject) return;
    try {
      setLoadingInfo(true);
      const info = await api.getModelExportInfo(activeProject.id);
      setModelInfo(info);
    } catch (err) {
      console.error('Failed to get model info:', err);
    } finally {
      setLoadingInfo(false);
    }
  }, [activeProject]);

  const fetchEvaluation = useCallback(async () => {
    if (!activeProject) return;
    try {
      setEvaluating(true);
      const data = await api.evaluateModel(activeProject.id);
      setMatrixData(data);
    } catch (err) {
      console.error('Failed to evaluate model:', err);
    } finally {
      setEvaluating(false);
    }
  }, [activeProject]);

  useEffect(() => {
    if (activeProject) {
      fetchInfo();
      fetchEvaluation();
    }
  }, [activeProject, fetchInfo, fetchEvaluation]);

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

  const hasBestAcc = Boolean(modelInfo && modelInfo.best_val_acc > 0);

  return (
    <div className="vf-container">
      <div className="vf-page-header">
        <div className="vf-page-heading">
          <div className="vf-page-eyebrow">
            <PackageCheck size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>{isZh ? '模型評估與匯出' : 'Evaluation & Export'}</span>
            <TaskBadge taskType={activeProject.task_type} />
          </div>
          <div className="vf-page-title-row">
            <h1 className="vf-page-title">{activeProject.name}</h1>
          </div>
        </div>

        <div className="vf-page-actions">
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw size={14} strokeWidth={1.5} />}
            onClick={() => {
              fetchInfo();
              fetchEvaluation();
            }}
          >
            {isZh ? '重新整理' : 'Refresh'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<ArrowRight size={15} strokeWidth={1.5} />}
            onClick={() => setCurrentView('inference_station')}
          >
            {isZh ? '前往推論工作站' : 'Open inference station'}
          </Button>
        </div>
      </div>

      {/* Model Spec Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <Card>
          <div className="vf-stat-label">{isZh ? '模型架構與權重' : 'Architecture & weights'}</div>
          <div className="vf-stat-value vf-num" style={{ fontSize: '20px', lineHeight: 1.3, textTransform: 'capitalize' }}>
            {modelInfo ? modelInfo.architecture.replace(/_/g, ' ') : '--'}
          </div>
          <div className="vf-stat-sub vf-num">
            {isZh ? '權重大小：' : 'Size: '}
            {modelInfo?.checkpoint_size_str || '--'}
          </div>
        </Card>

        <Card>
          <div className="vf-stat-label">{isZh ? '最佳驗證準確率' : 'Best validation accuracy'}</div>
          <div
            className="vf-stat-value vf-num"
            style={{ color: hasBestAcc ? 'var(--accent-emerald)' : 'var(--text-primary)' }}
          >
            {hasBestAcc ? `${modelInfo!.best_val_acc.toFixed(1)}%` : '--'}
          </div>
          <div className="vf-stat-sub vf-num">
            {isZh ? `已訓練 ${modelInfo?.total_epochs_trained || 0} 輪` : `${modelInfo?.total_epochs_trained || 0} epochs trained`}
          </div>
        </Card>

        <Card>
          <div className="vf-stat-label">{isZh ? '預估推論延遲' : 'Estimated latency'}</div>
          <div className="vf-stat-value vf-num">
            ~{modelInfo?.estimated_latency_ms || 15} ms
          </div>
          <div className="vf-stat-sub vf-num">
            {isZh ? '輸入：224 × 224 RGB' : 'Input: 224 × 224 RGB'}
          </div>
        </Card>

        <Card>
          <div className="vf-stat-label">{isZh ? '目標類別數' : 'Target classes'}</div>
          <div className="vf-stat-value vf-num">
            {modelInfo?.num_classes || 0}
          </div>
          <div
            className="vf-stat-sub"
            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
            title={modelInfo?.classes.join(', ') || ''}
          >
            {modelInfo?.classes.join(', ') || '--'}
          </div>
        </Card>
      </div>

      <TrainedModelList
        onModelChanged={() => {
          fetchInfo();
          fetchEvaluation();
        }}
      />

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <ScanSearch size={16} strokeWidth={1.5} color="var(--text-secondary)" aria-hidden="true" />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 500 }}>
              {isZh ? '單張圖片即時測試' : 'Single image test'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {isZh ? '拖曳或上傳測試圖片以檢視模型預測類別與信心度' : 'Drop or upload an image to inspect predictions and confidence'}
            </p>
          </div>
        </div>
        <SingleImageInference projectId={activeProject.id} />
      </Card>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Table2 size={16} strokeWidth={1.5} color="var(--text-secondary)" aria-hidden="true" />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 500 }}>
              {isZh ? '測試集混淆矩陣與效能指標' : 'Confusion matrix & per-class metrics'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {isZh ? '檢視各類別 Precision、Recall、F1-Score 與混淆分佈' : 'Inspect per-class Precision, Recall, F1-Score, and prediction matrix'}
            </p>
          </div>
        </div>
        <ConfusionMatrix data={matrixData} loading={evaluating} onRefresh={fetchEvaluation} />
      </Card>

      <PthExportCard projectId={activeProject.id} info={modelInfo} />
      <OnnxExportCard projectId={activeProject.id} info={modelInfo} onExportSuccess={fetchInfo} />
    </div>
  );
};
