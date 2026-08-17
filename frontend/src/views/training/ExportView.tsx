import React, { useState, useEffect, useCallback } from 'react';
import {
  PackageCheck,
  Download,
  Table2,
  Cpu,
  BrainCircuit,
  Award,
  Zap,
  Layers,
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ModelExportInfo, ConfusionMatrixData } from '../../types';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ConfusionMatrix } from '../../components/export/ConfusionMatrix';
import { SingleImageInference } from '../../components/export/SingleImageInference';
import { PthExportCard } from '../../components/export/PthExportCard';
import { OnnxExportCard } from '../../components/export/OnnxExportCard';
import { TrainedModelList } from '../../components/export/TrainedModelList';

export const ExportView: React.FC = () => {
  const { activeProject, setCurrentView } = useProject();
  const [modelInfo, setModelInfo] = useState<ModelExportInfo | null>(null);
  const [matrixData, setMatrixData] = useState<ConfusionMatrixData | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
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
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>請先在頂部選單選擇或建立一個專案</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>📦 模型評估與匯出中心</h1>
            <span className="badge badge-emerald">模型評估中心</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            專案：<span style={{ color: '#818cf8', fontWeight: 600 }}>{activeProject.name}</span> · 混淆矩陣分析、即時測試與 ONNX 跨平台匯出
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="ghost"
            icon={<RotateCcw size={14} />}
            onClick={() => {
              fetchInfo();
              fetchEvaluation();
            }}
          >
            重新整理
          </Button>

          <Button
            variant="primary"
            icon={<ArrowRight size={15} />}
            onClick={() => setCurrentView('inference_station')}
          >
            前往推論工作站
          </Button>
        </div>
      </div>

      {/* Model Spec Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Architecture & Checkpoint Size */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <BrainCircuit size={16} color="#818cf8" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>模型架構 / 權重</span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, textTransform: 'capitalize' }}>
            {modelInfo ? modelInfo.architecture.replace('_', ' ') : '--'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            權重大小: <strong style={{ color: '#818cf8' }}>{modelInfo?.checkpoint_size_str || '--'}</strong>
          </div>
        </Card>

        {/* Best Accuracy */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Award size={16} color="#10b981" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>最佳驗證準確率 (Best Acc)</span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981' }}>
            {modelInfo && modelInfo.best_val_acc > 0 ? `${modelInfo.best_val_acc.toFixed(1)}%` : '--'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            已訓練 {modelInfo?.total_epochs_trained || 0} 個 Epochs
          </div>
        </Card>

        {/* Inference Latency */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Zap size={16} color="#06b6d4" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>預估推論延遲 (Latency)</span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#06b6d4' }}>
            ~{modelInfo?.estimated_latency_ms || 15} ms
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            輸入: 224×224 RGB 影像
          </div>
        </Card>

        {/* Categories Count */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Layers size={16} color="#f59e0b" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>分類類別數 (Classes)</span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f59e0b' }}>
            {modelInfo?.num_classes || 0} 類
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {modelInfo?.classes.join(', ') || '--'}
          </div>
        </Card>
      </div>

      {/* Section 0: Trained Models List */}
      <TrainedModelList onModelChanged={() => {
        fetchInfo();
        fetchEvaluation();
      }} />

      {/* Section 1: Single-Image Interactive Inference */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
          <Sparkles size={18} color="#818cf8" />
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>單張圖片即時測試推論</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              拖曳或上傳任意圖片，即刻檢驗已訓練模型的分類效果與置信度
            </p>
          </div>
        </div>
        <SingleImageInference projectId={activeProject.id} />
      </Card>

      {/* Section 2: Confusion Matrix & Detailed Metrics */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
          <Table2 size={18} color="#10b981" />
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>測試集混淆矩陣與效能評估報告</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              全面評估分類模型在各類別上的 Precision、Recall、F1-Score 與混淆分佈
            </p>
          </div>
        </div>
        <ConfusionMatrix data={matrixData} loading={evaluating} onRefresh={fetchEvaluation} />
      </Card>

      {/* Section 3: PyTorch Native Model (.pth) Exporter & Download */}
      <PthExportCard projectId={activeProject.id} info={modelInfo} />

      {/* Section 4: ONNX Exporter & Download */}
      <OnnxExportCard projectId={activeProject.id} info={modelInfo} onExportSuccess={fetchInfo} />
    </div>
  );
};
