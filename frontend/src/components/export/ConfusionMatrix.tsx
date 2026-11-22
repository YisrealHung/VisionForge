import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ConfusionMatrixData } from '../../types';
import { Button } from '../common/Button';
import { useProject } from '../../context/ProjectContext';

interface ConfusionMatrixProps {
  data: ConfusionMatrixData | null;
  loading: boolean;
  onRefresh: () => void;
}

export const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({ data, loading, onRefresh }) => {
  const { language } = useProject();
  const isZh = language === 'zh-TW';
  const [activeTab, setActiveTab] = useState<'matrix' | 'table'>('matrix');

  if (!data || data.labels.length === 0) {
    return (
      <div
        style={{
          padding: '32px 24px',
          textAlign: 'center',
          background: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-sm)',
          border: '1px dashed var(--border-subtle)',
          color: 'var(--text-muted)',
          fontSize: '13px',
        }}
      >
        <p style={{ marginBottom: '12px' }}>{isZh ? '尚未執行測試集評估' : 'No evaluation run yet'}</p>
        <Button variant="primary" size="sm" icon={<RefreshCw size={14} strokeWidth={1.5} />} loading={loading} onClick={onRefresh}>
          {isZh ? '執行模型評估' : 'Run evaluation'}
        </Button>
      </div>
    );
  }

  const { labels, matrix, per_class_metrics, overall_accuracy, total_samples } = data;
  const maxCellVal = Math.max(1, ...matrix.flatMap((row) => row));
  const accColor =
    overall_accuracy >= 80 ? 'var(--accent-emerald)' : overall_accuracy >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {isZh ? '整體準確率' : 'Overall accuracy'}
            </span>
            <span className="vf-num" style={{ fontSize: '20px', fontWeight: 500, color: accColor }}>
              {overall_accuracy.toFixed(1)}%
            </span>
          </div>
          <span className="vf-num" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {isZh ? `共 ${total_samples} 筆樣本` : `${total_samples} samples`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div className="vf-tabs" role="tablist" aria-label={isZh ? '評估檢視模式' : 'Evaluation view'}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'matrix'}
              className={`vf-tab ${activeTab === 'matrix' ? 'active' : ''}`}
              onClick={() => setActiveTab('matrix')}
            >
              {isZh ? '混淆矩陣' : 'Matrix'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'table'}
              className={`vf-tab ${activeTab === 'table' ? 'active' : ''}`}
              onClick={() => setActiveTab('table')}
            >
              {isZh ? '指標明細' : 'Metrics'}
            </button>
          </div>

          <Button variant="ghost" size="sm" icon={<RefreshCw size={14} strokeWidth={1.5} />} loading={loading} onClick={onRefresh}>
            {isZh ? '重新評估' : 'Re-evaluate'}
          </Button>
        </div>
      </div>

      {activeTab === 'matrix' && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {isZh ? '預測類別 (Predicted)' : 'Predicted label'}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isZh ? '實際類別 (Actual)' : 'Actual label'}
              </div>

              <div style={{ flex: 1 }}>
                <table className="vf-num" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px', textAlign: 'left', color: 'var(--text-muted)' }} />
                      {labels.map((l, i) => (
                        <th
                          key={i}
                          style={{
                            padding: '8px',
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                            fontWeight: 500,
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
                            padding: '8px 10px',
                            color: 'var(--text-secondary)',
                            fontWeight: 500,
                            textAlign: 'right',
                            borderRight: '1px solid var(--border-subtle)',
                          }}
                        >
                          {labels[rIdx]}
                        </td>
                        {row.map((val, cIdx) => {
                          const isDiagonal = rIdx === cIdx;
                          const ratio = val > 0 ? val / maxCellVal : 0;
                          const bgColor = isDiagonal
                            ? val > 0
                              ? `rgba(21, 128, 61, ${0.12 + ratio * 0.24})`
                              : 'var(--bg-surface-elevated)'
                            : val > 0
                            ? `rgba(200, 30, 30, ${0.10 + ratio * 0.22})`
                            : 'var(--bg-surface-elevated)';

                          const textColor =
                            val === 0
                              ? 'var(--text-muted)'
                              : isDiagonal
                              ? 'var(--accent-emerald)'
                              : 'var(--accent-rose)';

                          return (
                            <td
                              key={cIdx}
                              style={{
                                padding: '10px 8px',
                                textAlign: 'center',
                                background: bgColor,
                                border: '1px solid var(--border-subtle)',
                                fontWeight: val > 0 ? 500 : 400,
                                color: textColor,
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', background: 'rgba(21, 128, 61, 0.28)', border: '1px solid var(--accent-emerald)', borderRadius: '2px' }} />
                <span>{isZh ? '對角線：正確預測 (TP)' : 'Diagonal: Correct (TP)'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', background: 'rgba(200, 30, 30, 0.26)', border: '1px solid var(--accent-rose)', borderRadius: '2px' }} />
                <span>{isZh ? '非對角線：混淆誤判 (FP/FN)' : 'Off-diagonal: Misclassified (FP/FN)'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'table' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="vf-table">
            <thead>
              <tr>
                <th>{isZh ? '類別名稱' : 'Class'}</th>
                <th style={{ textAlign: 'right' }}>Precision</th>
                <th style={{ textAlign: 'right' }}>Recall</th>
                <th style={{ textAlign: 'right' }}>F1-Score</th>
                <th style={{ textAlign: 'right' }}>Support</th>
              </tr>
            </thead>
            <tbody>
              {per_class_metrics.map((metric, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{metric.category_name}</td>
                  <td className="vf-num" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {metric.precision.toFixed(1)}%
                  </td>
                  <td className="vf-num" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {metric.recall.toFixed(1)}%
                  </td>
                  <td className="vf-num" style={{ textAlign: 'right', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {metric.f1_score.toFixed(1)}%
                  </td>
                  <td className="vf-num" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
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
