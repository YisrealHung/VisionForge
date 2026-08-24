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
    if (!window.confirm(isZh ? `確定要刪除模型「${name}」嗎？權重檔案將被永久刪除且無法復原。` : `Delete model "${name}"? The checkpoint file will be permanently deleted.`)) return;
    
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
        <Database size={18} color="#f59e0b" />
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{isZh ? '已訓練模型庫 (Trained Models)' : 'Trained Model Library'}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {isZh ? '管理已訓練完成的模型檢查點，選擇啟用的模型進行測試與匯出' : 'Manage trained model checkpoints, select a model to test and export'}
          </p>
        </div>
      </div>
      
      {error && (
        <div style={{ 
          padding: '0.75rem', 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          color: '#ef4444', 
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <ShieldAlert size={14} />
          {error}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{isZh ? '模型名稱' : 'Model Name'}</th>
              <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{isZh ? '狀態' : 'Status'}</th>
              <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{isZh ? '準確率 (Best Acc)' : 'Best Accuracy'}</th>
              <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{isZh ? '權重大小' : 'Weight Size'}</th>
              <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{isZh ? '訓練時間' : 'Trained At'}</th>
              <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, textAlign: 'right' }}>{isZh ? '操作' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {models.map(model => (
              <tr key={model.architecture} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {model.name}
                </td>
                <td style={{ padding: '0.75rem 0.5rem' }}>
                  {model.is_latest ? (
                    <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} />
                      {isZh ? '使用中' : 'Active'}
                    </span>
                  ) : (
                    <span className="badge badge-gray">{isZh ? '已儲存' : 'Saved'}</span>
                  )}
                </td>
                <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{model.best_val_acc.toFixed(1)}%</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '4px' }}>
                    ({model.total_epochs} Ep)
                  </span>
                </td>
                <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {model.checkpoint_size_str}
                </td>
                <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {model.trained_at}
                </td>
                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    {!model.is_latest && (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        disabled={loading}
                        onClick={() => handleSelect(model.architecture)}
                      >
                        {isZh ? '設為啟用' : 'Set Active'}
                      </Button>
                    )}
                    <Button 
                      variant="danger" 
                      size="sm"
                      icon={<Trash2 size={14} />}
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
