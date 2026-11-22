import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  Copy,
  Check,
  Power,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ApiServerStatus } from '../../types';
import { api, getPredictEndpoint } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { TaskBadge } from '../../components/common/Badge';
import { ApiPlayground } from '../../components/api_server/ApiPlayground';

export const ApiServerView: React.FC = () => {
  const { activeProject, language } = useProject();
  const isZh = language === 'zh-TW';
  const [status, setStatus] = useState<ApiServerStatus | null>(null);
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const s = await api.getApiServerStatus();
      setStatus(s);
    } catch (err) {
      console.error('Failed to get API status:', err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 3000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  const handleToggle = async () => {
    try {
      setLoadingToggle(true);
      const next = status ? !status.is_running : true;
      const updated = await api.toggleApiServer(next);
      setStatus(updated);
    } catch {
      alert(isZh ? '切換伺服器狀態失敗' : 'Failed to toggle API server');
    } finally {
      setLoadingToggle(false);
    }
  };

  const endpointUrl = getPredictEndpoint();

  const copyEndpoint = () => {
    if (endpointUrl) {
      navigator.clipboard.writeText(endpointUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  if (!activeProject) {
    return (
      <div className="vf-container">
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            {isZh ? '請先在頂部選單選擇或建立專案' : 'Select or create a project from the header first'}
          </p>
        </Card>
      </div>
    );
  }

  const isOnline = status?.is_running ?? true;

  return (
    <div className="vf-container">
      <div className="vf-page-header">
        <div className="vf-page-heading">
          <div className="vf-page-eyebrow">
            <Radio size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>{isZh ? '推論 API 伺服器' : 'Inference API server'}</span>
            <TaskBadge taskType={activeProject.task_type} />
          </div>
          <div className="vf-page-title-row">
            <h1 className="vf-page-title">{activeProject.name}</h1>
            <span className={isOnline ? 'badge badge-emerald' : 'badge badge-amber'}>
              <span className={`vf-status-dot ${isOnline ? 'online' : 'warning'}`} aria-hidden="true" />
              {isOnline ? (isZh ? '運行中' : 'Running') : (isZh ? '已暫停' : 'Paused')}
            </span>
          </div>
        </div>

        <div className="vf-page-actions">
          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCcw size={14} strokeWidth={1.5} />}
            onClick={fetchStatus}
          >
            {isZh ? '重新整理' : 'Refresh'}
          </Button>

          <Button
            variant={isOnline ? 'danger' : 'primary'}
            size="sm"
            icon={<Power size={14} strokeWidth={1.5} />}
            loading={loadingToggle}
            onClick={handleToggle}
          >
            {isOnline ? (isZh ? '暫停 API 服務' : 'Pause API server') : (isZh ? '啟動 API 服務' : 'Start API server')}
          </Button>
        </div>
      </div>

      {/* Server Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <Card>
          <div className="vf-stat-label">{isZh ? '服務狀態與通訊埠' : 'Service status'}</div>
          <div
            className="vf-stat-value vf-num"
            style={{ fontSize: '22px', lineHeight: 1.25, color: isOnline ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}
          >
            {isOnline ? (isZh ? '運行中' : 'Running') : (isZh ? '已暫停' : 'Paused')}
          </div>
          <div className="vf-stat-sub vf-mono">
            {isZh ? 'Port ' : 'Port '}
            {status?.port || 8000}
          </div>
        </Card>

        <Card>
          <div className="vf-stat-label">{isZh ? '累計請求數' : 'Total requests'}</div>
          <div className="vf-stat-value vf-num">{(status?.total_requests || 0).toLocaleString()}</div>
          <div className="vf-stat-sub">{isZh ? '已處理推論請求' : 'Completed inference calls'}</div>
        </Card>

        <Card>
          <div className="vf-stat-label">{isZh ? '平均推論延遲' : 'Average latency'}</div>
          <div className="vf-stat-value vf-num">{status?.avg_latency_ms || 0} ms</div>
          <div className="vf-stat-sub">{isZh ? '前向推論平均耗時' : 'Mean forward pass duration'}</div>
        </Card>

        <Card>
          <div className="vf-stat-label">{isZh ? '目前載入模型' : 'Loaded model'}</div>
          <div
            className="vf-stat-value"
            style={{ fontSize: '20px', lineHeight: 1.3, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={activeProject.name}
          >
            {activeProject.name}
          </div>
          <div className="vf-stat-sub">{isZh ? '記憶體快取熱載入' : 'Cached in memory'}</div>
        </Card>
      </div>

      {/* Endpoint URL Banner */}
      <div
        style={{
          background: 'var(--bg-surface)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span className="badge badge-emerald vf-mono">POST</span>
          <code
            className="vf-mono"
            style={{
              fontSize: '13px',
              color: 'var(--text-primary)',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {endpointUrl}
          </code>
        </div>

        <button type="button" className="btn btn-ghost btn-sm" onClick={copyEndpoint}>
          {copiedUrl ? <Check size={14} strokeWidth={1.75} color="var(--accent-emerald)" /> : <Copy size={14} strokeWidth={1.5} />}
          <span>{copiedUrl ? (isZh ? '已複製' : 'Copied') : (isZh ? '複製端點' : 'Copy endpoint')}</span>
        </button>
      </div>

      <ApiPlayground projectId={activeProject.id} />

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <BookOpen size={16} strokeWidth={1.5} color="var(--text-secondary)" />
          <h3 style={{ fontSize: '16px', fontWeight: 500 }}>
            {isZh ? 'REST API 規格參考' : 'REST API specification'}
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
          <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span className="badge badge-emerald vf-mono">POST</span>
              <code style={{ color: 'var(--text-primary)', fontWeight: 500 }}>/api/inference/predict</code>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                {isZh ? 'Base64 單張影像推論（支援可選 ROI 裁切）' : 'Base64 single image inference (optional ROI)'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Request Body:{' '}
              <code>{`{ "model_id": "${activeProject.id}", "image_base64": "...", "roi": {"x":0.1,"y":0.1,"width":0.8,"height":0.8} }`}</code>
            </div>
          </div>

          <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span className="badge badge-emerald vf-mono">POST</span>
              <code style={{ color: 'var(--text-primary)', fontWeight: 500 }}>/api/inference/predict-form</code>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                {isZh ? 'Multipart 表單圖片檔案上傳推論' : 'Multipart form image upload inference'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Content-Type: <code>multipart/form-data</code> (field <code>file</code>)
            </div>
          </div>

          <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span className="badge badge-emerald vf-mono">POST</span>
              <code style={{ color: 'var(--text-primary)', fontWeight: 500 }}>/api/inference/batch</code>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                {isZh ? '多張 Base64 影像批次推論' : 'Batch inference for multiple Base64 images'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Request Body: <code>{`{ "model_id": "${activeProject.id}", "images_base64": ["...", "..."] }`}</code>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
