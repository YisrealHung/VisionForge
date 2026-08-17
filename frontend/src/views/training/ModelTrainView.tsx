import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Play,
  Sliders,
  Sparkles,
  Check,
  Layers,
  Cpu,
  Info,
  ArrowRight,
  ShieldCheck,
  Scan,
  Maximize2
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  PresetType,
  ModelArchitecture,
  OptimizerType,
  Hyperparameters,
  AugmentationConfig,
  TrainConfigRequest,
  TaskType
} from '../../types';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { PresetSelector, PRESET_CONFIGS } from '../../components/training/PresetSelector';
import { ModelSelector, ALL_MODELS } from '../../components/training/ModelSelector';

export const ModelTrainView: React.FC = () => {
  const { activeProject, setCurrentView, systemHealth } = useProject();

  const taskType: TaskType = activeProject?.task_type || 'classification';

  // Default architecture based on task
  const getDefaultArchitecture = (task: TaskType): ModelArchitecture => {
    switch (task) {
      case 'detection':
        return 'yolo26_s';
      case 'regression':
        return 'resnet18_reg';
      case 'feature':
        return 'resnet50_fpn';
      case 'classification':
      default:
        return 'resnet18';
    }
  };

  const getDefaultImageSize = (task: TaskType): number => {
    return task === 'detection' ? 640 : 224;
  };

  const [preset, setPreset] = useState<PresetType>('fast');
  const [architecture, setArchitecture] = useState<ModelArchitecture>(() => getDefaultArchitecture(taskType));
  const [epochs, setEpochs] = useState<number>(5);
  const [batchSize, setBatchSize] = useState<number>(16);
  const [learningRate, setLearningRate] = useState<number>(0.001);
  const [optimizer, setOptimizer] = useState<OptimizerType>('adamw');
  const [imageSize, setImageSize] = useState<number>(() => getDefaultImageSize(taskType));
  const [pretrained, setPretrained] = useState<boolean>(true);
  const [earlyStoppingPatience, setEarlyStoppingPatience] = useState<number>(0);

  // Data Augmentations
  const [randomFlip, setRandomFlip] = useState<boolean>(true);
  const [randomRotation, setRandomRotation] = useState<boolean>(true);
  const [colorJitter, setColorJitter] = useState<boolean>(false);
  const [mosaic, setMosaic] = useState<boolean>(true);
  const [randomCrop, setRandomCrop] = useState<boolean>(false);

  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync architecture and default image size when project taskType changes
  useEffect(() => {
    if (!activeProject) return;
    const currentModelObj = ALL_MODELS.find((m) => m.id === architecture);
    if (!currentModelObj || currentModelObj.taskType !== activeProject.task_type) {
      setArchitecture(getDefaultArchitecture(activeProject.task_type));
      setImageSize(getDefaultImageSize(activeProject.task_type));
    }
  }, [activeProject?.id, activeProject?.task_type]);

  // Handle Preset Change
  const handleSelectPreset = (p: PresetType) => {
    setPreset(p);
    if (p !== 'custom') {
      const cfg = PRESET_CONFIGS[p].params;
      if (cfg.epochs) setEpochs(cfg.epochs);
      if (cfg.batch_size) setBatchSize(cfg.batch_size);
      if (cfg.learning_rate) setLearningRate(cfg.learning_rate);
      if (cfg.optimizer) setOptimizer(cfg.optimizer);
      if (cfg.early_stopping_patience !== undefined) setEarlyStoppingPatience(cfg.early_stopping_patience);
    }
  };

  const handleStartTraining = async () => {
    if (!activeProject) return;

    try {
      setStarting(true);
      setErrorMsg('');

      const config: TrainConfigRequest = {
        preset,
        hyperparameters: {
          architecture,
          epochs,
          batch_size: batchSize,
          learning_rate: learningRate,
          optimizer,
          pretrained,
          image_size: imageSize,
          early_stopping_patience: earlyStoppingPatience,
        },
        augmentation: {
          random_flip: randomFlip,
          random_rotation: randomRotation,
          color_jitter: colorJitter,
          random_crop: randomCrop,
          mosaic: taskType === 'detection' ? mosaic : false,
        },
      };

      // 1. Navigate immediately to monitor view
      setCurrentView('monitor');

      // 2. Dispatch start training request
      await api.startTraining(activeProject.id, config);
    } catch (err: any) {
      console.error('Failed to start training:', err);
    } finally {
      setStarting(false);
    }
  };

  if (!activeProject) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>請先在頂部選單選擇或建立一個專案</p>
      </div>
    );
  }

  const getTaskTitle = (task: TaskType) => {
    switch (task) {
      case 'detection':
        return '物件偵測模型架構 (Object Detection)';
      case 'regression':
        return '圖像迴歸模型架構 (Image Regression)';
      case 'feature':
        return '特徵提取模型架構 (Feature Extraction)';
      case 'classification':
      default:
        return '視覺分類模型架構 (Image Classification)';
    }
  };

  const getPretrainedLabel = (task: TaskType) => {
    switch (task) {
      case 'detection':
        return '載入 COCO 預訓練權重 (COCO Pretrained Transfer Learning)';
      case 'regression':
        return '載入特徵提取預訓練權重 (Transfer Learning)';
      case 'feature':
        return '載入多尺度特徵預訓練權重 (Pretrained Feature Backbone)';
      case 'classification':
      default:
        return '載入 ImageNet 預訓練權重 (ImageNet Transfer Learning)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            🧠 模型配置與訓練中心
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            專案：<span style={{ color: '#EB7E83', fontWeight: 600 }}>{activeProject.name}</span> · 任務類型：<span style={{ color: '#557B86', fontWeight: 600 }}>{activeProject.task_type.toUpperCase()}</span> · 選擇深度學習架構與超參數調整
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          icon={<Play size={16} />}
          loading={starting}
          onClick={handleStartTraining}
        >
          🚀 立即啟動模型訓練
        </Button>
      </div>

      {errorMsg && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(235, 126, 131, 0.16)', border: '1px solid rgba(235, 126, 131, 0.35)', color: '#fca5a8', fontSize: '0.85rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Step 1: Preset Templates */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={17} color="#557B86" /> 步驟一：選擇訓練預設模板
        </h3>
        <PresetSelector currentPreset={preset} onSelectPreset={handleSelectPreset} />
      </div>

      {/* Step 2: Model Architecture */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BrainCircuit size={17} color="#EB7E83" /> 步驟二：選擇{getTaskTitle(taskType)}
        </h3>
        <ModelSelector
          taskType={taskType}
          selectedModel={architecture}
          onSelectModel={setArchitecture}
        />
      </div>

      {/* Step 3: Hyperparameter Fine-tuning */}
      <Card>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sliders size={17} color="#E1998A" /> 步驟三：超參數設定 (Hyperparameters)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {/* Epochs */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>訓練輪數 (Epochs)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={epochs}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(500, Number(e.target.value) || 1));
                    setEpochs(val);
                    setPreset('custom');
                  }}
                  style={{
                    width: '64px',
                    padding: '2px 6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#EB7E83',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    textAlign: 'center',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>輪</span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={500}
              value={epochs}
              onChange={(e) => {
                setEpochs(Number(e.target.value));
                setPreset('custom');
              }}
              style={{ width: '100%', accentColor: '#EB7E83' }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>範圍: 1 ~ 500 輪</span>
          </div>

          {/* Batch Size */}
          <div className="form-group">
            <label className="form-label">批次大小 (Batch Size)</label>
            <select
              className="form-select"
              value={batchSize}
              onChange={(e) => {
                setBatchSize(Number(e.target.value));
                setPreset('custom');
              }}
            >
              <option value={4}>4 (超微批次 / 低顯存)</option>
              <option value={8}>8 (省記憶體 / 偵測推薦)</option>
              <option value={16}>16 (標準推薦預設)</option>
              <option value={32}>32 (快速批次訓練)</option>
              <option value={64}>64 (大型批次)</option>
            </select>
          </div>

          {/* Learning Rate */}
          <div className="form-group">
            <label className="form-label">學習率 (Learning Rate)</label>
            <select
              className="form-select"
              value={learningRate}
              onChange={(e) => {
                setLearningRate(Number(e.target.value));
                setPreset('custom');
              }}
            >
              <option value={0.01}>0.01 (較快收斂)</option>
              <option value={0.001}>0.001 (標準推薦)</option>
              <option value={0.0005}>0.0005 (微調推薦)</option>
              <option value={0.0001}>0.0001 (高精細微調)</option>
            </select>
          </div>

          {/* Optimizer */}
          <div className="form-group">
            <label className="form-label">優化器 (Optimizer)</label>
            <select
              className="form-select"
              value={optimizer}
              onChange={(e) => {
                setOptimizer(e.target.value as OptimizerType);
                setPreset('custom');
              }}
            >
              <option value="adamw">AdamW (權重衰減，最穩定)</option>
              <option value="adam">Adam (經典自適應)</option>
              <option value="sgd">SGD + Momentum (傳統動量)</option>
            </select>
          </div>

          {/* Image Size Resolution */}
          <div className="form-group">
            <label className="form-label">輸入影像尺寸 (Input Resolution)</label>
            <select
              className="form-select"
              value={imageSize}
              onChange={(e) => {
                setImageSize(Number(e.target.value));
                setPreset('custom');
              }}
            >
              {taskType === 'detection' ? (
                <>
                  <option value={640}>640 × 640 (標準高精度偵測，推薦)</option>
                  <option value={512}>512 × 512 (均衡解析度)</option>
                  <option value={416}>416 × 416 (經典 YOLO 尺寸)</option>
                  <option value={320}>320 × 320 (極速邊緣推論)</option>
                </>
              ) : (
                <>
                  <option value={224}>224 × 224 (標準 ImageNet 推薦)</option>
                  <option value={256}>256 × 256 (高解析度分類)</option>
                  <option value={384}>384 × 384 (細粒度分類)</option>
                  <option value={128}>128 × 128 (快速輕量)</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Checkbox toggles */}
        <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={pretrained}
              onChange={(e) => setPretrained(e.target.checked)}
            />
            <span>{getPretrainedLabel(taskType)}</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={earlyStoppingPatience > 0}
              onChange={(e) => setEarlyStoppingPatience(e.target.checked ? 5 : 0)}
            />
            <span>啟用早停機制 (Early Stopping, 容忍 5 輪無提升)</span>
          </label>
        </div>
      </Card>

      {/* Step 4: Data Augmentation */}
      <Card>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={17} color="#10b981" /> 步驟四：資料增強配置 (Data Augmentation)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Mosaic Augmentation (for detection) */}
          {taskType === 'detection' && (
            <label
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: mosaic ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-surface-elevated)',
                border: `1px solid ${mosaic ? '#06b6d4' : 'var(--border-subtle)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: mosaic ? '#67e8f9' : 'inherit' }}>
                  🧩 Mosaic 馬賽克拼接
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>4 圖隨機拼接增強多尺度特徵 (p=0.5)</div>
              </div>
              <input
                type="checkbox"
                checked={mosaic}
                onChange={(e) => setMosaic(e.target.checked)}
              />
            </label>
          )}

          <label
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: randomFlip ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-elevated)',
              border: `1px solid ${randomFlip ? '#10b981' : 'var(--border-subtle)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>水平隨機翻轉</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Random Horizontal Flip (p=0.5)</div>
            </div>
            <input
              type="checkbox"
              checked={randomFlip}
              onChange={(e) => setRandomFlip(e.target.checked)}
            />
          </label>

          <label
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: randomRotation ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-elevated)',
              border: `1px solid ${randomRotation ? '#10b981' : 'var(--border-subtle)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>隨機微角度旋轉</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Random Rotation (±15°)</div>
            </div>
            <input
              type="checkbox"
              checked={randomRotation}
              onChange={(e) => setRandomRotation(e.target.checked)}
            />
          </label>

          <label
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: colorJitter ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-elevated)',
              border: `1px solid ${colorJitter ? '#10b981' : 'var(--border-subtle)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>色彩擾動</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Color Jitter (亮度/對比)</div>
            </div>
            <input
              type="checkbox"
              checked={colorJitter}
              onChange={(e) => setColorJitter(e.target.checked)}
            />
          </label>

          {taskType === 'detection' && (
            <label
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: randomCrop ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-elevated)',
                border: `1px solid ${randomCrop ? '#10b981' : 'var(--border-subtle)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>隨機縮放與裁切</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Random Scale & Crop (0.8~1.2)</div>
              </div>
              <input
                type="checkbox"
                checked={randomCrop}
                onChange={(e) => setRandomCrop(e.target.checked)}
              />
            </label>
          )}
        </div>
      </Card>

      {/* Start Button Bottom Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <Button
          variant="primary"
          size="lg"
          icon={<Play size={16} />}
          loading={starting}
          onClick={handleStartTraining}
          style={{ width: '100%', maxWidth: '320px' }}
        >
          🚀 立即啟動模型訓練
        </Button>
      </div>
    </div>
  );
};
