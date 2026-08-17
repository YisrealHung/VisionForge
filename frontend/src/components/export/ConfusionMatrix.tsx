import React, { useState } from 'react';
import { Table2, RefreshCw, BarChart2, CheckCircle, HelpCircle } from 'lucide-react';
import { ConfusionMatrixData } from '../../types';
import { Button } from '../common/Button';

interface ConfusionMatrixProps {
  data: ConfusionMatrixData | null;
  loading: boolean;
  onRefresh: () => void;
}

export const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({ data, loading, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'table'>('matrix');

  if (!data || data.labels.length === 0) {
    return (
      <div
        style={{
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          background: 'var(--bg-base)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-subtle)',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
        }}
      >
        <p style={{ marginBottom: '1rem' }}>尚未執行測試集評估</p>
        <Button variant="primary" size="sm" icon={<RefreshCw size={14} />} loading={loading} onClick={onRefresh}>
          立即執行模型評估
        </Button>
      </div>
    );
  }

  const { labels, matrix, per_class_metrics, overall_accuracy, total_samples } = data;
  const maxCellVal = Math.max(1, ...matrix.flatMap((row) => row));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>驗證集準確率 (Accuracy):</span>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: overall_accuracy >= 80 ? '#10b981' : overall_accuracy >= 60 ? '#f59e0b' : '#f43f5e',
              }}
            >
              {overall_accuracy.toFixed(1)}%
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            (共 {total_samples} 張評估樣本)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setActiveTab('matrix')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeTab === 'matrix' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'matrix' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              混淆矩陣
            </button>
            <button
              onClick={() => setActiveTab('table')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeTab === 'table' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'table' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              指標明細表
            </button>
          </div>

          <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} loading={loading} onClick={onRefresh}>
            重新評估
          </Button>
        </div>
      </div>

      {/* Tab 1: Confusion Matrix Grid */}
      {activeTab === 'matrix' && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              預測類別 (Predicted Label) ➔
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {/* Left Label */}
              <div
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                實際類別 (True Label) ➔
              </div>

              {/* Matrix Table */}
              <div style={{ flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '6px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.7rem' }}></th>
                      {labels.map((l, i) => (
                        <th
                          key={i}
                          style={{
                            padding: '6px 8px',
                            textAlign: 'center',
                            color: '#818cf8',
                            fontWeight: 700,
                            borderBottom: '1px solid var(--border-subtle)',
                          }}
                        >
                          {l}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td
                          style={{
                            padding: '6px 8px',
                            color: '#818cf8',
                            fontWeight: 700,
                            textAlign: 'right',
                            borderRight: '1px solid var(--border-subtle)',
                          }}
                        >
                          {labels[rIdx]}
                        </td>
                        {row.map((val, cIdx) => {
                          const isDiagonal = rIdx === cIdx;
                          const intensity = val > 0 ? Math.max(0.15, val / maxCellVal) : 0;
                          const bgColor = isDiagonal
                            ? `rgba(16, 185, 129, ${intensity})`
                            : val > 0
                            ? `rgba(244, 63, 94, ${intensity * 0.8})`
                            : 'rgba(255, 255, 255, 0.02)';

                          return (
                            <td
                              key={cIdx}
                              style={{
                                padding: '10px 8px',
                                textAlign: 'center',
                                background: bgColor,
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                fontWeight: val > 0 ? 700 : 400,
                                color: isDiagonal && val > 0 ? '#6ee7b7' : val > 0 ? '#fda4af' : 'var(--text-muted)',
                                transition: 'all 0.2s',
                              }}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Matrix Legend */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.25rem', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', background: 'rgba(16, 185, 129, 0.6)', borderRadius: '2px' }} />
                <span>對角線 (正確預測 TP)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', background: 'rgba(244, 63, 94, 0.6)', borderRadius: '2px' }} />
                <span>非對角線 (混淆誤判 FP/FN)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Detailed Per-Class Metrics Table */}
      {activeTab === 'table' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-elevated)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)' }}>類別名稱</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>精確率 (Precision)</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>召回率 (Recall)</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>F1-Score</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>樣本數 (Support)</th>
              </tr>
            </thead>
            <tbody>
              {per_class_metrics.map((metric, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {metric.category_name}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: '#818cf8', fontWeight: 600 }}>
                    {metric.precision.toFixed(1)}%
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: '#06b6d4', fontWeight: 600 }}>
                    {metric.recall.toFixed(1)}%
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: '#10b981', fontWeight: 700 }}>
                    {metric.f1_score.toFixed(1)}%
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {metric.support}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
