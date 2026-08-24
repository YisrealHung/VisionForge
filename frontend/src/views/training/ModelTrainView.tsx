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
  const { activeProject, setCurrentView, systemHealth, language } = useProject();
  const isZh = language === 'zh-TW';

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
        <p style={{ color: 'var(--text-muted)' }}>{isZh ? '請先在頂部選單選擇或建立一個專案' : 'Please select or create a project from the top menu first'}</p>
      </div>
    );
  }

  const getTaskTitle = (task: TaskType) => {
    switch (task) {
      case 'detection':
        return isZh ? '物件偵測模型架構 (Object Detection)' : 'Object Detection Architecture';
      case 'regression':
        return isZh ? '圖像迴歸模型架構 (Image Regression)' : 'Image Regression Architecture';
      case 'feature':
        return isZh ? '特徵提取模型架構 (Feature Extraction)' : 'Feature Extraction Architecture';
      case 'classification':
      default:
        return isZh ? '視覺分類模型架構 (Image Classification)' : 'Image Classification Architecture';
    }
  };

  const getPretrainedLabel = (task: TaskType) => {
    switch (task) {
      case 'detection':
        return isZh ? '載入 COCO 預訓練權重 (COCO Pretrained Transfer Learning)' : 'Load COCO Pretrained Weights';
      case 'regression':
        return isZh ? '載入特徵提取預訓練權重 (Transfer Learning)' : 'Load Pretrained Feature Weights';
      case 'feature':
        return isZh ? '載入多尺度特徵預訓練權重 (Pretrained Feature Backbone)' : 'Load Pretrained Backbone Weights';
      case 'classification':
      default:
        return isZh ? '載入 ImageNet 預訓練權重 (ImageNet Transfer Learning)' : 'Load ImageNet Pretrained Weights';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            🧠 {isZh ? '模型配置與訓練中心' : 'Model Configuration & Training Center'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {isZh ? '專案：' : 'Project: '}<span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{activeProject.name}</span> · {isZh ? '任務類型：' : 'Task: '}<span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>{activeProject.task_type.toUpperCase()}</span> · {isZh ? '選擇深度學習架構與超參數調整' : 'Select deep learning architecture and tune hyperparameters'}
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          icon={<Play size={16} />}
          loading={starting}
          onClick={handleStartTraining}
        >
          🚀 {isZh ? '立即啟動模型訓練' : 'Start Training'}
        </Button>
      </div>

      {errorMsg && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(235, 87, 87, 0.16)', border: '1px solid rgba(235, 87, 87, 0.35)', color: '#fca5a8', fontSize: '0.85rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Step 1: Preset Templates */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={17} color="var(--accent-teal)" /> {isZh ? '步驟一：選擇訓練預設模板' : 'Step 1: Select Training Preset'}
        </h3>
        <PresetSelector currentPreset={preset} onSelectPreset={handleSelectPreset} />
      </div>

      {/* Step 2: Model Architecture */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BrainCircuit size={17} color="var(--accent-primary)" /> {isZh ? `步驟二：選擇${getTaskTitle(taskType)}` : `Step 2: Select ${getTaskTitle(taskType)}`}
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
          <Sliders size={17} color="var(--accent-peach)" /> {isZh ? '步驟三：超參數設定 (Hyperparameters)' : 'Step 3: Hyperparameter Settings'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {/* Epochs */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>{isZh ? '訓練輪數 (Epochs)' : 'Epochs'}</label>
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
                    color: 'var(--accent-primary)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    textAlign: 'center',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isZh ? '輪' : 'ep'}</span>
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
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isZh ? '範圍: 1 ~ 500 輪' : 'Range: 1 ~ 500'}</span>
          </div>

          {/* Batch Size */}
          <div className="form-group">
            <label className="form-label">{isZh ? '批次大小 (Batch Size)' : 'Batch Size'}</label>
            <select
              className="form-select"
              value={batchSize}
              onChange={(e) => {
                setBatchSize(Number(e.target.value));
                setPreset('custom');
              }}
            >
              <option value={4}>{isZh ? '4 (超微批次 / 低顯存)' : '4 (Micro batch / Low VRAM)'}</option>
              <option value={8}>{isZh ? '8 (省記憶體 / 偵測推薦)' : '8 (Memory saving / Rec. for Detection)'}</option>
              <option value={16}>{isZh ? '16 (標準推薦預設)' : '16 (Standard / Default)'}</option>
              <option value={32}>{isZh ? '32 (快速批次訓練)' : '32 (Fast batch)'}</option>
              <option value={64}>{isZh ? '64 (大型批次)' : '64 (Large batch)'}</option>
            </select>
          </div>

          {/* Learning Rate */}
          <div className="form-group">
            <label className="form-label">{isZh ? '學習率 (Learning Rate)' : 'Learning Rate'}</label>
            <select
              className="form-select"
              value={learningRate}
              onChange={(e) => {
                setLearningRate(Number(e.target.value));
                setPreset('custom');
              }}
            >
              <option value={0.01}>{isZh ? '0.01 (較快收斂)' : '0.01 (Faster convergence)'}</option>
              <option value={0.001}>{isZh ? '0.001 (標準推薦)' : '0.001 (Standard recommended)'}</option>
              <option value={0.0005}>{isZh ? '0.0005 (微調推薦)' : '0.0005 (Fine-tuning recommended)'}</option>
              <option value={0.0001}>{isZh ? '0.0001 (高精細微調)' : '0.0001 (High-precision fine-tuning)'}</option>
            </select>
          </div>

          {/* Optimizer */}
          <div className="form-group">
            <label className="form-label">{isZh ? '優化器 (Optimizer)' : 'Optimizer'}</label>
            <select
              className="form-select"
              value={optimizer}
              onChange={(e) => {
                setOptimizer(e.target.value as OptimizerType);
                setPreset('custom');
              }}
            >
              <option value="adamw">{isZh ? 'AdamW (權重衰減，最穩定)' : 'AdamW (Weight Decay, Stable)'}</option>
              <option value="adam">{isZh ? 'Adam (經典自適應)' : 'Adam (Classic Adaptive)'}</option>
              <option value="sgd">{isZh ? 'SGD + Momentum (傳統動量)' : 'SGD + Momentum'}</option>
            </select>
          </div>

          {/* Image Size Resolution */}
          <div className="form-group">
            <label className="form-label">{isZh ? '輸入影像尺寸 (Input Resolution)' : 'Input Resolution'}</label>
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
                  <option value={640}>{isZh ? '640 × 640 (標準高精度偵測，推薦)' : '640 × 640 (Standard High-Res, Recommended)'}</option>
                  <option value={512}>{isZh ? '512 × 512 (均衡解析度)' : '512 × 512 (Balanced)'}</option>
                  <option value={416}>{isZh ? '416 × 416 (經典 YOLO 尺寸)' : '416 × 416 (Classic YOLO)'}</option>
                  <option value={320}>{isZh ? '320 × 320 (極速邊緣推論)' : '320 × 320 (Edge Inference)'}</option>
                </>
              ) : (
                <>
                  <option value={224}>{isZh ? '224 × 224 (標準 ImageNet 推薦)' : '224 × 224 (ImageNet Standard)'}</option>
                  <option value={256}>{isZh ? '256 × 256 (高解析度分類)' : '256 × 256 (High-Res Classification)'}</option>
                  <option value={384}>{isZh ? '384 × 384 (細粒度分類)' : '384 × 384 (Fine-grained)'}</option>
                  <option value={128}>{isZh ? '128 × 128 (快速輕量)' : '128 × 128 (Lightweight & Fast)'}</option>
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
            <span>{isZh ? '啟用早停機制 (Early Stopping, 容忍 5 輪無提升)' : 'Enable Early Stopping (Patience: 5 Epochs)'}</span>
          </label>
        </div>
      </Card>

      {/* Step 4: Data Augmentation */}
      <Card>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={17} color="#10b981" /> {isZh ? '步驟四：資料增強配置 (Data Augmentation)' : 'Step 4: Data Augmentation'}
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
                  🧩 {isZh ? 'Mosaic 馬賽克拼接' : 'Mosaic Augmentation'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isZh ? '4 圖隨機拼接增強多尺度特徵 (p=0.5)' : '4-image random mosaic (p=0.5)'}</div>
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
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{isZh ? '水平隨機翻轉' : 'Random Horizontal Flip'}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isZh ? 'Random Horizontal Flip (p=0.5)' : 'p=0.5'}</div>
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
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{isZh ? '隨機微角度旋轉' : 'Random Rotation'}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isZh ? 'Random Rotation (±15°)' : '±15°'}</div>
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
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{isZh ? '色彩擾動' : 'Color Jitter'}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isZh ? 'Color Jitter (亮度/對比)' : 'Brightness/Contrast'}</div>
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
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{isZh ? '隨機縮放與裁切' : 'Random Scale & Crop'}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isZh ? 'Random Scale & Crop (0.8~1.2)' : '0.8~1.2'}</div>
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
          🚀 {isZh ? '立即啟動模型訓練' : 'Start Training'}
        </Button>
      </div>
    </div>
  );
};
