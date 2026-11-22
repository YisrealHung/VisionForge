import React from 'react';
import { Download, Flame, CheckCircle2, FileCode, Layers, HardDrive } from 'lucide-react';
import { ModelExportInfo } from '../../types';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { useProject } from '../../context/ProjectContext';

interface PthExportCardProps {
  projectId: string;
  info: ModelExportInfo | null;
}

export const PthExportCard: React.FC<PthExportCardProps> = ({ projectId, info }) => {
  const { language } = useProject();
  const isZh = language === 'zh-TW';

  const handleDownloadPth = () => {
    const downloadUrl = api.getPthDownloadUrl(projectId);
    window.open(downloadUrl, '_blank');
  };

  const hasCheckpoint = info?.checkpoint_exists;

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flame size={16} strokeWidth={1.5} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 500 }}>
              {isZh ? 'PyTorch 原生模型權重 (.pth / .pt)' : 'PyTorch Native Checkpoint (.pth / .pt)'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {isZh
                ? '匯出原生 PyTorch 權重檔，適用於 Python / LibTorch 二次開發與遷移學習'
                : 'Export native PyTorch weights for Python / LibTorch development and transfer learning'}
            </p>
          </div>
        </div>

        {hasCheckpoint ? (
          <span className="badge badge-emerald">
            <CheckCircle2 size={12} strokeWidth={1.5} />
            {isZh ? `權重就緒 (${info?.checkpoint_size_str || '0 B'})` : `Ready (${info?.checkpoint_size_str || '0 B'})`}
          </span>
        ) : (
          <span className="badge badge-neutral">{isZh ? '尚未訓練模型' : 'No checkpoint'}</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCode size={13} strokeWidth={1.5} /> {isZh ? '檔案規格' : 'Format'}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>PyTorch Checkpoint (.pth)</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {isZh ? '含模型權重字典 (state_dict)' : 'Contains state_dict weights'}
          </div>
        </div>

        <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={13} strokeWidth={1.5} /> {isZh ? '模型架構' : 'Architecture'}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
            {info ? info.architecture.replace(/_/g, ' ') : '--'}
          </div>
          <div className="vf-num" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {isZh ? `${info?.num_classes || 0} 個目標類別` : `${info?.num_classes || 0} target classes`}
          </div>
        </div>

        <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HardDrive size={13} strokeWidth={1.5} /> {isZh ? '權重大小' : 'Size'}
          </div>
          <div className="vf-num" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            {info?.checkpoint_size_str || '--'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {isZh ? '最佳驗證權重' : 'Best validation checkpoint'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {isZh ? (
            <>
              在 Python 中可使用 <code>{`torch.load('${info?.architecture || 'model'}_best.pth')`}</code> 載入推論
            </>
          ) : (
            <>
              Load in Python with <code>{`torch.load('${info?.architecture || 'model'}_best.pth')`}</code>
            </>
          )}
        </div>

        <Button
          variant="primary"
          icon={<Download size={15} strokeWidth={1.5} />}
          disabled={!hasCheckpoint}
          onClick={handleDownloadPth}
        >
          {hasCheckpoint
            ? `${isZh ? '下載' : 'Download'} ${info?.architecture}_best.pth`
            : (isZh ? '請先完成模型訓練' : 'Train a model first')}
        </Button>
      </div>
    </Card>
  );
};
