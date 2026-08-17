import React, { useState, useRef } from 'react';
import { Play, Send, FileJson, CheckCircle2, AlertCircle, UploadCloud, Layers } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface ApiPlaygroundProps {
  projectId: string;
}

export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({ projectId }) => {
  const [endpoint, setEndpoint] = useState<'predict' | 'predict-form' | 'batch'>('predict');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [responseJson, setResponseJson] = useState<any | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResponseJson(null);
      setStatusCode(null);
      setErrorMsg('');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSendRequest = async () => {
    if (!selectedFile) {
      setErrorMsg('請先選擇一張測試圖片');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const startT = performance.now();

      let result: any;
      if (endpoint === 'predict') {
        const b64 = await fileToBase64(selectedFile);
        result = await api.inferencePredict({
          model_id: projectId,
          image_base64: b64,
        });
      } else if (endpoint === 'predict-form') {
        result = await api.inferencePredictForm(selectedFile, projectId);
      } else if (endpoint === 'batch') {
        const b64 = await fileToBase64(selectedFile);
        result = await api.inferenceBatch({
          model_id: projectId,
          images_base64: [b64, b64], // Send batch of 2
        });
      }

      const dur = Math.round(performance.now() - startT);
      setLatency(dur);
      setStatusCode(200);
      setResponseJson(result);
    } catch (err: any) {
      setStatusCode(400);
      setErrorMsg(err.message || 'API 請求失敗');
      setResponseJson({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileJson size={18} color="#818cf8" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>互動式 API 測試工作台 (Playground)</h3>
        </div>

        {/* Endpoint Selector Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setEndpoint('predict')}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: endpoint === 'predict' ? 'var(--accent-primary)' : 'transparent',
              color: endpoint === 'predict' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            POST /predict (Base64)
          </button>
          <button
            onClick={() => setEndpoint('predict-form')}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: endpoint === 'predict-form' ? 'var(--accent-primary)' : 'transparent',
              color: endpoint === 'predict-form' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            POST /predict-form (Multipart)
          </button>
          <button
            onClick={() => setEndpoint('batch')}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: endpoint === 'batch' ? 'var(--accent-primary)' : 'transparent',
              color: endpoint === 'batch' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            POST /batch (批次)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {/* Left: Input Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              minHeight: '160px',
              border: '2px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              background: previewUrl ? 'transparent' : 'var(--bg-base)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '1rem',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            {previewUrl ? (
              <div style={{ textAlign: 'center' }}>
                <img
                  src={previewUrl}
                  alt="Payload preview"
                  style={{ maxHeight: '130px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px' }}
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  已選取: {selectedFile?.name} (點擊更換)
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <UploadCloud size={28} style={{ margin: '0 auto 6px', color: '#818cf8' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  點擊選擇測試圖片
                </div>
                <div style={{ fontSize: '0.7rem' }}>作為 API 請求 Payload 內容</div>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            icon={<Send size={14} />}
            loading={loading}
            onClick={handleSendRequest}
          >
            發送 API 請求 (Send Request)
          </Button>

          {errorMsg && (
            <div style={{ padding: '0.6rem', background: 'rgba(244,63,94,0.1)', color: '#fda4af', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Right: Response Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              API 回傳結果 (Response Body)
            </span>
            {statusCode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: statusCode === 200 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    color: statusCode === 200 ? '#10b981' : '#f43f5e',
                  }}
                >
                  HTTP {statusCode} {statusCode === 200 ? 'OK' : 'Error'}
                </span>
                {latency !== null && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {latency} ms
                  </span>
                )}
              </div>
            )}
          </div>

          <pre
            style={{
              background: '#070a12',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              fontFamily: "'JetBrains Mono', monospace",
              color: '#cbd5e1',
              height: '220px',
              overflowY: 'auto',
              margin: 0,
              lineHeight: '1.5',
            }}
          >
            <code>
              {responseJson
                ? JSON.stringify(responseJson, null, 2)
                : '// 點擊「發送 API 請求」後，JSON 回應將即時在此格式化顯示...'}
            </code>
          </pre>
        </div>
      </div>
    </Card>
  );
};
