import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  Square,
  CheckCircle2,
  TrendingUp,
  Cpu,
  ArrowRight,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { TrainingStatus, EpochMetric } from '../../types';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { MetricsChart } from '../../components/training/MetricsChart';
import { TerminalLogger } from '../../components/training/TerminalLogger';

// Long runs produce thousands of log lines; rendering all of them makes the page progressively slower.
const MAX_LOG_LINES = 1000;
const tail = (lines: string[]) => (lines.length > MAX_LOG_LINES ? lines.slice(-MAX_LOG_LINES) : lines);

export const MonitorView: React.FC = () => {
  const { activeProject, setCurrentView, systemHealth, language } = useProject();
  const isZh = language === 'zh-TW';
  const [status, setStatus] = useState<TrainingStatus | null>(null);
  const [history, setHistory] = useState<EpochMetric[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [stopping, setStopping] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const projectId = activeProject?.id ?? null;
  // The project the view is currently showing; late responses for another project are dropped.
  const currentProjectRef = useRef<string | null>(projectId);
  currentProjectRef.current = projectId;

  // Poll status fallback (the server copy is the source of truth for logs/history).
  const fetchStatus = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await api.getTrainingStatus(projectId);
      if (currentProjectRef.current !== projectId) return;
      setStatus(data);
      if (data.history && data.history.length > 0) {
        setHistory(data.history);
      }
      if (data.logs && data.logs.length > 0) {
        const next = tail(data.logs);
        // Keep the same array (no re-render of up to MAX_LOG_LINES rows) when nothing changed,
        // e.g. while the WebSocket already delivered these lines.
        setLogs((prev) =>
          prev.length === next.length && prev[prev.length - 1] === next[next.length - 1] ? prev : next
        );
      }
    } catch (err) {
      console.error('Failed to get training status:', err);
    }
  }, [projectId]);

  // Connect WebSocket (keyed by project id so re-fetching the project list does not reconnect)
  useEffect(() => {
    if (!projectId) return;

    // Reset the previous project's data when switching projects.
    setStatus(null);
    setHistory([]);
    setLogs([]);

    fetchStatus();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/projects/${projectId}/train/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'init') {
          setStatus(payload.status);
          if (payload.status?.history) {
            setHistory(payload.status.history);
          }
          if (payload.logs && payload.logs.length > 0) {
            setLogs(tail(payload.logs));
          } else if (payload.status?.logs && payload.status.logs.length > 0) {
            setLogs(tail(payload.status.logs));
          }
        } else if (payload.type === 'log') {
          setLogs((prev) => tail([...prev, payload.message]));
        } else if (payload.type === 'metric') {
          const metric: EpochMetric = payload.data;
          const cappedEpoch = Math.min(metric.total_epochs, metric.epoch);
          setHistory((prev) => {
            const exists = prev.some((m) => m.epoch === cappedEpoch);
            if (exists) return prev.map((m) => (m.epoch === cappedEpoch ? { ...metric, epoch: cappedEpoch } : m));
            return [...prev, { ...metric, epoch: cappedEpoch }];
          });
          setStatus((prev) =>
            prev
              ? {
                ...prev,
                current_epoch: cappedEpoch,
                total_epochs: metric.total_epochs,
                best_val_acc: metric.best_val_acc,
              }
              : null
          );
        }
      } catch (err) {
        console.error('WS message parse error:', err);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    const pollTimer = setInterval(fetchStatus, 3000);

    return () => {
      clearInterval(pollTimer);
      ws.onmessage = null;
      ws.onclose = null;
      ws.close();
      setWsConnected(false);
    };
  }, [projectId, fetchStatus]);

  const handleStopTraining = async () => {
    if (!activeProject) return;
    try {
      setStopping(true);
      await api.stopTraining(activeProject.id);
      await fetchStatus();
    } catch (err) {
      alert(isZh ? '停止訓練指令失敗' : 'Failed to send stop training command');
    } finally {
      setStopping(false);
    }
  };

  if (!activeProject) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>{isZh ? '請先在頂部選單選擇專案' : 'Please select a project from the top menu first'}</div>;
  }

  const isTraining = status?.status === 'training';
  const isCompleted = status?.status === 'completed';
  const isStopped = status?.status === 'stopped';
  const isFailed = status?.status === 'failed';

  const totalEpochs = status?.total_epochs || 1;
  const currentEpoch = Math.min(totalEpochs, status?.current_epoch || 0);
  const progressPercent = Math.min(100, Math.round((currentEpoch / totalEpochs) * 100));

  const latestMetric = history[history.length - 1] || null;

  const isDetection = activeProject.task_type === 'detection';
  const isRegression = activeProject.task_type === 'regression';

  // Dynamic Architecture Model Name and Description
  const rawArch = (status?.model_architecture || '').toLowerCase();

  let modelName = isZh ? '物件偵測' : 'Object Detection';
  let metricSub = isZh ? 'mAP@0.5 (IoU=0.5 平均精確率)' : 'mAP@0.5 (Mean Average Precision)';
  let lossSub = isZh ? 'Bounding Box + Classification 損失總和' : 'Box + Cls Total Loss';
  let chartTitle = isZh ? '偵測損失 (Loss) 與 mAP@0.5 動態訓練曲線' : 'Detection Loss & mAP@0.5 Training Curve';

  if (rawArch.includes('dfine')) {
    modelName = 'D-FINE';
    metricSub = isZh ? 'D-FINE mAP@0.5 (Transformer FDR 邊界精確度)' : 'D-FINE mAP@0.5 (Transformer FDR)';
    lossSub = isZh ? 'Hungarian Matcher + L1 Box + CE 損失總和' : 'Hungarian Matcher + L1 Box + CE Loss';
    chartTitle = isZh ? 'D-FINE Transformer 偵測損失 (Loss) 與 mAP@0.5 動態訓練曲線' : 'D-FINE Transformer Loss & mAP@0.5 Curve';
  } else if (rawArch.includes('ssd')) {
    modelName = 'SSDLite';
    metricSub = isZh ? 'SSDLite mAP@0.5 (MultiBox 邊界精確度)' : 'SSDLite mAP@0.5 (MultiBox Precision)';
    lossSub = isZh ? 'MultiBox Loss (Smooth L1 + Hard Negative CE)' : 'MultiBox Loss (Smooth L1 + Hard Negative CE)';
    chartTitle = isZh ? 'SSDLite-MobileNetV3 偵測損失 (Loss) 與 mAP@0.5 動態訓練曲線' : 'SSDLite-MobileNetV3 Loss & mAP@0.5 Curve';
  } else if (rawArch.includes('yolo')) {
    modelName = 'YOLO26';
    metricSub = isZh ? 'YOLO mAP@0.5 (IoU=0.5 平均精確率)' : 'YOLO mAP@0.5 (IoU=0.5 MAP)';
    lossSub = isZh ? 'Box CIoU + Cls BCE + DFL 損失總和' : 'Box CIoU + Cls BCE + DFL Loss';
    chartTitle = isZh ? 'YOLO26 偵測損失 (Loss) 與 mAP@0.5 動態訓練曲線' : 'YOLO26 Loss & mAP@0.5 Curve';
  } else if (isDetection) {
    modelName = isZh ? '物件偵測' : 'Object Detection';
    metricSub = isZh ? 'mAP@0.5 (IoU=0.5 平均精確率)' : 'mAP@0.5 (Mean Average Precision)';
    lossSub = isZh ? 'Box + Classification 損失總和' : 'Box + Classification Loss';
    chartTitle = isZh ? '物件偵測損失 (Loss) 與 mAP@0.5 動態訓練曲線' : 'Detection Loss & mAP@0.5 Curve';
  } else if (isRegression) {
    modelName = rawArch ? rawArch.toUpperCase().replace('_REG', '') : (isZh ? '數值迴歸' : 'Regression');
    metricSub = isZh ? '連續數值預測精確度 (100 - RMSE)' : 'Prediction Accuracy (100 - RMSE)';
    lossSub = isZh ? '均方誤差 (Smooth L1 Loss)' : 'Smooth L1 Loss';
    chartTitle = isZh ? `${modelName} 迴歸損失 (Loss) 與預測分數動態曲線` : `${modelName} Regression Loss & Score Curve`;
  } else {
    modelName = rawArch ? rawArch.toUpperCase() : 'CNN / ViT';
    metricSub = isZh ? 'Top-1 分類正確率 (Accuracy)' : 'Top-1 Accuracy';
    lossSub = isZh ? 'CrossEntropy 交叉熵損失' : 'CrossEntropy Loss';
    chartTitle = isZh ? `${modelName} Loss 與 Accuracy 雙動態指標曲線` : `${modelName} Loss & Accuracy Curve`;
  }

  const accCardTitle = isDetection
    ? (isZh ? `最佳驗證 mAP@0.5 (Best Val mAP)` : `Best Val mAP@0.5`)
    : (isRegression ? (isZh ? '最佳驗證精準度 (100 - RMSE)' : 'Best Val Accuracy (100 - RMSE)') : (isZh ? '最佳驗證準確率 (Best Val Acc)' : 'Best Val Accuracy'));

  const accCardSubtitle = metricSub;

  const lossCardTitle = isDetection
    ? (isZh ? `目前偵測總損失 (Detection Loss)` : `Current Detection Loss`)
    : (isRegression ? (isZh ? '目前迴歸損失 (Smooth L1)' : 'Current Regression Loss') : (isZh ? '目前分類損失 (Train / Val)' : 'Current Classification Loss'));

  const lossCardSubtitle = lossSub;

  // Hero card: one sentence about where training is, plus the single most useful next action.
  const bestAccText = status?.best_val_acc !== undefined ? `${status.best_val_acc.toFixed(1)}%` : '--';
  let heroTitle: string;
  let heroSub: string;
  if (isTraining) {
    heroTitle = isZh ? `正在訓練 ${modelName} · 第 ${currentEpoch} / ${totalEpochs} 輪` : `Training ${modelName} · epoch ${currentEpoch} / ${totalEpochs}`;
    heroSub = latestMetric?.eta_sec !== undefined
      ? (isZh ? `預估剩餘約 ${Math.round(latestMetric.eta_sec)} 秒 · 目前最佳 ${bestAccText}` : `About ${Math.round(latestMetric.eta_sec)}s left · best so far ${bestAccText}`)
      : (isZh ? '正在準備資料與模型…' : 'Preparing data and model…');
  } else if (isCompleted) {
    heroTitle = isZh ? `訓練完成！最佳成績 ${bestAccText}` : `Training complete! Best score ${bestAccText}`;
    heroSub = isZh ? '下一步：評估模型並匯出 ONNX / PTH。' : 'Next: evaluate the model and export ONNX / PTH.';
  } else if (isStopped) {
    heroTitle = isZh ? `訓練已中斷，已保留最佳模型（${bestAccText}）` : `Training stopped — best model kept (${bestAccText})`;
    heroSub = isZh ? '可以直接匯出，或重新配置後再訓練。' : 'Export it now, or reconfigure and train again.';
  } else if (isFailed) {
    heroTitle = isZh ? '訓練失敗' : 'Training failed';
    heroSub = status?.error_message || (isZh ? '請檢查下方日誌後重新配置訓練。' : 'Check the log below, then reconfigure training.');
  } else {
    heroTitle = isZh ? '尚未開始訓練' : 'No training running';
    heroSub = isZh ? '選擇模型與超參數後即可開始，這裡會即時顯示進度。' : 'Pick a model and hyperparameters to start; progress shows up here live.';
  }

  return (
    <div className="vf-page" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page header */}
      <div className="vf-page-header">
        <div className="vf-page-heading">
          <div className="vf-page-eyebrow">
            <Activity size={14} aria-hidden="true" /> {isZh ? '即時訓練監控' : 'Training Monitor'}
            <span className={`vf-live-dot ${wsConnected ? 'on' : ''}`} aria-hidden="true" />
            <span>{wsConnected ? (isZh ? 'WebSocket 即時連線' : 'Live (WebSocket)') : (isZh ? '輪詢更新中' : 'Polling')}</span>
          </div>
          <div className="vf-page-title-row">
            <h1 className="vf-page-title">{activeProject.name}</h1>
            {isTraining && (
              <span className="badge badge-indigo" style={{ animation: 'pulse 1.5s infinite' }}>
                <Flame size={13} /> {isZh ? '訓練中' : 'Training'}
              </span>
            )}
            {isCompleted && (
              <span className="badge badge-emerald">
                <CheckCircle2 size={13} /> {isZh ? '已完成' : 'Completed'}
              </span>
            )}
            {isStopped && (
              <span className="badge badge-amber">
                <CheckCircle2 size={13} /> {isZh ? '已中斷' : 'Stopped'}
              </span>
            )}
            {isFailed && (
              <span className="badge badge-amber">
                <AlertTriangle size={13} /> {isZh ? '失敗' : 'Failed'}
              </span>
            )}
          </div>
        </div>
        <div className="vf-page-actions">
          {(isFailed || isStopped) && (
            <Button variant="secondary" onClick={() => setCurrentView('train')}>
              {isZh ? '重新配置訓練' : 'Reconfigure Training'}
            </Button>
          )}
        </div>
      </div>

      {/* Hero: status sentence + progress + primary action */}
      <section className="vf-next-step" aria-label={isZh ? '訓練狀態' : 'Training status'}>
        <div className="vf-next-step-body">
          <span className="vf-next-step-pill">
            {modelName} · {isDetection ? 'Loss / mAP@0.5' : 'Loss / Accuracy'}
          </span>
          <h2 className="vf-next-step-title">{heroTitle}</h2>
          <p className="vf-next-step-sub">{heroSub}</p>
          <div
            className="vf-hero-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label={isZh ? '訓練進度' : 'Training progress'}
          >
            <span className="vf-hero-progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        {isTraining && (
          <button type="button" className="vf-next-step-cta" onClick={handleStopTraining} disabled={stopping}>
            <Square size={16} aria-hidden="true" /> {stopping ? (isZh ? '停止中…' : 'Stopping…') : (isZh ? '中斷訓練' : 'Stop training')}
          </button>
        )}
        {(isCompleted || isStopped) && (
          <button type="button" className="vf-next-step-cta" onClick={() => setCurrentView('export')}>
            {isZh ? '評估與匯出' : 'Evaluate & export'} <ArrowRight size={18} aria-hidden="true" />
          </button>
        )}
        {(isFailed || (!isTraining && !isCompleted && !isStopped)) && (
          <button type="button" className="vf-next-step-cta" onClick={() => setCurrentView('train')}>
            {isZh ? '前往模型訓練' : 'Go to training'} <ArrowRight size={18} aria-hidden="true" />
          </button>
        )}
      </section>

      {/* Metric tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Card>
          <div className="vf-stat-label">{accCardTitle}</div>
          <div className="vf-stat-value" style={{ color: 'var(--accent-emerald)' }}>{bestAccText}</div>
          <div className="vf-stat-sub">{accCardSubtitle}</div>
        </Card>

        <Card>
          <div className="vf-stat-label">{lossCardTitle}</div>
          <div className="vf-stat-value" style={{ color: 'var(--accent-amber)', fontSize: '1.4rem' }}>
            {latestMetric ? `${latestMetric.train_loss.toFixed(4)} / ${latestMetric.val_loss.toFixed(4)}` : '--'}
          </div>
          <div className="vf-stat-sub">{lossCardSubtitle}</div>
        </Card>

        <Card>
          <div className="vf-stat-label">{isZh ? '輪數與算力' : 'Epochs & compute'}</div>
          <div className="vf-stat-value">
            {currentEpoch} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {totalEpochs}</span>
          </div>
          <div className="vf-stat-sub">
            <Cpu size={12} aria-hidden="true" /> {systemHealth?.gpu.available ? (isZh ? 'GPU 加速' : 'GPU accelerated') : (isZh ? 'CPU 模式' : 'CPU mode')}
          </div>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
          <TrendingUp size={18} color="var(--accent-primary)" aria-hidden="true" /> {chartTitle}
        </h3>
        <MetricsChart history={history} height={280} taskType={activeProject.task_type} />
      </Card>

      {/* Real-time Terminal Logger */}
      <TerminalLogger logs={logs} onClear={() => setLogs([])} height={220} />
    </div>
  );
};
