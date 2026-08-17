import React from 'react';
import { Download, Flame, CheckCircle2, ShieldCheck, FileCode, Layers, HardDrive } from 'lucide-react';
import { ModelExportInfo } from '../../types';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface PthExportCardProps {
  projectId: string;
  info: ModelExportInfo | null;
}

export const PthExportCard: React.FC<PthExportCardProps> = ({ projectId, info }) => {
  const handleDownloadPth = () => {
    const downloadUrl = api.getPthDownloadUrl(projectId);
    window.open(downloadUrl, '_blank');
  };

  const hasCheckpoint = info?.checkpoint_exists;

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(238, 76, 44, 0.15)',
              color: '#ee4c2c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flame size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>PyTorch 原生模型權重匯出 (.pth / .pt)</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              匯出原生 PyTorch 模型權重檔，適用於 Python / C++ LibTorch 二次開發、遷移學習與推論部署
            </p>
          </div>
        </div>

        {hasCheckpoint ? (
          <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={13} /> 權重檔就緒 ({info?.checkpoint_size_str || '0 B'})
          </span>
        ) : (
          <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            尚未訓練模型
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* Format Spec */}
        <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCode size={13} color="#ee4c2c" /> 檔案規格
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            PyTorch Checkpoint (.pth)
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            含神經層參數 (state_dict)
          </div>
        </div>

        {/* Target Architecture */}
        <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={13} color="#818cf8" /> 目標模型架構
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
            {info ? info.architecture.replace(/_/g, ' ') : '--'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {info?.num_classes || 0} 個目標類別
          </div>
        </div>

        {/* Storage Size */}
        <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HardDrive size={13} color="#10b981" /> 權重大小
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>
            {info?.checkpoint_size_str || '--'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            最佳輪次權重 (Best Weights)
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          💡 提示：在 Python 中可直接使用 <code>{`torch.load('${info?.architecture || 'model'}_best.pth')`}</code> 載入推論。
        </div>

        <Button
          variant="primary"
          icon={<Download size={15} />}
          disabled={!hasCheckpoint}
          onClick={handleDownloadPth}
          style={{ background: hasCheckpoint ? 'linear-gradient(135deg, #ee4c2c 0%, #d03010 100%)' : undefined }}
        >
          {hasCheckpoint ? `下載 ${info?.architecture}_best.pth` : '請先完成模型訓練'}
        </Button>
      </div>
    </Card>
  );
};
