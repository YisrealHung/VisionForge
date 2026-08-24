import React, { useState } from 'react';
import { BrainCircuit, Cpu, Zap, CheckCircle2, ShieldAlert, Sparkles, Filter, Layers, Scan } from 'lucide-react';
import { ModelArchitecture, TaskType } from '../../types';
import { useProject } from '../../context/ProjectContext';

interface ModelSelectorProps {
  taskType?: TaskType;
  selectedModel: ModelArchitecture;
  onSelectModel: (arch: ModelArchitecture) => void;
}

export type ModelTier = 'all' | 'realtime' | 'edge' | 'flagship';

export interface ModelInfo {
  id: ModelArchitecture;
  taskType: TaskType;
  name: string;
  family: string;
  tier?: 'realtime' | 'edge' | 'flagship';
  params: string;
  speedZh: string;
  speedEn: string;
  metricLabel: string;
  metricValue: string;
  descZh: string;
  descEn: string;
  recommendedForZh: string;
  recommendedForEn: string;
  badgeColor?: string;
}

// Keep legacy `speed`, `desc`, `recommendedFor` fields for backwards compat
export const ALL_MODELS: ModelInfo[] = [
  // ==========================================
  // OBJECT DETECTION
  // ==========================================
  {
    id: 'yolo26_s',
    taskType: 'detection',
    tier: 'realtime',
    name: 'YOLO26-S',
    family: 'Ultralytics YOLO26',
    params: '10.0 M',
    speedZh: '超快 (~2.5ms)',
    speedEn: 'Ultra-fast (~2.5ms)',
    metricLabel: 'COCO mAP',
    metricValue: '47.5',
    descZh: '官方 YOLO26-S，無 NMS 端到端架構，速度與精度達到最佳平衡。',
    descEn: 'Official YOLO26-S, end-to-end architecture without NMS, best speed-accuracy balance.',
    recommendedForZh: '最推薦入門與多數即時偵測場景',
    recommendedForEn: 'Best for beginners and most real-time detection tasks',
    badgeColor: '#06b6d4',
  },
  {
    id: 'yolo26_n',
    taskType: 'detection',
    tier: 'edge',
    name: 'YOLO26-N (Nano)',
    family: 'Ultralytics YOLO26',
    params: '2.6 M',
    speedZh: '極致 (~1.5ms)',
    speedEn: 'Extreme (~1.5ms)',
    metricLabel: 'COCO mAP',
    metricValue: '40.5',
    descZh: '官方 YOLO26-N，極小模型體積與超低延遲，專為邊緣端嵌入式設計。',
    descEn: 'Official YOLO26-N, ultra-small model with minimal latency, designed for embedded edge devices.',
    recommendedForZh: 'Jetson Nano / Orin / 樹莓派邊緣部署',
    recommendedForEn: 'Jetson Nano / Orin / Raspberry Pi edge deployment',
    badgeColor: '#10b981',
  },
  {
    id: 'yolo26_m',
    taskType: 'detection',
    tier: 'realtime',
    name: 'YOLO26-M',
    family: 'Ultralytics YOLO26',
    params: '21.9 M',
    speedZh: '快 (~4.5ms)',
    speedEn: 'Fast (~4.5ms)',
    metricLabel: 'COCO mAP',
    metricValue: '50.5',
    descZh: '官方 YOLO26-M，中等規模偵測器，適合複雜背景多物件檢測。',
    descEn: 'Official YOLO26-M, medium-scale detector for complex multi-object scenes.',
    recommendedForZh: '工業質檢與多目標複雜場景',
    recommendedForEn: 'Industrial QC and complex multi-target scenes',
    badgeColor: '#06b6d4',
  },
  {
    id: 'yolo26_l',
    taskType: 'detection',
    tier: 'flagship',
    name: 'YOLO26-L',
    family: 'Ultralytics YOLO26',
    params: '26.3 M',
    speedZh: '中等 (~7.5ms)',
    speedEn: 'Moderate (~7.5ms)',
    metricLabel: 'COCO mAP',
    metricValue: '53.2',
    descZh: '官方 YOLO26-L，旗艦級高精度偵測器，極致識別率。',
    descEn: 'Official YOLO26-L, flagship high-accuracy detector with maximum recognition rate.',
    recommendedForZh: '產線高精準度要求之旗艦應用',
    recommendedForEn: 'Flagship applications requiring maximum production-line accuracy',
    badgeColor: '#f59e0b',
  },
  {
    id: 'dfine_s',
    taskType: 'detection',
    tier: 'realtime',
    name: 'D-FINE-S',
    family: 'Transformer FDR (HGNetv2)',
    params: '10.8 M',
    speedZh: '快 (~3.5ms)',
    speedEn: 'Fast (~3.5ms)',
    metricLabel: 'COCO mAP',
    metricValue: '48.5',
    descZh: '官方 HGNetv2-B0 骨幹 + 300 Queries FDR Transformer 解碼器 (3 層)。',
    descEn: 'Official HGNetv2-B0 backbone + 300 Query FDR Transformer decoder (3 layers).',
    recommendedForZh: '高幾何精度框選與微小物件檢測',
    recommendedForEn: 'High geometric precision bounding boxes and tiny object detection',
    badgeColor: '#818cf8',
  },
  {
    id: 'dfine_n',
    taskType: 'detection',
    tier: 'edge',
    name: 'D-FINE-N (Nano)',
    family: 'Transformer FDR (HGNetv2)',
    params: '10.0 M',
    speedZh: '極快 (~2.3ms)',
    speedEn: 'Very Fast (~2.3ms)',
    metricLabel: 'COCO mAP',
    metricValue: '42.8',
    descZh: '官方輕量 HGNetv2-B0 骨幹 + 300 Queries 快速 FDR 解碼器 (3 層)。',
    descEn: 'Official lightweight HGNetv2-B0 backbone + 300 Query fast FDR decoder (3 layers).',
    recommendedForZh: '邊緣 GPU 即時高精準框選',
    recommendedForEn: 'Edge GPU real-time high-precision detection',
    badgeColor: '#10b981',
  },
  {
    id: 'dfine_l',
    taskType: 'detection',
    tier: 'flagship',
    name: 'D-FINE-L',
    family: 'Transformer FDR (HGNetv2)',
    params: '50.7 M',
    speedZh: '中等 (~6.5ms)',
    speedEn: 'Moderate (~6.5ms)',
    metricLabel: 'COCO mAP',
    metricValue: '54.0',
    descZh: '官方旗艦 HGNetv2-B4 骨幹 + 300 Queries 6 層深層 FDR 解碼器。',
    descEn: 'Official flagship HGNetv2-B4 backbone + 300 Queries 6-layer deep FDR decoder.',
    recommendedForZh: '高難度細微瑕疵與密集目標',
    recommendedForEn: 'Challenging fine-detail defect detection and dense targets',
    badgeColor: '#f59e0b',
  },
  {
    id: 'ssdlite_mobilenet_v3',
    taskType: 'detection',
    tier: 'edge',
    name: 'SSDLite-MobileNetV3',
    family: 'torchvision SSDLite',
    params: '3.4 M',
    speedZh: '極致 (~0.8ms)',
    speedEn: 'Extreme (~0.8ms)',
    metricLabel: 'COCO mAP',
    metricValue: '21.3',
    descZh: '極致輕量化卷積偵測架構，記憶體占用極低，相容性極高。',
    descEn: 'Ultra-lightweight convolutional detector, minimal memory footprint, maximum compatibility.',
    recommendedForZh: '極低算力裝置 / 行動端 / MCU',
    recommendedForEn: 'Ultra-low compute devices / Mobile / MCU',
    badgeColor: '#10b981',
  },

  // ==========================================
  // CLASSIFICATION
  // ==========================================
  {
    id: 'resnet18',
    taskType: 'classification',
    name: 'ResNet-18',
    family: 'Residual Network',
    params: '11.7 M',
    speedZh: '超快 (~15ms)',
    speedEn: 'Ultra-fast (~15ms)',
    metricLabel: 'Top-1 Acc',
    metricValue: '69.8%',
    descZh: '經典殘差網路，極佳的泛化能力與快速收斂速度。',
    descEn: 'Classic residual network with excellent generalization and fast convergence.',
    recommendedForZh: '最推薦入門與多數分類任務',
    recommendedForEn: 'Best for beginners and most classification tasks',
    badgeColor: '#818cf8',
  },
  {
    id: 'efficientnet_b0',
    taskType: 'classification',
    name: 'EfficientNet-B0',
    family: 'Compound Scaling',
    params: '5.3 M',
    speedZh: '快 (~22ms)',
    speedEn: 'Fast (~22ms)',
    metricLabel: 'Top-1 Acc',
    metricValue: '77.1%',
    descZh: '複合縮放架構，參數量小且精準度表現優異。',
    descEn: 'Compound scaling architecture with small parameter count and excellent accuracy.',
    recommendedForZh: '邊緣運算與輕量化部署',
    recommendedForEn: 'Edge computing and lightweight deployment',
    badgeColor: '#06b6d4',
  },
  {
    id: 'mobilenet_v3_small',
    taskType: 'classification',
    name: 'MobileNetV3-Small',
    family: 'Mobile Vision',
    params: '2.5 M',
    speedZh: '極快 (~8ms)',
    speedEn: 'Very Fast (~8ms)',
    metricLabel: 'Top-1 Acc',
    metricValue: '67.7%',
    descZh: '針對行動端與嵌入式硬體優化，極低記憶體占用。',
    descEn: 'Optimized for mobile and embedded hardware with minimal memory usage.',
    recommendedForZh: '低算力裝置與即時串流',
    recommendedForEn: 'Low-power devices and real-time streaming',
    badgeColor: '#10b981',
  },
  {
    id: 'resnet50',
    taskType: 'classification',
    name: 'ResNet-50',
    family: 'Deep Residual Network',
    params: '25.6 M',
    speedZh: '中等 (~35ms)',
    speedEn: 'Moderate (~35ms)',
    metricLabel: 'Top-1 Acc',
    metricValue: '80.9%',
    descZh: '深度特徵提取網路，適合複雜多類別精細分類。',
    descEn: 'Deep feature extraction network, ideal for complex multi-class fine-grained classification.',
    recommendedForZh: '高難度細粒度分類',
    recommendedForEn: 'High-difficulty fine-grained classification',
    badgeColor: '#f59e0b',
  },
  {
    id: 'convnext_tiny',
    taskType: 'classification',
    name: 'ConvNeXt-Tiny',
    family: 'Modern Pure CNN',
    params: '28.6 M',
    speedZh: '中等 (~25ms)',
    speedEn: 'Moderate (~25ms)',
    metricLabel: 'Top-1 Acc',
    metricValue: '82.1%',
    descZh: '融合 Vision Transformer 設計理念的現代卷積網路首選。',
    descEn: 'Modern CNN incorporating Vision Transformer design principles.',
    recommendedForZh: '追求高精度與高穩定性的現代架構',
    recommendedForEn: 'Modern architecture for high accuracy and stability',
    badgeColor: '#ec4899',
  },
  {
    id: 'vit_b16',
    taskType: 'classification',
    name: 'ViT-B/16 (Vision Transformer)',
    family: 'Transformer',
    params: '86.6 M',
    speedZh: '較慢 (~45ms)',
    speedEn: 'Slow (~45ms)',
    metricLabel: 'Top-1 Acc',
    metricValue: '84.5%',
    descZh: '純 Transformer 架構，透過全域自注意力捕捉圖像關聯。',
    descEn: 'Pure Transformer architecture capturing global relationships via self-attention.',
    recommendedForZh: '大資料集與全域特徵分類',
    recommendedForEn: 'Large datasets and global feature classification',
    badgeColor: '#a855f7',
  },

  // ==========================================
  // REGRESSION
  // ==========================================
  {
    id: 'resnet18_reg',
    taskType: 'regression',
    name: 'ResNet-18 Regressor',
    family: 'Residual Regression',
    params: '11.7 M',
    speedZh: '超快 (~15ms)',
    speedEn: 'Ultra-fast (~15ms)',
    metricLabel: 'Task Type',
    metricValue: 'Continuous',
    descZh: '輕量連續數值迴歸網路，訓練收斂迅速穩定。',
    descEn: 'Lightweight continuous-value regression network, fast and stable convergence.',
    recommendedForZh: '角度測量、溫度估算、單標量回歸',
    recommendedForEn: 'Angle measurement, temperature estimation, single-scalar regression',
    badgeColor: '#f59e0b',
  },
  {
    id: 'resnet50_reg',
    taskType: 'regression',
    name: 'ResNet-50 Regressor',
    family: 'Deep Regression',
    params: '25.6 M',
    speedZh: '中等 (~35ms)',
    speedEn: 'Moderate (~35ms)',
    metricLabel: 'Task Type',
    metricValue: 'Continuous',
    descZh: '深度特徵迴歸，具備強大非線性擬合能力。',
    descEn: 'Deep feature regression with powerful nonlinear fitting capability.',
    recommendedForZh: '高精度多目標數值預測與品質評分',
    recommendedForEn: 'High-accuracy multi-target value prediction and quality scoring',
    badgeColor: '#f59e0b',
  },
  {
    id: 'efficientnet_b0_reg',
    taskType: 'regression',
    name: 'EfficientNet-B0 Reg',
    family: 'Compound Regression',
    params: '5.3 M',
    speedZh: '快 (~22ms)',
    speedEn: 'Fast (~22ms)',
    metricLabel: 'Task Type',
    metricValue: 'Continuous',
    descZh: '高效率輕量回歸器，在低計算量下保持極高數值精確度。',
    descEn: 'Efficient lightweight regressor maintaining high numerical accuracy with low compute.',
    recommendedForZh: '邊緣即時連續數值預測',
    recommendedForEn: 'Edge real-time continuous value prediction',
    badgeColor: '#06b6d4',
  },
  {
    id: 'mobilenet_v3_reg',
    taskType: 'regression',
    name: 'MobileNetV3 Reg',
    family: 'Mobile Regression',
    params: '2.5 M',
    speedZh: '極快 (~8ms)',
    speedEn: 'Very Fast (~8ms)',
    metricLabel: 'Task Type',
    metricValue: 'Continuous',
    descZh: '極速輕量數值回歸器，極小硬體資源消耗。',
    descEn: 'Ultra-fast lightweight value regressor with minimal hardware resource usage.',
    recommendedForZh: '嵌入式即時監控與傳感器融合',
    recommendedForEn: 'Embedded real-time monitoring and sensor fusion',
    badgeColor: '#10b981',
  },

  // ==========================================
  // FEATURE IDENTIFICATION
  // ==========================================
  {
    id: 'resnet50_fpn',
    taskType: 'feature',
    name: 'ResNet-50 + FPN',
    family: 'Feature Pyramid',
    params: '25.6 M',
    speedZh: '快 (~30ms)',
    speedEn: 'Fast (~30ms)',
    metricLabel: 'Feature Dim',
    metricValue: '256-d Multi-Scale',
    descZh: '多尺度特徵金字塔架構，完整保留深淺層空間與語意特徵。',
    descEn: 'Multi-scale feature pyramid retaining both shallow spatial and deep semantic features.',
    recommendedForZh: '多尺度關鍵點偵測與特徵比對',
    recommendedForEn: 'Multi-scale keypoint detection and feature matching',
    badgeColor: '#10b981',
  },
  {
    id: 'hrnet_w18',
    taskType: 'feature',
    name: 'HRNet-W18',
    family: 'High-Resolution Net',
    params: '9.6 M',
    speedZh: '快 (~20ms)',
    speedEn: 'Fast (~20ms)',
    metricLabel: 'Resolution',
    metricValue: 'Full High-Res',
    descZh: '全程維持高解析度並行分支，避免降取樣空間訊息丟失。',
    descEn: 'Maintains full high-resolution parallel branches, avoiding spatial information loss from downsampling.',
    recommendedForZh: '精細關鍵點定位與人體姿態估計',
    recommendedForEn: 'Precise keypoint localization and human pose estimation',
    badgeColor: '#06b6d4',
  },
  {
    id: 'swin_tiny',
    taskType: 'feature',
    name: 'Swin-Tiny',
    family: 'Hierarchical ViT',
    params: '28.3 M',
    speedZh: '中等 (~28ms)',
    speedEn: 'Moderate (~28ms)',
    metricLabel: 'Embedding',
    metricValue: 'Hierarchical',
    descZh: '移動視窗階層式 Transformer，具備優秀的局部與全域特徵提取能力。',
    descEn: 'Shifted-window hierarchical Transformer with excellent local and global feature extraction.',
    recommendedForZh: '圖像檢索、微小特徵識別與比對',
    recommendedForEn: 'Image retrieval, fine feature recognition and matching',
    badgeColor: '#818cf8',
  },
  {
    id: 'vit_feature',
    taskType: 'feature',
    name: 'ViT-B/16 Feature Extractor',
    family: 'Vision Transformer',
    params: '86.6 M',
    speedZh: '中等 (~45ms)',
    speedEn: 'Moderate (~45ms)',
    metricLabel: 'Embedding',
    metricValue: '768-d Vector',
    descZh: '提取頂級 768 維高維全域嵌入特徵向量。',
    descEn: 'Extracts top-tier 768-dim global embedding feature vectors.',
    recommendedForZh: '高精度相似度比對與大規模圖像檢索',
    recommendedForEn: 'High-accuracy similarity matching and large-scale image retrieval',
    badgeColor: '#a855f7',
  },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  taskType = 'classification',
  selectedModel,
  onSelectModel,
}) => {
  const { language } = useProject();
  const isZh = language === 'zh-TW';

  const [tierFilter, setTierFilter] = useState<ModelTier>('all');

  // Filter models based on taskType
  const taskModels = ALL_MODELS.filter((m) => m.taskType === taskType);

  // Apply tier filter for detection task
  const displayedModels = taskType === 'detection' && tierFilter !== 'all'
    ? taskModels.filter((m) => m.tier === tierFilter)
    : taskModels;

  const isDetection = taskType === 'detection';

  const tierLabel = (tier: string) => {
    if (tier === 'realtime') return isZh ? '⚡ 即時級' : '⚡ Real-time';
    if (tier === 'edge') return isZh ? '📱 邊緣級' : '📱 Edge';
    return isZh ? '🏆 旗艦級' : '🏆 Flagship';
  };

  const filterTabs = [
    { id: 'all' as ModelTier, label: isZh ? '全部模型' : 'All Models', count: taskModels.length },
    { id: 'realtime' as ModelTier, label: isZh ? '⚡ 即時級 (Real-time)' : '⚡ Real-time', count: taskModels.filter((m) => m.tier === 'realtime').length },
    { id: 'edge' as ModelTier, label: isZh ? '📱 邊緣級 (Edge / Mobile)' : '📱 Edge / Mobile', count: taskModels.filter((m) => m.tier === 'edge').length },
    { id: 'flagship' as ModelTier, label: isZh ? '🏆 旗艦級 (High Precision)' : '🏆 Flagship (High Precision)', count: taskModels.filter((m) => m.tier === 'flagship').length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Tier Filter Tabs for Detection */}
      {isDetection && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '0.25rem' }}>
            <Filter size={14} /> {isZh ? '模型等級篩選:' : 'Filter by Tier:'}
          </span>
          {filterTabs.map((tab) => {
            const isTabActive = tierFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTierFilter(tab.id)}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: isTabActive ? 700 : 500,
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${isTabActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  background: isTabActive ? 'var(--accent-primary-glow)' : 'var(--bg-surface-elevated)',
                  color: isTabActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    background: isTabActive ? 'var(--accent-primary-glow)' : 'rgba(128, 128, 128, 0.1)',
                    color: isTabActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                    padding: '1px 5px',
                    borderRadius: '10px',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Grid of Models */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
        {displayedModels.map((m) => {
          const isSelected = selectedModel === m.id;
          const badgeColor = m.badgeColor || 'var(--accent-primary)';

          return (
            <div
              key={m.id}
              onClick={() => onSelectModel(m.id)}
              style={{
                padding: '1.1rem',
                borderRadius: 'var(--radius-md)',
                background: isSelected ? 'var(--accent-primary-glow)' : 'var(--bg-surface-elevated)',
                border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <div>
                {/* Header Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: badgeColor,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: `${badgeColor}18`,
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {m.family}
                    </span>
                    {m.tier && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--text-muted)',
                          background: 'rgba(128, 128, 128, 0.1)',
                          padding: '2px 5px',
                          borderRadius: '4px',
                        }}
                      >
                        {tierLabel(m.tier)}
                      </span>
                    )}
                  </div>
                  {isSelected ? (
                    <CheckCircle2 size={18} color="var(--accent-primary)" />
                  ) : (
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--border-subtle)' }} />
                  )}
                </div>

                {/* Name */}
                <h4 style={{ fontSize: '1.08rem', fontWeight: 800, marginBottom: '0.35rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {m.name}
                </h4>

                {/* Description */}
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.65rem', lineHeight: '1.4' }}>
                  {isZh ? m.descZh : m.descEn}
                </p>

                {/* Recommendation */}
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                    background: isSelected ? 'var(--accent-primary-glow)' : 'rgba(128, 128, 128, 0.05)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    marginBottom: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={12} color={isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                  <span>{isZh ? m.recommendedForZh : m.recommendedForEn}</span>
                </div>
              </div>

              {/* Footer Specs */}
              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.65rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '4px',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{isZh ? '參數量' : 'Params'}</div>
                  <strong style={{ color: 'var(--text-primary)' }}>{m.params}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{isZh ? '推論速度' : 'Inference'}</div>
                  <strong style={{ color: '#67a390' }}>{isZh ? m.speedZh : m.speedEn}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{m.metricLabel}</div>
                  <strong style={{ color: '#557B86' }}>{m.metricValue}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
