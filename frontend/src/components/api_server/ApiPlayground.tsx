import React, { useState, useRef, useEffect } from 'react';
import { Send, FileJson, UploadCloud } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { useProject } from '../../context/ProjectContext';

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
  const { language } = useProject();
  const isZh = language === 'zh-TW';

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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
      setErrorMsg(isZh ? '請先選擇一張測試圖片' : 'Select a test image first');
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
          images_base64: [b64, b64],
        });
      }

      const dur = Math.round(performance.now() - startT);
      setLatency(dur);
      setStatusCode(200);
      setResponseJson(result);
    } catch (err: any) {
      setStatusCode(400);
      setErrorMsg(err.message || (isZh ? 'API 請求失敗' : 'API request failed'));
      setResponseJson({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileJson size={16} strokeWidth={1.5} color="var(--text-secondary)" />
          <h3 style={{ fontSize: '16px', fontWeight: 500 }}>
            {isZh ? '互動式 API 測試工作台' : 'Interactive API playground'}
          </h3>
        </div>

        <div className="vf-tabs" role="tablist" aria-label={isZh ? '端點選擇' : 'Select endpoint'}>
          <button
            type="button"
            role="tab"
            aria-selected={endpoint === 'predict'}
            className={`vf-tab ${endpoint === 'predict' ? 'active' : ''}`}
            onClick={() => setEndpoint('predict')}
          >
            POST /predict
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={endpoint === 'predict-form'}
            className={`vf-tab ${endpoint === 'predict-form' ? 'active' : ''}`}
            onClick={() => setEndpoint('predict-form')}
          >
            POST /predict-form
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={endpoint === 'batch'}
            className={`vf-tab ${endpoint === 'batch' ? 'active' : ''}`}
            onClick={() => setEndpoint('batch')}
          >
            POST /batch
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            className={previewUrl ? '' : 'vf-reticle'}
            onClick={() => fileInputRef.current?.click()}
            style={{
              minHeight: '176px',
              border: '1px dashed var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              background: previewUrl ? 'var(--canvas-bg)' : 'var(--bg-surface-elevated)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '16px',
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
                <div style={{ fontSize: '12px', color: 'var(--canvas-muted)', marginTop: '6px' }}>
                  {isZh ? `已選取 ${selectedFile?.name}（點擊更換）` : `${selectedFile?.name} (click to change)`}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <UploadCloud size={22} strokeWidth={1.5} style={{ margin: '0 auto 8px', color: 'var(--text-secondary)' }} />
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {isZh ? '選擇測試圖片' : 'Select test image'}
                </div>
                <div style={{ fontSize: '12px', marginTop: '2px' }}>
                  {isZh ? '作為 API 請求測試資料' : 'Used as API request payload'}
                </div>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            icon={<Send size={14} strokeWidth={1.5} />}
            loading={loading}
            onClick={handleSendRequest}
          >
            {isZh ? '發送 API 請求' : 'Send API request'}
          </Button>

          {errorMsg && (
            <div style={{ padding: '8px 12px', background: 'var(--accent-rose-soft)', color: 'var(--accent-rose)', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}>
              {errorMsg}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              {isZh ? '回傳內容 (JSON)' : 'Response body'}
            </span>
            {statusCode && (
              <div className="vf-num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className="badge"
                  style={{
                    background: statusCode === 200 ? 'var(--accent-emerald-soft)' : 'var(--accent-rose-soft)',
                    color: statusCode === 200 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  }}
                >
                  HTTP {statusCode} {statusCode === 200 ? 'OK' : 'Error'}
                </span>
                {latency !== null && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{latency} ms</span>
                )}
              </div>
            )}
          </div>

          <pre
            className="vf-mono"
            style={{
              background: 'var(--canvas-bg)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--canvas-border)',
              fontSize: '12px',
              color: 'var(--canvas-text)',
              height: '220px',
              overflowY: 'auto',
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            <code>
              {responseJson
                ? JSON.stringify(responseJson, null, 2)
                : isZh
                ? '// 點擊「發送 API 請求」後，JSON 回應將顯示於此…'
                : '// Click "Send API request" to view the formatted JSON response…'}
            </code>
          </pre>
        </div>
      </div>
    </Card>
  );
};
