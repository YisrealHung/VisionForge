import React, { useState, useEffect, useCallback } from 'react';
import { Database, Check, Trash2, ShieldAlert } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { TrainedModelInfo } from '../../types';
import { api } from '../../services/api';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface TrainedModelListProps {
  onModelChanged: () => void;
}

export const TrainedModelList: React.FC<TrainedModelListProps> = ({ onModelChanged }) => {
  const { activeProject, language } = useProject();
  const isZh = language === 'zh-TW';
  const [models, setModels] = useState<TrainedModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTrainedModels(activeProject.id);
      setModels(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch models');
    } finally {
      setLoading(false);
    }
  }, [activeProject]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleSelect = async (architecture: string) => {
    if (!activeProject) return;
    try {
      setLoading(true);
      await api.selectTrainedModel(activeProject.id, architecture);
      await fetchModels();
      onModelChanged();
    } catch (err: any) {
      setError(err.message || (isZh ? '切換模型失敗' : 'Failed to switch model'));
      setLoading(false);
    }
  };

  const handleDelete = async (architecture: string, name: string) => {
    if (!activeProject) return;
    if (
      !window.confirm(
        isZh
          ? `確定要刪除模型「${name}」嗎？權重檔案將永久刪除且無法復原。`
          : `Delete model "${name}"? The checkpoint file will be permanently removed.`
      )
    )
      return;

    try {
      setLoading(true);
      await api.deleteTrainedModel(activeProject.id, architecture);
      await fetchModels();
      onModelChanged();
    } catch (err: any) {
      setError(err.message || (isZh ? '刪除模型失敗' : 'Failed to delete model'));
      setLoading(false);
    }
  };

  if (models.length === 0 && !loading) {
    return null;
  }

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Database size={16} strokeWidth={1.5} color="var(--text-secondary)" aria-hidden="true" />
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 500 }}>
            {isZh ? '已訓練模型庫' : 'Trained model library'}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {isZh ? '管理已完成訓練的模型檢查點，並指定用於測試與匯出的啟用模型' : 'Manage trained checkpoints and select the active model for evaluation and export'}
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '10px 12px',
            background: 'var(--accent-rose-soft)',
            color: 'var(--accent-rose)',
            border: '1px solid rgba(200, 30, 30, 0.25)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldAlert size={15} strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="vf-table">
          <thead>
            <tr>
              <th>{isZh ? '模型名稱' : 'Model'}</th>
              <th>{isZh ? '狀態' : 'Status'}</th>
              <th style={{ textAlign: 'right' }}>{isZh ? '最佳準確率' : 'Best accuracy'}</th>
              <th style={{ textAlign: 'right' }}>{isZh ? '權重大小' : 'Size'}</th>
              <th>{isZh ? '訓練時間' : 'Trained at'}</th>
              <th style={{ textAlign: 'right' }}>{isZh ? '操作' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <tr key={model.architecture}>
                <td style={{ fontWeight: 500 }}>{model.name}</td>
                <td>
                  {model.is_latest ? (
                    <span className="badge badge-emerald">
                      <Check size={12} strokeWidth={1.75} />
                      {isZh ? '使用中' : 'Active'}
                    </span>
                  ) : (
                    <span className="badge badge-neutral">{isZh ? '已儲存' : 'Saved'}</span>
                  )}
                </td>
                <td className="vf-num" style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 500 }}>
                    {model.best_val_acc.toFixed(1)}%
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '6px' }}>
                    ({model.total_epochs} ep)
                  </span>
                </td>
                <td className="vf-num" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                  {model.checkpoint_size_str}
                </td>
                <td className="vf-num" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {model.trained_at || '--'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {!model.is_latest && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={loading}
                        onClick={() => handleSelect(model.architecture)}
                      >
                        {isZh ? '設為啟用' : 'Set active'}
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={14} strokeWidth={1.5} />}
                      disabled={loading}
                      onClick={() => handleDelete(model.architecture, model.name)}
                    >
                      {isZh ? '刪除' : 'Delete'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
