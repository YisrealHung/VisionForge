import React from 'react';
import { EpochMetric, TaskType } from '../../types';
import { useProject } from '../../context/ProjectContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MetricsChartProps {
  history: EpochMetric[];
  height?: number;
  taskType?: TaskType;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({ history, height = 300, taskType = 'classification' }) => {
  const { language } = useProject();
  const isZh = language === 'zh-TW';

  if (!history || history.length === 0) {
    const hintText =
      taskType === 'detection'
        ? isZh
          ? '等待訓練啟動中，將即時繪製損失與 mAP@0.5 曲線'
          : 'Waiting for training epochs to plot loss and mAP@0.5'
        : taskType === 'regression'
        ? isZh
          ? '等待訓練啟動中，將即時繪製損失與預測分數曲線'
          : 'Waiting for training epochs to plot loss and prediction score'
        : isZh
        ? '等待訓練啟動中，將即時繪製 Loss 與 Accuracy 曲線'
        : 'Waiting for training epochs to plot loss and accuracy';

    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          fontSize: '13px',
          padding: '16px',
          textAlign: 'center',
        }}
      >
        {hintText}
      </div>
    );
  }

  const isDetection = taskType === 'detection';
  const isRegression = taskType === 'regression';

  const trainAccName = isDetection ? 'Train mAP@0.5' : isRegression ? 'Train Score' : 'Train Acc';
  const valAccName = isDetection ? 'Val mAP@0.5' : isRegression ? 'Val Score' : 'Val Acc';

  const chartData = history.map((h) => ({
    epoch: h.epoch,
    trainLoss: Number(h.train_loss.toFixed(4)),
    valLoss: Number(h.val_loss.toFixed(4)),
    trainAcc: Number(h.train_acc.toFixed(1)),
    valAcc: Number(h.val_acc.toFixed(1)),
    totalEpochs: h.total_epochs,
  }));

  return (
    <div style={{ width: '100%', height }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <div className="vf-num" style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 500 }}>
            <span style={{ width: '12px', height: '2.5px', background: 'var(--accent-primary)', borderRadius: '1px' }} />
            {valAccName}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '12px', borderTop: '1.5px dashed var(--text-muted)' }} />
            {trainAccName}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '12px', height: '2px', background: 'var(--accent-amber)', borderRadius: '1px' }} />
            Val Loss
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <span style={{ width: '12px', borderTop: '1.5px dotted var(--text-muted)', opacity: 0.7 }} />
            Train Loss
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(220, height - 36)}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="epoch"
            stroke="var(--text-muted)"
            fontSize={11}
            fontFamily="var(--font-mono)"
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            stroke="var(--text-muted)"
            fontSize={11}
            fontFamily="var(--font-mono)"
            tickLine={false}
            domain={[0, 'auto']}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="var(--text-muted)"
            fontSize={11}
            fontFamily="var(--font-mono)"
            tickLine={false}
            domain={[0, 100]}
            unit="%"
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div
                    className="vf-num"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      boxShadow: 'var(--shadow-md)',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontWeight: 500, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px', marginBottom: '2px' }}>
                      Epoch {label}
                    </span>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
                      {valAccName}: {data.valAcc}%
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {trainAccName}: {data.trainAcc}%
                    </span>
                    <span style={{ color: 'var(--accent-amber)' }}>Val Loss: {data.valLoss?.toFixed(4)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Train Loss: {data.trainLoss?.toFixed(4)}</span>
                  </div>
                );
              }
              return null;
            }}
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="trainLoss"
            name="Train Loss"
            stroke="var(--text-muted)"
            strokeOpacity={0.65}
            strokeWidth={1.5}
            strokeDasharray="2 4"
            dot={false}
            activeDot={{ r: 3 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="valLoss"
            name="Val Loss"
            stroke="var(--accent-amber)"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="trainAcc"
            name={trainAccName}
            stroke="var(--text-muted)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 3 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="valAcc"
            name={valAccName}
            stroke="var(--accent-primary)"
            strokeWidth={2.5}
            dot={{ r: 2.5 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
