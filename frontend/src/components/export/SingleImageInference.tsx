import React, { useState, useRef } from 'react';
import { UploadCloud, Zap, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { PredictionResponse } from '../../types';
import { api } from '../../services/api';
import { Button } from '../common/Button';

interface SingleImageInferenceProps {
  projectId: string;
}

export const SingleImageInference: React.FC<SingleImageInferenceProps> = ({ projectId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [categoryColorMap, setCategoryColorMap] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (projectId) {
      api.getCategories(projectId).then(cats => {
        const m: Record<string, string> = {};
        cats.forEach(c => { m[c.name] = c.color; });
        setCategoryColorMap(m);
      }).catch(() => {});
    }
  }, [projectId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setErrorMsg('');
    setResult(null);

    // Auto-trigger prediction
    try {
      setLoading(true);
      const res = await api.predictImage(projectId, file);
      setResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || '推論失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* Upload & Preview Box */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            minHeight: '220px',
            borderRadius: 'var(--radius-md)',
            border: '2px dashed var(--border-subtle)',
            background: previewUrl ? 'transparent' : 'var(--bg-base)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {previewUrl ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <img
                src={previewUrl}
                alt="Upload preview"
                style={{
                  maxHeight: '180px',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>點擊或拖曳更換測試圖片</span>
            </div>
          ) : (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UploadCloud size={22} />
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                拖曳圖片至此，或點擊選擇檔案
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                支援 JPG, PNG, WebP · 自動進行即時推論
              </div>
            </div>
          )}
        </div>

        {/* Prediction Results Display */}
        <div
          style={{
            background: 'var(--bg-base)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                即時預測結果
              </span>
              {result && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: '#06b6d4',
                    background: 'rgba(6, 182, 212, 0.12)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Zap size={11} /> 耗時 {result.inference_time_ms} ms
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span className="spinner" style={{ marginRight: '8px' }} />
                正在進行 PyTorch 影像特徵提取與分類...
              </div>
            ) : errorMsg ? (
              <div style={{ padding: '1rem', color: '#fda4af', fontSize: '0.8rem', background: 'rgba(244,63,94,0.1)', borderRadius: 'var(--radius-sm)' }}>
                {errorMsg}
              </div>
            ) : result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Top Prediction Banner */}
                {(() => {
                  const topColor = categoryColorMap[result.top_label] || '#10b981';
                  return (
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: `${topColor}18`,
                        border: `1.5px solid ${topColor}55`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: `0 2px 10px ${topColor}20`,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.7rem', color: topColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: topColor }} />
                          最高機率預測
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                          {result.top_label}
                        </div>
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: topColor }}>
                        {result.top_confidence.toFixed(1)}%
                      </div>
                    </div>
                  );
                })()}

                {/* All Classes Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    各類別機率分佈 (Softmax Confidence):
                  </span>
                  {result.predictions.map((p, idx) => {
                    const cColor = categoryColorMap[p.label] || (idx === 0 ? '#10b981' : '#818cf8');
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ color: idx === 0 ? cColor : 'var(--text-secondary)', fontWeight: idx === 0 ? 700 : 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cColor }} />
                            {p.label}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>{p.confidence.toFixed(1)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '5px', background: 'var(--bg-surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${p.confidence}%`,
                              height: '100%',
                              background: cColor,
                              borderRadius: '3px',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                請上傳或拖入一張圖片以開始即時推論
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
