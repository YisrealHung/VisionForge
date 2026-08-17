import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  Code2,
  Copy,
  Check,
  Power,
  Activity,
  Zap,
  Server,
  BookOpen,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ApiServerStatus } from '../../types';
import { api } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ApiPlayground } from '../../components/api_server/ApiPlayground';

export const ApiServerView: React.FC = () => {
  const { activeProject, setCurrentView } = useProject();
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
    } catch (err) {
      alert('切換伺服器狀態失敗');
    } finally {
      setLoadingToggle(false);
    }
  };

  const copyEndpoint = () => {
    if (status?.endpoint_url) {
      navigator.clipboard.writeText(status.endpoint_url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  if (!activeProject) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>請先在頂部選單選擇或建立一個專案</p>
      </div>
    );
  }

  const isOnline = status?.is_running ?? true;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>🔌 本機推論 API 伺服器</h1>
            <span className={isOnline ? 'badge badge-emerald' : 'badge badge-amber'}>
              {isOnline ? '🟢 API 運行中' : '⚪ 服務已暫停'}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            專案：<span style={{ color: '#818cf8', fontWeight: 600 }}>{activeProject.name}</span> · 高效能本機 REST API · 支援 Base64、Multipart 及 GPU 批次加速
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant={isOnline ? 'danger' : 'primary'}
            icon={<Power size={14} />}
            loading={loadingToggle}
            onClick={handleToggle}
          >
            {isOnline ? '暫停 API 伺服器' : '啟動 API 伺服器'}
          </Button>

          <Button
            variant="secondary"
            icon={<RotateCcw size={14} />}
            onClick={fetchStatus}
          >
            刷新數據
          </Button>
        </div>
      </div>

      {/* Server Stats Dashboard Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Status & Port */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Server size={16} color={isOnline ? '#10b981' : '#f59e0b'} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>服務狀態 / Port</span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: isOnline ? '#10b981' : '#f59e0b' }}>
            {isOnline ? 'ONLINE' : 'STOPPED'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            本機通訊埠: <strong>:{status?.port || 8000}</strong>
          </div>
        </Card>

        {/* Total Requests */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Activity size={16} color="#818cf8" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>已處理請求 (Requests)</span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#818cf8' }}>
            {status?.total_requests || 0} 次
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            累計呼叫次數
          </div>
        </Card>

        {/* Average Latency */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Zap size={16} color="#06b6d4" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>平均推論延遲</span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#06b6d4' }}>
            {status?.avg_latency_ms || 0} ms
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            前向傳播平均耗時
          </div>
        </Card>

        {/* Active Model */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Radio size={16} color="#f59e0b" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>已載入熱模型</span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeProject.name}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            記憶體快取熱加載
          </div>
        </Card>
      </div>

      {/* Endpoint URL Banner */}
      <div
        style={{
          background: 'var(--bg-surface-elevated)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
            POST
          </span>
          <code style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>
            {status?.endpoint_url || 'http://127.0.0.1:8000/api/inference/predict'}
          </code>
        </div>

        <button
          className="btn btn-ghost btn-sm"
          onClick={copyEndpoint}
          style={{ fontSize: '0.75rem', gap: '4px' }}
        >
          {copiedUrl ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
          {copiedUrl ? '已複製！' : '複製 API 端點'}
        </button>
      </div>

      {/* Interactive API Playground */}
      <ApiPlayground projectId={activeProject.id} />

      {/* Full API Documentation Reference */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
          <BookOpen size={18} color="#06b6d4" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>API 規格說明文件 (REST Reference)</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
          {/* Endpoint 1 */}
          <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.75rem', background: 'rgba(16,185,129,0.15)', padding: '1px 6px', borderRadius: '3px' }}>POST</span>
              <strong style={{ color: '#fff' }}>/api/inference/predict</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>- Base64 單張推論 (支援可選 ROI 裁剪)</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Request Body: <code>{`{ "model_id": "${activeProject.id}", "image_base64": "...", "roi": {"x":0.1,"y":0.1,"width":0.8,"height":0.8} }`}</code>
            </div>
          </div>

          {/* Endpoint 2 */}
          <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.75rem', background: 'rgba(16,185,129,0.15)', padding: '1px 6px', borderRadius: '3px' }}>POST</span>
              <strong style={{ color: '#fff' }}>/api/inference/predict-form</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>- Multipart Form 圖片檔案上傳推論</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Content-Type: <code>multipart/form-data</code> with field <code>file</code>
            </div>
          </div>

          {/* Endpoint 3 */}
          <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.75rem', background: 'rgba(16,185,129,0.15)', padding: '1px 6px', borderRadius: '3px' }}>POST</span>
              <strong style={{ color: '#fff' }}>/api/inference/batch</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>- 批次推論加速 (傳入多張 Base64 圖片)</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Request Body: <code>{`{ "model_id": "${activeProject.id}", "images_base64": ["...", "..."] }`}</code>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
