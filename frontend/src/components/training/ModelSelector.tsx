import React, { useState } from 'react';
import { CheckCircle2, Filter } from 'lucide-react';
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
}

export const ALL_MODELS: ModelInfo[] = [
  // OBJECT DETECTION
  {
    id: 'yolo26_s',
    taskType: 'detection',
    tier: 'realtime',
    name: 'YOLO26-S',
    family: 'Ultralytics YOLO26',
    params: '10.0 M',
    speedZh: '~2.5 ms',
    speedEn: '~2.5 ms',
    metricLabel: 'COCO mAP',
    metricValue: '47.5',
    descZh: '無 NMS 端到端偵測架構，在推論延遲與準確度之間維持良好平衡。',
    descEn: 'End-to-end NMS-free detector balancing latency and precision.',
    recommendedForZh: '一般即時偵測任務預設首選',
    recommendedForEn: 'Default choice for most real-time detection tasks',
  },
  {
    id: 'yolo26_n',
    taskType: 'detection',
    tier: 'edge',
    name: 'YOLO26-N (Nano)',
    family: 'Ultralytics YOLO26',
    params: '2.6 M',
    speedZh: '~1.5 ms',
    speedEn: '~1.5 ms',
    metricLabel: 'COCO mAP',
    metricValue: '40.5',
    descZh: '小型化模型體積與低延遲表現，適合資源受限的邊緣裝置。',
    descEn: 'Compact footprint and low latency for resource-constrained edge devices.',
    recommendedForZh: 'Jetson Nano / Orin / 樹莓派邊緣部署',
    recommendedForEn: 'Jetson Nano / Orin / Raspberry Pi edge deployment',
  },
  {
    id: 'yolo26_m',
    taskType: 'detection',
    tier: 'realtime',
    name: 'YOLO26-M',
    family: 'Ultralytics YOLO26',
    params: '21.9 M',
    speedZh: '~4.5 ms',
    speedEn: '~4.5 ms',
    metricLabel: 'COCO mAP',
    metricValue: '50.5',
    descZh: '中等規模偵測器，適合背景較複雜的多物件辨識場景。',
    descEn: 'Medium-scale detector suited for cluttered multi-object scenes.',
    recommendedForZh: '工業質檢與多目標場景',
    recommendedForEn: 'Industrial inspection and multi-target scenes',
  },
  {
    id: 'yolo26_l',
    taskType: 'detection',
    tier: 'flagship',
    name: 'YOLO26-L',
    family: 'Ultralytics YOLO26',
    params: '26.3 M',
    speedZh: '~7.5 ms',
    speedEn: '~7.5 ms',
    metricLabel: 'COCO mAP',
    metricValue: '53.2',
    descZh: '高容量卷積偵測架構，著重高召回率與邊界框穩定性。',
    descEn: 'High-capacity detector focused on recall and box stability.',
    recommendedForZh: '對精確率要求較高的產線檢測',
    recommendedForEn: 'Production lines requiring higher detection accuracy',
  },
  {
    id: 'dfine_s',
    taskType: 'detection',
    tier: 'realtime',
    name: 'D-FINE-S',
    family: 'Transformer FDR (HGNetv2)',
    params: '10.8 M',
    speedZh: '~3.5 ms',
    speedEn: '~3.5 ms',
    metricLabel: 'COCO mAP',
    metricValue: '48.5',
    descZh: 'HGNetv2-B0 骨幹搭配 300 Queries FDR Transformer 解碼器（3 層）。',
    descEn: 'HGNetv2-B0 backbone with 3-layer 300-query FDR Transformer decoder.',
    recommendedForZh: '高幾何精度框選與小型物件檢測',
    recommendedForEn: 'High geometric box precision and small targets',
  },
  {
    id: 'dfine_n',
    taskType: 'detection',
    tier: 'edge',
    name: 'D-FINE-N (Nano)',
    family: 'Transformer FDR (HGNetv2)',
    params: '10.0 M',
    speedZh: '~2.3 ms',
    speedEn: '~2.3 ms',
    metricLabel: 'COCO mAP',
    metricValue: '42.8',
    descZh: '輕量 HGNetv2-B0 骨幹搭配快速 FDR 解碼器。',
    descEn: 'Lightweight HGNetv2-B0 backbone with fast FDR decoder.',
    recommendedForZh: '邊緣 GPU 即時高精度框選',
    recommendedForEn: 'Edge GPU real-time precision detection',
  },
  {
    id: 'dfine_l',
    taskType: 'detection',
    tier: 'flagship',
    name: 'D-FINE-L',
    family: 'Transformer FDR (HGNetv2)',
    params: '50.7 M',
    speedZh: '~6.5 ms',
    speedEn: '~6.5 ms',
    metricLabel: 'COCO mAP',
    metricValue: '54.0',
    descZh: 'HGNetv2-B4 骨幹搭配 6 層深層 FDR 解碼器，處理密集與細微目標。',
    descEn: 'HGNetv2-B4 backbone with 6-layer FDR decoder for dense small defects.',
    recommendedForZh: '細微瑕疵檢測與高密度目標',
    recommendedForEn: 'Fine-detail defect detection and dense targets',
  },
  {
    id: 'ssdlite_mobilenet_v3',
    taskType: 'detection',
    tier: 'edge',
    name: 'SSDLite-MobileNetV3',
    family: 'torchvision SSDLite',
    params: '3.4 M',
    speedZh: '~0.8 ms',
    speedEn: '~0.8 ms',
    metricLabel: 'COCO mAP',
    metricValue: '21.3',
    descZh: '輕量化卷積偵測架構，記憶體占用低且跨平台相容性高。',
    descEn: 'Lightweight convolutional detector with minimal memory footprint.',
    recommendedForZh: '低算力嵌入式裝置與 CPU 推論',
    recommendedForEn: 'Low-compute embedded devices and CPU inference',
  },

  // CLASSIFICATION
  {
    id: 'resnet18',
    taskType: 'classification',
    name: 'ResNet-18',
    family: 'Residual Network',
    params: '11.7 M',
    speedZh: '~15 ms',
    speedEn: '~15 ms',
    metricLabel: 'Top-1 Acc',
    metricValue: '69.8%',
    descZh: '經典殘差網路，具備良好泛化能力與穩定的收斂速度。',
    descEn: 'Classic residual network with reliable generalization and fast convergence.',
    recommendedForZh: '多數分類任務標準基準',
    recommendedForEn: 'Standard baseline for most classification tasks',
  },
  {
    id: 'efficientnet_b0',
    taskType: 'classification',
    name: 'EfficientNet-B0',
    family: 'Compound Scaling',
    params: '5.3 M',
    speedZh: '~22 ms',
    speedEn: '~22 ms',
    metricLabel: 'Top-1 Acc',
    metricValue: '77.1%',
    descZh: '複合縮放卷積架構，以較少參數提供穩健準確度。',
    descEn: 'Compound-scaled CNN offering strong accuracy with few parameters.',
    recommendedForZh: '邊緣運算與輕量部署',
    recommendedForEn: 'Edge computing and lightweight deployment',
  },
  {
    id: 'mobilenet_v3_small',
    taskType: 'classification',
    name: 'MobileNetV3-Small',
    family: 'Mobile Vision',
    params: '2.5 M',
    speedZh: '~8 ms',
    speedEn: '~8 ms',
    metricLabel: 'Top-1 Acc',
    metricValue: '67.7%',
    descZh: '針對行動與嵌入式硬體最佳化，推論速度快且占用記憶體少。',
    descEn: 'Optimized for mobile and embedded targets with low memory usage.',
    recommendedForZh: '低算力裝置與高速串流',
    recommendedForEn: 'Low-power devices and high-FPS streaming',
  },
  {
    id: 'resnet50',
    taskType: 'classification',
    name: 'ResNet-50',
    family: 'Deep Residual Network',
    params: '25.6 M',
    speedZh: '~35 ms',
    speedEn: '~35 ms',
    metricLabel: 'Top-1 Acc',
    metricValue: '80.9%',
    descZh: '深層殘差特徵骨幹，適合多類別與細節差異較小的分類。',
    descEn: 'Deeper residual backbone suited for multi-class fine distinctions.',
    recommendedForZh: '多類別細粒度分類',
    recommendedForEn: 'Multi-class fine-grained classification',
  },
  {
    id: 'convnext_tiny',
    taskType: 'classification',
    name: 'ConvNeXt-Tiny',
    family: 'Modern Pure CNN',
    params: '28.6 M',
    speedZh: '~25 ms',
    speedEn: '~25 ms',
    metricLabel: 'Top-1 Acc',
    metricValue: '82.1%',
    descZh: '結合 Vision Transformer 設計規範的現代純卷積網路。',
    descEn: 'Modern pure CNN incorporating Vision Transformer design choices.',
    recommendedForZh: '高穩定度通用分類骨幹',
    recommendedForEn: 'High-stability general classification backbone',
  },
  {
    id: 'vit_b16',
    taskType: 'classification',
    name: 'ViT-B/16',
    family: 'Vision Transformer',
    params: '86.6 M',
    speedZh: '~45 ms',
    speedEn: '~45 ms',
    metricLabel: 'Top-1 Acc',
    metricValue: '84.5%',
    descZh: '純 Transformer 架構，透過全域自注意力捕捉影像結構關聯。',
    descEn: 'Pure Transformer capturing global spatial relationships via self-attention.',
    recommendedForZh: '較大資料集與全域特徵分類',
    recommendedForEn: 'Larger datasets and global feature classification',
  },

  // REGRESSION
  {
    id: 'resnet18_reg',
    taskType: 'regression',
    name: 'ResNet-18 Regressor',
    family: 'Residual Regression',
    params: '11.7 M',
    speedZh: '~15 ms',
    speedEn: '~15 ms',
    metricLabel: 'Task Type',
    metricValue: 'Continuous',
    descZh: '輕量連續數值迴歸網路，訓練收斂快速且穩定。',
    descEn: 'Lightweight continuous-value regressor with fast, stable convergence.',
    recommendedForZh: '角度測量、座標定位與單標量預測',
    recommendedForEn: 'Angle estimation, coordinates, and scalar outputs',
  },
  {
    id: 'resnet50_reg',
    taskType: 'regression',
    name: 'ResNet-50 Regressor',
    family: 'Deep Regression',
    params: '25.6 M',
    speedZh: '~35 ms',
    speedEn: '~35 ms',
    metricLabel: 'Task Type',
    metricValue: 'Continuous',
    descZh: '深層特徵迴歸架構，具備較強的非線性擬合能力。',
    descEn: 'Deep feature regressor with stronger nonlinear fitting capacity.',
    recommendedForZh: '多目標連續數值預測與品質評分',
    recommendedForEn: 'Complex continuous prediction and quality scoring',
  },
  {
    id: 'efficientnet_b0_reg',
    taskType: 'regression',
    name: 'EfficientNet-B0 Reg',
    family: 'Compound Regression',
    params: '5.3 M',
    speedZh: '~22 ms',
    speedEn: '~22 ms',
    metricLabel: 'Task Type',
    metricValue: 'Continuous',
    descZh: '高效率輕量迴歸器，在較低運算量下保持數值準確度。',
    descEn: 'Efficient lightweight regressor maintaining numerical precision.',
    recommendedForZh: '邊緣端即時連續數值預測',
    recommendedForEn: 'Edge real-time continuous value prediction',
  },
  {
    id: 'mobilenet_v3_reg',
    taskType: 'regression',
    name: 'MobileNetV3 Reg',
    family: 'Mobile Regression',
    params: '2.5 M',
    speedZh: '~8 ms',
    speedEn: '~8 ms',
    metricLabel: 'Task Type',
    metricValue: 'Continuous',
    descZh: '輕量數值迴歸器，適合低延遲需求與小資源環境。',
    descEn: 'Lightweight value regressor for low-latency embedded pipelines.',
    recommendedForZh: '嵌入式即時監控與傳感器融合',
    recommendedForEn: 'Embedded real-time monitoring and sensor fusion',
  },

  // FEATURE IDENTIFICATION
  {
    id: 'resnet50_fpn',
    taskType: 'feature',
    name: 'ResNet-50 + FPN',
    family: 'Feature Pyramid',
    params: '25.6 M',
    speedZh: '~30 ms',
    speedEn: '~30 ms',
    metricLabel: 'Feature Dim',
    metricValue: '256-d Multi-Scale',
    descZh: '多尺度特徵金字塔架構，同時保留深淺層空間與語意特徵。',
    descEn: 'Multi-scale feature pyramid retaining shallow spatial and deep semantic cues.',
    recommendedForZh: '多尺度局部特徵與比對',
    recommendedForEn: 'Multi-scale local feature matching',
  },
  {
    id: 'hrnet_w18',
    taskType: 'feature',
    name: 'HRNet-W18',
    family: 'High-Resolution Net',
    params: '9.6 M',
    speedZh: '~20 ms',
    speedEn: '~20 ms',
    metricLabel: 'Resolution',
    metricValue: 'High-Res',
    descZh: '維持高解析度並行分支，減少降取樣造成的空間細節流失。',
    descEn: 'Parallel high-resolution branches preserving fine spatial localization.',
    recommendedForZh: '精細關鍵點與局部幾何定位',
    recommendedForEn: 'Fine keypoint and geometric localization',
  },
  {
    id: 'swin_tiny',
    taskType: 'feature',
    name: 'Swin-Tiny',
    family: 'Hierarchical ViT',
    params: '28.3 M',
    speedZh: '~28 ms',
    speedEn: '~28 ms',
    metricLabel: 'Embedding',
    metricValue: 'Hierarchical',
    descZh: '移動視窗階層式 Transformer，兼顧局部紋理與全域結構特徵。',
    descEn: 'Shifted-window hierarchical Transformer capturing local and global structure.',
    recommendedForZh: '圖像檢索與微小特徵識別',
    recommendedForEn: 'Image retrieval and fine feature recognition',
  },
  {
    id: 'vit_feature',
    taskType: 'feature',
    name: 'ViT-B/16 Feature',
    family: 'Vision Transformer',
    params: '86.6 M',
    speedZh: '~45 ms',
    speedEn: '~45 ms',
    metricLabel: 'Embedding',
    metricValue: '768-d Vector',
    descZh: '輸出 768 維全域嵌入特徵向量，適合視覺相似度檢索。',
    descEn: 'Outputs 768-dim global feature embeddings for visual similarity search.',
    recommendedForZh: '特徵相似度比對與檢索',
    recommendedForEn: 'Similarity matching and visual retrieval',
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

  const taskModels = ALL_MODELS.filter((m) => m.taskType === taskType);
  const displayedModels =
    taskType === 'detection' && tierFilter !== 'all'
      ? taskModels.filter((m) => m.tier === tierFilter)
      : taskModels;

  const isDetection = taskType === 'detection';

  const tierLabel = (tier: string) => {
    if (tier === 'realtime') return isZh ? '即時級' : 'Real-time';
    if (tier === 'edge') return isZh ? '邊緣級' : 'Edge';
    return isZh ? '高精度' : 'High Precision';
  };

  const filterTabs = [
    { id: 'all' as ModelTier, label: isZh ? '全部' : 'All', count: taskModels.length },
    { id: 'realtime' as ModelTier, label: isZh ? '即時級' : 'Real-time', count: taskModels.filter((m) => m.tier === 'realtime').length },
    { id: 'edge' as ModelTier, label: isZh ? '邊緣級' : 'Edge', count: taskModels.filter((m) => m.tier === 'edge').length },
    { id: 'flagship' as ModelTier, label: isZh ? '高精度' : 'High Precision', count: taskModels.filter((m) => m.tier === 'flagship').length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {isDetection && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} strokeWidth={1.5} />
            <span>{isZh ? '規模篩選' : 'Tier'}</span>
          </span>
          <div className="vf-tabs" role="tablist" aria-label={isZh ? '模型規模篩選' : 'Filter by tier'}>
            {filterTabs.map((tab) => {
              const isTabActive = tierFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isTabActive}
                  className={`vf-tab ${isTabActive ? 'active' : ''}`}
                  onClick={() => setTierFilter(tab.id)}
                >
                  <span>{tab.label}</span>
                  <span className="vf-num" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        {displayedModels.map((m) => {
          const isSelected = selectedModel === m.id;

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectModel(m.id)}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="badge badge-neutral">{m.family}</span>
                    {m.tier && <span className="badge badge-neutral">{tierLabel(m.tier)}</span>}
                  </div>
                  {isSelected ? (
                    <CheckCircle2 size={16} strokeWidth={1.5} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                  ) : (
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: '1px solid var(--border-strong)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>

                <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  {m.name}
                </h4>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.45 }}>
                  {isZh ? m.descZh : m.descEn}
                </p>

                <div
                  style={{
                    fontSize: '12px',
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                    background: 'var(--bg-surface-elevated)',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-xs)',
                    marginBottom: '12px',
                  }}
                >
                  {isZh ? m.recommendedForZh : m.recommendedForEn}
                </div>
              </div>

              <div
                className="vf-num"
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '10px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isZh ? '參數量' : 'Params'}</div>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.params}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isZh ? '推論耗時' : 'Latency'}</div>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{isZh ? m.speedZh : m.speedEn}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.metricLabel}</div>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.metricValue}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
