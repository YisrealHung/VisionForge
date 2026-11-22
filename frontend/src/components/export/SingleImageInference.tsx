import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Zap } from 'lucide-react';
import { PredictionResponse } from '../../types';
import { api } from '../../services/api';
import { useProject } from '../../context/ProjectContext';

interface SingleImageInferenceProps {
  projectId: string;
}

export const SingleImageInference: React.FC<SingleImageInferenceProps> = ({ projectId }) => {
  const [, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [categoryColorMap, setCategoryColorMap] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language } = useProject();
  const isZh = language === 'zh-TW';

  React.useEffect(() => {
    if (projectId) {
      api
        .getCategories(projectId)
        .then((cats) => {
          const m: Record<string, string> = {};
          cats.forEach((c) => {
            m[c.name] = c.color;
          });
          setCategoryColorMap(m);
        })
        .catch(() => {});
    }
  }, [projectId]);

  const requestSeqRef = useRef(0);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (file: File) => {
    const seq = ++requestSeqRef.current;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setErrorMsg('');
    setResult(null);

    try {
      setLoading(true);
      const res = await api.predictImage(projectId, file);
      if (seq !== requestSeqRef.current) return;
      setResult(res);
    } catch (err: any) {
      if (seq !== requestSeqRef.current) return;
      setErrorMsg(err.message || (isZh ? '推論失敗' : 'Inference failed'));
    } finally {
      if (seq === requestSeqRef.current) setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
      <div
        className={previewUrl ? '' : 'vf-reticle'}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          minHeight: '220px',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-strong)',
          background: previewUrl ? 'var(--canvas-bg)' : 'var(--bg-surface-elevated)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition: 'border-color var(--dur-fast) var(--ease-out)',
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
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
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
            <span style={{ fontSize: '12px', color: 'var(--canvas-muted)' }}>
              {isZh ? '點擊或拖曳更換測試圖片' : 'Click or drop to change image'}
            </span>
          </div>
        ) : (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UploadCloud size={18} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
              {isZh ? '拖曳圖片至此，或點擊選擇檔案' : 'Drop an image here, or click to select'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {isZh ? '支援 JPG, PNG, WebP · 上傳後自動推論' : 'JPG, PNG, WebP · Predicts automatically'}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          background: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              {isZh ? '預測結果' : 'Prediction'}
            </span>
            {result && (
              <span className="badge badge-neutral vf-num">
                <Zap size={11} strokeWidth={1.5} /> {result.inference_time_ms} ms
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid currentColor',
                  borderRightColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span>{isZh ? '正在執行推論…' : 'Running inference…'}</span>
            </div>
          ) : errorMsg ? (
            <div style={{ padding: '12px', color: 'var(--accent-rose)', fontSize: '13px', background: 'var(--accent-rose-soft)', borderRadius: 'var(--radius-sm)' }}>
              {errorMsg}
            </div>
          ) : result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: categoryColorMap[result.top_label] || 'var(--accent-primary)',
                      }}
                    />
                    <span>{isZh ? '最高機率預測' : 'Top prediction'}</span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {result.top_label}
                  </div>
                </div>
                <div className="vf-num" style={{ fontSize: '24px', fontWeight: 500, color: 'var(--accent-primary)', flexShrink: 0 }}>
                  {result.top_confidence.toFixed(1)}%
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {isZh ? '各類別機率分佈' : 'Class probabilities'}
                </span>
                {result.predictions.map((p, idx) => {
                  const isTop = idx === 0;
                  const barColor = isTop ? 'var(--accent-primary)' : 'var(--text-muted)';
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div className="vf-num" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: isTop ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isTop ? 500 : 400 }}>
                          {p.label}
                        </span>
                        <span style={{ color: isTop ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isTop ? 500 : 400 }}>
                          {p.confidence.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '4px', background: 'var(--bg-surface)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${p.confidence}%`,
                            height: '100%',
                            background: barColor,
                            opacity: isTop ? 1 : 0.45,
                            borderRadius: '2px',
                            transition: 'width var(--dur-med) var(--ease-out)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              {isZh ? '請上傳或拖入圖片以檢視預測結果' : 'Upload or drop an image to see predictions'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
