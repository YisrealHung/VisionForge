import React, { useState, useEffect } from 'react';
import { Download, PackageCheck, Sparkles, CheckCircle2, Maximize2 } from 'lucide-react';
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

  const isDetection = info ? (info.architecture.includes('yolo') || info.architecture.includes('dfine') || info.architecture.includes('ssd')) : true;
  const initialSize = info?.architecture.includes('ssd') ? 320 : (isDetection ? 640 : 224);

  const [opset, setOpset] = useState<number>(14);
  const [imageSize, setImageSize] = useState<number>(initialSize);
  const [dynamicBatch, setDynamicBatch] = useState<boolean>(true);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<OnnxExportResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (info) {
      const sz = info.architecture.includes('ssd') ? 320 : (isDetection ? 640 : 224);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PackageCheck size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              {isZh ? 'ONNX 標準格式模型匯出' : 'ONNX Standard Format Export'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {isZh
                ? '轉換為開放神經網絡格式 (ONNX)，直接部署至生產端、TensorRT 或 ONNX Runtime'
                : 'Convert to Open Neural Network Exchange (ONNX) for TensorRT, ONNX Runtime, or production deployment'}
            </p>
          </div>
        </div>

        {info?.onnx_exported && (
          <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={13} /> {isZh ? `已具備 ONNX 匯出檔 (${info.onnx_size_str})` : `ONNX ready (${info.onnx_size_str})`}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Maximize2 size={13} color="#818cf8" /> {isZh ? '輸入張量解析度 (Image Size)' : 'Input Tensor Resolution'}
          </label>
          <select className="form-select" value={imageSize} onChange={(e) => setImageSize(Number(e.target.value))}>
            <option value={224}>{isZh ? '224 × 224 (影像分類 / 超輕量)' : '224 × 224 (Classification / Lightweight)'}</option>
            <option value={320}>{isZh ? '320 × 320 (SSDLite / 移動邊緣端)' : '320 × 320 (SSDLite / Mobile Edge)'}</option>
            <option value={416}>{isZh ? '416 × 416 (經典快速物件偵測)' : '416 × 416 (Classic fast detection)'}</option>
            <option value={640}>{isZh ? '640 × 640 (標準推薦 / YOLO & D-FINE)' : '640 × 640 (Standard / YOLO & D-FINE)'}</option>
            <option value={1024}>{isZh ? '1024 × 1024 (超高清工業瑕疵質檢)' : '1024 × 1024 (Industrial inspection)'}</option>
          </select>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {isZh ? '輸入張量格式: ' : 'Tensor format: '}<code style={{ color: '#818cf8' }}>[Batch, 3, {imageSize}, {imageSize}]</code>
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">ONNX Opset {isZh ? '版本' : 'Version'}</label>
          <select className="form-select" value={opset} onChange={(e) => setOpset(Number(e.target.value))}>
            <option value={14}>{isZh ? 'Opset 14 (標準推薦，相容性最高)' : 'Opset 14 (Recommended, max compatibility)'}</option>
            <option value={16}>{isZh ? 'Opset 16 (支援進階 Transformer / CNN 運算子)' : 'Opset 16 (Advanced Transformer/CNN ops)'}</option>
            <option value={17}>{isZh ? 'Opset 17 (現代架構推薦)' : 'Opset 17 (Modern architectures)'}</option>
            <option value={18}>{isZh ? 'Opset 18 (最新 ONNX 標準)' : 'Opset 18 (Latest ONNX standard)'}</option>
          </select>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {isZh ? '相容 ONNX Runtime 1.14+' : 'Compatible with ONNX Runtime 1.14+'}
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">{isZh ? '推論維度配置' : 'Batch Configuration'}</label>
          <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
              <input type="checkbox" checked={dynamicBatch} onChange={(e) => setDynamicBatch(e.target.checked)} />
              <span>{isZh ? '啟用動態批次 (Dynamic Batch)' : 'Enable Dynamic Batch'}</span>
            </label>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {isZh ? '支援單張即時推論與批次大流量加速' : 'Supports single-image inference and batch acceleration'}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {errorMsg}
        </div>
      )}

      {exportResult && (
        <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <strong>✨ {exportResult.message}</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isZh ? '路徑' : 'Path'}: {exportResult.onnx_path} · {imageSize}×{imageSize}
            </div>
          </div>
          <Button variant="primary" size="sm" icon={<Download size={14} />} onClick={handleDownload}>
            {isZh ? '立即下載 ONNX' : 'Download ONNX'}
          </Button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
        <Button variant="secondary" icon={<Sparkles size={15} />} loading={exporting} onClick={handleExport}>
          {info?.onnx_exported
            ? (isZh ? '重新匯出 ONNX' : 'Re-export ONNX')
            : (isZh ? '一鍵轉出 ONNX 模型' : 'Export to ONNX')}
        </Button>

        {info?.onnx_exported && (
          <Button variant="primary" icon={<Download size={15} />} onClick={handleDownload}>
            {isZh ? '下載' : 'Download'} {info.architecture}_best.onnx
          </Button>
        )}
      </div>
    </Card>
  );
};
