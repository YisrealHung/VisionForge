import React from 'react';
import { EpochMetric, TaskType } from '../../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MetricsChartProps {
  history: EpochMetric[];
  height?: number;
  taskType?: TaskType;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({ history, height = 260, taskType = 'classification' }) => {
  if (!history || history.length === 0) {
    const hintText = taskType === 'detection'
      ? '等待訓練啟動中... 即將即時繪製損失與 mAP@0.5 曲線'
      : (taskType === 'regression' ? '等待訓練啟動中... 即將即時繪製損失與預測分數曲線' : '等待訓練啟動中... 即將即時繪製 Loss 與 Accuracy 曲線');

    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-base)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
        }}
      >
        {hintText}
      </div>
    );
  }

  const isDetection = taskType === 'detection';
  const isRegression = taskType === 'regression';

  const accLabel = isDetection ? 'mAP@0.5' : (isRegression ? 'Score' : 'Acc');
  const trainAccName = isDetection ? 'Train mAP@0.5' : (isRegression ? 'Train Score' : 'Train Acc');
  const valAccName = isDetection ? 'Val mAP@0.5' : (isRegression ? 'Val Score' : 'Val Acc');

  // Format data for Recharts
  const chartData = history.map((h) => ({
    epoch: h.epoch,
    trainLoss: Number(h.train_loss.toFixed(4)),
    valLoss: Number(h.val_loss.toFixed(4)),
    trainAcc: Number(h.train_acc.toFixed(1)),
    valAcc: Number(h.val_acc.toFixed(1)),
    totalEpochs: h.total_epochs,
  }));

  return (
    <div style={{ width: '100%', height: height }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EB7E83' }}>
            <span style={{ width: '8px', height: '2px', background: '#EB7E83' }} /> Train Loss
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#E1998A' }}>
            <span style={{ width: '8px', height: '2px', background: '#E1998A' }} /> Val Loss
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#557B86' }}>
            <span style={{ width: '8px', height: '2px', background: '#557B86' }} /> {trainAccName}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#67a390' }}>
            <span style={{ width: '8px', height: '2px', background: '#67a390' }} /> {valAccName}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(184, 143, 137, 0.12)" vertical={false} />
          <XAxis 
            dataKey="epoch" 
            stroke="#96878e" 
            fontSize={11}
            tickLine={false}
          />
          <YAxis 
            yAxisId="left"
            stroke="#96878e" 
            fontSize={11}
            tickLine={false}
            domain={[0, 'auto']}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            stroke="#96878e" 
            fontSize={11}
            tickLine={false}
            domain={[0, 100]}
            unit="%"
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div style={{
                    background: '#1c1921',
                    border: '1px solid rgba(184, 143, 137, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    boxShadow: 'var(--shadow-md)',
                    fontSize: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid rgba(184, 143, 137, 0.15)', paddingBottom: '2px' }}>
                      Epoch {label}
                    </span>
                    <span style={{ color: '#EB7E83' }}>Train Loss: {data.trainLoss?.toFixed(4)}</span>
                    <span style={{ color: '#E1998A' }}>Val Loss: {data.valLoss?.toFixed(4)}</span>
                    <span style={{ color: '#557B86' }}>{trainAccName}: {data.trainAcc}%</span>
                    <span style={{ color: '#67a390', fontWeight: 700 }}>{valAccName}: {data.valAcc}%</span>
                  </div>
                );
              }
              return null;
            }}
          />
          
          {/* Loss Lines (Left Y-Axis) */}
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="trainLoss" 
            name="Train Loss"
            stroke="#EB7E83" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="valLoss" 
            name="Val Loss"
            stroke="#E1998A" 
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
          
          {/* Accuracy / mAP Lines (Right Y-Axis) */}
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="trainAcc" 
            name={trainAccName}
            stroke="#557B86" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="valAcc" 
            name={valAccName}
            stroke="#67a390" 
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
