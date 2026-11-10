import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  Square,
  Play,
  Sparkles,
  CheckCircle2,
  Clock,
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
        setLogs(tail(data.logs));
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{isZh ? '即時訓練監控儀表板' : 'Real-time Training Monitor'}</h1>
            {isTraining && (
              <span className="badge badge-indigo" style={{ animation: 'pulse 1.5s infinite' }}>
                <Flame size={13} /> {isZh ? '訓練中...' : 'Training...'}
              </span>
            )}
            {isCompleted && (
              <span className="badge badge-emerald">
                <CheckCircle2 size={13} /> {isZh ? '訓練已完成' : 'Training Completed'}
              </span>
            )}
            {isStopped && (
              <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> {isZh ? '訓練已中斷 (已保留最佳模型)' : 'Training Stopped (Best model saved)'}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {isZh ? '專案：' : 'Project: '}<span style={{ color: '#818cf8', fontWeight: 600 }}>{activeProject.name}</span> · {isZh ? 'WebSocket 即時推播' : 'WebSocket Live Updates'} {isDetection ? 'Loss / mAP@0.5' : 'Loss / Accuracy'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isTraining && (
            <Button
              variant="danger"
              icon={<Square size={14} />}
              loading={stopping}
              onClick={handleStopTraining}
            >
              {isZh ? '中斷訓練' : 'Stop Training'}
            </Button>
          )}

          {(isCompleted || isStopped) && (
            <Button
              variant="primary"
              icon={<ArrowRight size={15} />}
              onClick={() => setCurrentView('export')}
            >
              {isZh ? '前往模型評估與匯出' : 'Go to Model Export'}
            </Button>
          )}

          {(isFailed || isStopped) && !isTraining && (
            <Button
              variant="secondary"
              onClick={() => setCurrentView('train')}
            >
              {isZh ? '重新配置訓練' : 'Reconfigure Training'}
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Top Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* Epoch Progress */}
        <Card>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{isZh ? '輪數進度 (Epochs)' : 'Epoch Progress'}</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {currentEpoch} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {totalEpochs}</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginTop: '6px' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--gradient-brand)', transition: 'width 0.3s' }} />
          </div>
        </Card>

        {/* Best Val Accuracy / mAP */}
        <Card>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{accCardTitle}</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
            {status?.best_val_acc !== undefined ? `${status.best_val_acc.toFixed(1)}%` : '--'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {accCardSubtitle}
          </div>
        </Card>

        {/* Current Loss */}
        <Card>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{lossCardTitle}</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f59e0b' }}>
            {latestMetric ? `${latestMetric.train_loss.toFixed(4)} / ${latestMetric.val_loss.toFixed(4)}` : '--'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {lossCardSubtitle}
          </div>
        </Card>

        {/* Compute Device & ETA */}
        <Card>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{isZh ? '剩餘預估時間 (ETA)' : 'Estimated Time Remaining (ETA)'}</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#06b6d4' }}>
            {isTraining && latestMetric?.eta_sec !== undefined ? `~${Math.round(latestMetric.eta_sec)} ${isZh ? '秒' : 's'}` : (isCompleted ? (isZh ? '訓練已結束' : 'Training Complete') : '--')}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {isZh ? '算力:' : 'Compute:'} {systemHealth?.gpu.available ? (isZh ? '🟢 GPU 加速' : '🟢 GPU Accelerated') : (isZh ? 'CPU 模式' : 'CPU Mode')}
          </div>
        </Card>
      </div>

      {/* Main Charts & Logs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
        {/* Dynamic Loss & Accuracy Charts */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={17} color="#818cf8" /> {chartTitle}
            </h3>
            <span style={{ fontSize: '0.75rem', color: wsConnected ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: wsConnected ? '#10b981' : '#f59e0b' }} />
              {wsConnected ? (isZh ? 'WebSocket 即時連線' : 'WebSocket Connected') : (isZh ? '輪詢連線中' : 'Polling Connection')}
            </span>
          </div>
          <MetricsChart history={history} height={280} taskType={activeProject.task_type} />
        </Card>

        {/* Real-time Terminal Logger */}
        <TerminalLogger logs={logs} onClear={() => setLogs([])} height={200} />
      </div>
    </div>
  );
};
