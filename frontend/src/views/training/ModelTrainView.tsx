import React, { useState, useEffect } from 'react';
import { BrainCircuit, Play, Sliders, Layers, Gauge } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  PresetType,
  ModelArchitecture,
  OptimizerType,
  TrainConfigRequest,
  TaskType,
} from '../../types';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { TaskBadge } from '../../components/common/Badge';
import { PresetSelector, PRESET_CONFIGS } from '../../components/training/PresetSelector';
import { ModelSelector, ALL_MODELS } from '../../components/training/ModelSelector';

export const ModelTrainView: React.FC = () => {
  const { activeProject, setCurrentView, language } = useProject();
  const isZh = language === 'zh-TW';

  const taskType: TaskType = activeProject?.task_type || 'classification';

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

  const [randomFlip, setRandomFlip] = useState<boolean>(true);
  const [randomRotation, setRandomRotation] = useState<boolean>(true);
  const [colorJitter, setColorJitter] = useState<boolean>(false);
  const [mosaic, setMosaic] = useState<boolean>(true);
  const [randomCrop, setRandomCrop] = useState<boolean>(false);

  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!activeProject) return;
    const currentModelObj = ALL_MODELS.find((m) => m.id === architecture);
    if (!currentModelObj || currentModelObj.taskType !== activeProject.task_type) {
      setArchitecture(getDefaultArchitecture(activeProject.task_type));
      setImageSize(getDefaultImageSize(activeProject.task_type));
    }
  }, [activeProject?.id, activeProject?.task_type]);

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

      setCurrentView('monitor');
      await api.startTraining(activeProject.id, config);
    } catch (err: any) {
      console.error('Failed to start training:', err);
      setErrorMsg(err?.message || (isZh ? '無法啟動訓練' : 'Failed to start training'));
    } finally {
      setStarting(false);
    }
  };

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

  const getTaskTitle = (task: TaskType) => {
    switch (task) {
      case 'detection':
        return isZh ? '物件偵測架構' : 'Object detection architecture';
      case 'regression':
        return isZh ? '圖像迴歸架構' : 'Image regression architecture';
      case 'feature':
        return isZh ? '特徵提取架構' : 'Feature extraction architecture';
      case 'classification':
      default:
        return isZh ? '影像分類架構' : 'Image classification architecture';
    }
  };

  const getPretrainedLabel = (task: TaskType) => {
    switch (task) {
      case 'detection':
        return isZh ? '載入 COCO 預訓練權重 (遷移學習)' : 'Load COCO pretrained weights';
      case 'regression':
        return isZh ? '載入特徵預訓練權重 (遷移學習)' : 'Load pretrained feature weights';
      case 'feature':
        return isZh ? '載入骨幹預訓練權重 (遷移學習)' : 'Load pretrained backbone weights';
      case 'classification':
      default:
        return isZh ? '載入 ImageNet 預訓練權重 (遷移學習)' : 'Load ImageNet pretrained weights';
    }
  };

  const renderAugCard = (
    checked: boolean,
    onChange: (next: boolean) => void,
    title: string,
    desc: string
  ) => (
    <label
      style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-sm)',
        background: checked ? 'var(--accent-primary-soft)' : 'var(--bg-surface-elevated)',
        border: `1px solid ${checked ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        cursor: 'pointer',
        transition: 'background-color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
      }}
    >
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{title}</div>
        <div className="vf-num" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{desc}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer', flexShrink: 0 }}
      />
    </label>
  );

  return (
    <div className="vf-container">
      <div className="vf-page-header">
        <div className="vf-page-heading">
          <div className="vf-page-eyebrow">
            <BrainCircuit size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>{isZh ? '模型訓練' : 'Model training'}</span>
            <TaskBadge taskType={activeProject.task_type} />
          </div>
          <div className="vf-page-title-row">
            <h1 className="vf-page-title">{activeProject.name}</h1>
          </div>
        </div>

        <div className="vf-page-actions">
          <Button
            variant="primary"
            size="lg"
            icon={<Play size={16} strokeWidth={1.5} />}
            loading={starting}
            onClick={handleStartTraining}
          >
            {isZh ? '啟動訓練' : 'Start training'}
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-rose-soft)',
            border: '1px solid rgba(200, 30, 30, 0.28)',
            color: 'var(--accent-rose)',
            fontSize: '13px',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Step 1: Preset Templates */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gauge size={16} strokeWidth={1.5} color="var(--text-secondary)" aria-hidden="true" />
          <span>{isZh ? '1. 選擇訓練預設' : '1. Training preset'}</span>
        </h2>
        <PresetSelector currentPreset={preset} onSelectPreset={handleSelectPreset} />
      </section>

      {/* Step 2: Model Architecture */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BrainCircuit size={16} strokeWidth={1.5} color="var(--text-secondary)" aria-hidden="true" />
          <span>{isZh ? `2. 選擇${getTaskTitle(taskType)}` : `2. Select ${getTaskTitle(taskType)}`}</span>
        </h2>
        <ModelSelector
          taskType={taskType}
          selectedModel={architecture}
          onSelectModel={setArchitecture}
        />
      </section>

      {/* Step 3: Hyperparameters */}
      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={16} strokeWidth={1.5} color="var(--text-secondary)" aria-hidden="true" />
          <span>{isZh ? '3. 超參數設定' : '3. Hyperparameters'}</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                {isZh ? '訓練輪數 (Epochs)' : 'Epochs'}
              </label>
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
                  className="form-input vf-num"
                  style={{
                    width: '72px',
                    padding: '4px 8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    textAlign: 'center',
                  }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isZh ? '輪' : 'ep'}</span>
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
            <span className="vf-num" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {isZh ? '範圍：1–500 輪' : 'Range: 1–500'}
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{isZh ? '批次大小 (Batch Size)' : 'Batch Size'}</label>
            <select
              className="form-select vf-num"
              value={batchSize}
              onChange={(e) => {
                setBatchSize(Number(e.target.value));
                setPreset('custom');
              }}
            >
              <option value={4}>{isZh ? '4（低顯存）' : '4 (Low VRAM)'}</option>
              <option value={8}>{isZh ? '8（省記憶體／偵測推薦）' : '8 (Memory saving / Detection)'}</option>
              <option value={16}>{isZh ? '16（標準預設）' : '16 (Standard default)'}</option>
              <option value={32}>{isZh ? '32（快速批次）' : '32 (Fast batch)'}</option>
              <option value={64}>{isZh ? '64（大型批次）' : '64 (Large batch)'}</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{isZh ? '學習率 (Learning Rate)' : 'Learning Rate'}</label>
            <select
              className="form-select vf-num"
              value={learningRate}
              onChange={(e) => {
                setLearningRate(Number(e.target.value));
                setPreset('custom');
              }}
            >
              <option value={0.01}>{isZh ? '0.01（較快收斂）' : '0.01 (Faster convergence)'}</option>
              <option value={0.001}>{isZh ? '0.001（標準）' : '0.001 (Standard)'}</option>
              <option value={0.0005}>{isZh ? '0.0005（均衡微調）' : '0.0005 (Balanced fine-tune)'}</option>
              <option value={0.0001}>{isZh ? '0.0001（細緻微調）' : '0.0001 (Fine-grained tuning)'}</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{isZh ? '優化器 (Optimizer)' : 'Optimizer'}</label>
            <select
              className="form-select"
              value={optimizer}
              onChange={(e) => {
                setOptimizer(e.target.value as OptimizerType);
                setPreset('custom');
              }}
            >
              <option value="adamw">{isZh ? 'AdamW（權重衰減）' : 'AdamW (Weight decay)'}</option>
              <option value="adam">{isZh ? 'Adam（自適應）' : 'Adam (Adaptive)'}</option>
              <option value="sgd">{isZh ? 'SGD + Momentum' : 'SGD + Momentum'}</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{isZh ? '輸入影像尺寸' : 'Input Resolution'}</label>
            <select
              className="form-select vf-num"
              value={imageSize}
              onChange={(e) => {
                setImageSize(Number(e.target.value));
                setPreset('custom');
              }}
            >
              {taskType === 'detection' ? (
                <>
                  <option value={640}>{isZh ? '640 × 640（標準偵測）' : '640 × 640 (Standard detection)'}</option>
                  <option value={512}>{isZh ? '512 × 512（均衡）' : '512 × 512 (Balanced)'}</option>
                  <option value={416}>{isZh ? '416 × 416（快速 YOLO）' : '416 × 416 (Fast YOLO)'}</option>
                  <option value={320}>{isZh ? '320 × 320（邊緣裝置）' : '320 × 320 (Edge inference)'}</option>
                </>
              ) : (
                <>
                  <option value={224}>{isZh ? '224 × 224（ImageNet 標準）' : '224 × 224 (ImageNet standard)'}</option>
                  <option value={256}>{isZh ? '256 × 256（高解析）' : '256 × 256 (High-res)'}</option>
                  <option value={384}>{isZh ? '384 × 384（細粒度）' : '384 × 384 (Fine-grained)'}</option>
                  <option value={128}>{isZh ? '128 × 128（輕量快速）' : '128 × 128 (Lightweight)'}</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', marginTop: '20px', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={pretrained}
              onChange={(e) => setPretrained(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <span>{getPretrainedLabel(taskType)}</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={earlyStoppingPatience > 0}
              onChange={(e) => setEarlyStoppingPatience(e.target.checked ? 5 : 0)}
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <span>{isZh ? '啟用早停機制（容忍 5 輪無提升）' : 'Enable early stopping (patience: 5 epochs)'}</span>
          </label>
        </div>
      </Card>

      {/* Step 4: Data Augmentation */}
      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} strokeWidth={1.5} color="var(--text-secondary)" aria-hidden="true" />
          <span>{isZh ? '4. 資料增強配置' : '4. Data augmentation'}</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {taskType === 'detection' &&
            renderAugCard(
              mosaic,
              setMosaic,
              isZh ? 'Mosaic 四圖拼接' : 'Mosaic augmentation',
              isZh ? '隨機 4 圖拼接增強多尺度特徵 (p=0.5)' : '4-image random mosaic (p=0.5)'
            )}
          {renderAugCard(
            randomFlip,
            setRandomFlip,
            isZh ? '水平隨機翻轉' : 'Random horizontal flip',
            'p=0.5'
          )}
          {renderAugCard(
            randomRotation,
            setRandomRotation,
            isZh ? '隨機角度旋轉' : 'Random rotation',
            '±15°'
          )}
          {renderAugCard(
            colorJitter,
            setColorJitter,
            isZh ? '色彩擾動' : 'Color jitter',
            isZh ? '亮度與對比度調整' : 'Brightness and contrast'
          )}
          {taskType === 'detection' &&
            renderAugCard(
              randomCrop,
              setRandomCrop,
              isZh ? '隨機縮放與裁切' : 'Random scale & crop',
              '0.8–1.2'
            )}
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="primary"
          size="lg"
          icon={<Play size={16} strokeWidth={1.5} />}
          loading={starting}
          onClick={handleStartTraining}
        >
          {isZh ? '啟動訓練' : 'Start training'}
        </Button>
      </div>
    </div>
  );
};
