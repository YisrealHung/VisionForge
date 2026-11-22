import React, { useState, useEffect } from 'react';
import { Download, PackageCheck, CheckCircle2, Maximize2 } from 'lucide-react';
import { ModelExportInfo, OnnxExportResponse } from '../../types';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { useProject } from '../../context/ProjectContext';

interface OnnxExportCardProps {
  projectId: string;
  info: ModelExportInfo | null;
  onExportSuccess: () => void;
}

export const OnnxExportCard: React.FC<OnnxExportCardProps> = ({ projectId, info, onExportSuccess }) => {
  const { language } = useProject();
  const isZh = language === 'zh-TW';

  const isDetection = info
    ? info.architecture.includes('yolo') || info.architecture.includes('dfine') || info.architecture.includes('ssd')
    : true;
  const initialSize = info?.architecture.includes('ssd') ? 320 : isDetection ? 640 : 224;

  const [opset, setOpset] = useState<number>(14);
  const [imageSize, setImageSize] = useState<number>(initialSize);
  const [dynamicBatch, setDynamicBatch] = useState<boolean>(true);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<OnnxExportResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (info) {
      const sz = info.architecture.includes('ssd') ? 320 : isDetection ? 640 : 224;
      setImageSize(sz);
    }
  }, [info?.architecture, isDetection]);

  const handleExport = async () => {
    try {
      setExporting(true);
      setErrorMsg('');
      const res = await api.exportOnnx(projectId, {
        opset_version: opset,
        dynamic_batch: dynamicBatch,
        image_size: imageSize,
      });
      setExportResult(res);
      onExportSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || (isZh ? 'ONNX 匯出失敗' : 'ONNX export failed'));
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = () => {
    const downloadUrl = api.getOnnxDownloadUrl(projectId);
    window.open(downloadUrl, '_blank');
  };

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
            <PackageCheck size={16} strokeWidth={1.5} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 500 }}>
              {isZh ? 'ONNX 標準格式匯出' : 'ONNX Standard Format Export'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {isZh
                ? '轉換為開放神經網路格式 (ONNX)，部署至 TensorRT、OpenVINO 或 ONNX Runtime'
                : 'Convert to Open Neural Network Exchange (ONNX) for TensorRT, OpenVINO, or ONNX Runtime'}
            </p>
          </div>
        </div>

        {info?.onnx_exported && (
          <span className="badge badge-emerald">
            <CheckCircle2 size={12} strokeWidth={1.5} />
            {isZh ? `ONNX 就緒 (${info.onnx_size_str})` : `ONNX ready (${info.onnx_size_str})`}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Maximize2 size={13} strokeWidth={1.5} /> {isZh ? '輸入張量解析度' : 'Input Tensor Resolution'}
          </label>
          <select className="form-select vf-num" value={imageSize} onChange={(e) => setImageSize(Number(e.target.value))}>
            <option value={224}>{isZh ? '224 × 224（影像分類／輕量）' : '224 × 224 (Classification)'}</option>
            <option value={320}>{isZh ? '320 × 320（SSDLite／邊緣）' : '320 × 320 (SSDLite / Edge)'}</option>
            <option value={416}>{isZh ? '416 × 416（快速物件偵測）' : '416 × 416 (Fast detection)'}</option>
            <option value={640}>{isZh ? '640 × 640（標準 YOLO / D-FINE）' : '640 × 640 (Standard YOLO / D-FINE)'}</option>
            <option value={1024}>{isZh ? '1024 × 1024（高解析瑕疵檢測）' : '1024 × 1024 (High-res inspection)'}</option>
          </select>
          <span className="vf-num" style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'inline-block', marginTop: '4px' }}>
            {isZh ? '張量維度：' : 'Shape: '}
            <code style={{ color: 'var(--text-primary)' }}>[Batch, 3, {imageSize}, {imageSize}]</code>
          </span>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">ONNX Opset {isZh ? '版本' : 'Version'}</label>
          <select className="form-select vf-num" value={opset} onChange={(e) => setOpset(Number(e.target.value))}>
            <option value={14}>{isZh ? 'Opset 14（標準相容性）' : 'Opset 14 (Standard compatibility)'}</option>
            <option value={16}>{isZh ? 'Opset 16（支援 Transformer / CNN 運算子）' : 'Opset 16 (Transformer / CNN ops)'}</option>
            <option value={17}>{isZh ? 'Opset 17（現代架構）' : 'Opset 17 (Modern architectures)'}</option>
            <option value={18}>{isZh ? 'Opset 18（最新 ONNX 標準）' : 'Opset 18 (Latest ONNX standard)'}</option>
          </select>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'inline-block', marginTop: '4px' }}>
            {isZh ? '相容 ONNX Runtime 1.14+' : 'Compatible with ONNX Runtime 1.14+'}
          </span>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">{isZh ? '推論維度配置' : 'Batch Configuration'}</label>
          <div style={{ padding: '8px 12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={dynamicBatch}
                onChange={(e) => setDynamicBatch(e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)' }}
              />
              <span>{isZh ? '啟用動態批次 (Dynamic Batch)' : 'Enable Dynamic Batch'}</span>
            </label>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'inline-block', marginTop: '4px' }}>
            {isZh ? '支援單張即時與多張批次推論' : 'Supports single and batched inference'}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-rose-soft)',
            border: '1px solid rgba(200, 30, 30, 0.28)',
            color: 'var(--accent-rose)',
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          {errorMsg}
        </div>
      )}

      {exportResult && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-emerald-soft)',
            border: '1px solid rgba(21, 128, 61, 0.25)',
            color: 'var(--accent-emerald)',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontWeight: 500 }}>{exportResult.message}</div>
            <div className="vf-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {exportResult.onnx_path} · {imageSize}×{imageSize}
            </div>
          </div>
          <Button variant="primary" size="sm" icon={<Download size={14} strokeWidth={1.5} />} onClick={handleDownload}>
            {isZh ? '下載 ONNX' : 'Download ONNX'}
          </Button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
        <Button variant="secondary" icon={<PackageCheck size={15} strokeWidth={1.5} />} loading={exporting} onClick={handleExport}>
          {info?.onnx_exported ? (isZh ? '重新匯出 ONNX' : 'Re-export ONNX') : (isZh ? '轉換為 ONNX' : 'Export to ONNX')}
        </Button>

        {info?.onnx_exported && (
          <Button variant="primary" icon={<Download size={15} strokeWidth={1.5} />} onClick={handleDownload}>
            {isZh ? '下載' : 'Download'} {info.architecture}_best.onnx
          </Button>
        )}
      </div>
    </Card>
  );
};
