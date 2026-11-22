import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, FlipHorizontal, Play, Square, Video, Crop, X, AlertTriangle, RotateCcw } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useProject } from '../../context/ProjectContext';
import { describeCameraError, openCameraStream, stopStream, videoConstraints } from '../../services/camera';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureImage: (file: File) => Promise<void>;
}

interface Roi {
  x: number;
  y: number;
  w: number;
  h: number;
}

const MIN_ROI = 0.02;
const roiStorageKey = (projectId: string | undefined) => `visionforge_capture_roi:${projectId || 'default'}`;

function loadRoi(projectId: string | undefined): Roi | null {
  try {
    const raw = localStorage.getItem(roiStorageKey(projectId));
    if (!raw) return null;
    const r = JSON.parse(raw);
    return typeof r?.x === 'number' && r.w > 0 && r.h > 0 ? r : null;
  } catch {
    return null;
  }
}

function saveRoi(projectId: string | undefined, roi: Roi | null) {
  try {
    if (roi) localStorage.setItem(roiStorageKey(projectId), JSON.stringify(roi));
    else localStorage.removeItem(roiStorageKey(projectId));
  } catch {
    /* storage unavailable */
  }
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose, onCaptureImage }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [isIntervalRunning, setIsIntervalRunning] = useState(false);
  const [intervalSec, setIntervalSec] = useState(2);
  const [errorMsg, setErrorMsg] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [videoResolution, setVideoResolution] = useState<{ width: number; height: number; aspect: number } | null>(null);
  const intervalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { language, activeProject } = useProject();
  const isZh = language === 'zh-TW';
  const projectId = activeProject?.id;

  const [roi, setRoi] = useState<Roi | null>(null);
  const [roiMode, setRoiMode] = useState(false);
  const [draftRoi, setDraftRoi] = useState<Roi | null>(null);
  const roiStartRef = useRef<{ x: number; y: number } | null>(null);
  const [frameRect, setFrameRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (isOpen) setRoi(loadRoi(projectId));
  }, [isOpen, projectId]);

  const updateRoi = (next: Roi | null) => {
    setRoi(next);
    saveRoi(projectId, next);
  };

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        const videoDevs = devs.filter((d) => d.kind === 'videoinput');
        setDevices(videoDevs);
        setSelectedDeviceId((cur) => cur || '');
      } catch (err) {
        console.error('Failed to enumerate devices:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, retryKey]);

  useEffect(() => {
    if (!isOpen) {
      stopStream(streamRef.current);
      streamRef.current = null;
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
        intervalTimerRef.current = null;
        setIsIntervalRunning(false);
      }
      setVideoResolution(null);
      setRoiMode(false);
      setDraftRoi(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setErrorMsg('');
      stopStream(streamRef.current);
      streamRef.current = null;
      try {
        const newStream = await openCameraStream(videoConstraints(selectedDeviceId || undefined, 1920, 1080));
        if (cancelled) {
          stopStream(newStream);
          return;
        }
        streamRef.current = newStream;
        if (videoRef.current) videoRef.current.srcObject = newStream;
        const devs = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setDevices(devs.filter((d) => d.kind === 'videoinput'));
      } catch (err) {
        if (cancelled) return;
        console.error('Camera access error:', err);
        setErrorMsg(describeCameraError(err, isZh));
      }
    })();

    return () => {
      cancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedDeviceId, retryKey]);

  useEffect(() => {
    return () => {
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
    };
  }, []);

  const measureFrame = useCallback(() => {
    const v = videoRef.current;
    const box = viewportRef.current;
    if (!v || !box || !v.videoWidth || !v.videoHeight) return;
    const vb = v.getBoundingClientRect();
    const bb = box.getBoundingClientRect();
    const s = Math.min(vb.width / v.videoWidth, vb.height / v.videoHeight);
    const w = v.videoWidth * s;
    const h = v.videoHeight * s;
    setFrameRect({ left: vb.left - bb.left + (vb.width - w) / 2, top: vb.top - bb.top + (vb.height - h) / 2, width: w, height: h });
  }, []);

  useEffect(() => {
    const box = viewportRef.current;
    if (!box) return;
    const ro = new ResizeObserver(() => measureFrame());
    ro.observe(box);
    return () => ro.disconnect();
  }, [measureFrame, isOpen]);

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (v.videoWidth && v.videoHeight) {
      setVideoResolution({ width: v.videoWidth, height: v.videoHeight, aspect: v.videoWidth / v.videoHeight });
      measureFrame();
      setTimeout(measureFrame, 50);
    }
  };

  const toFramePoint = (e: React.MouseEvent) => {
    const v = videoRef.current;
    if (!v || !v.videoWidth || !v.videoHeight) return null;
    const vb = v.getBoundingClientRect();
    const s = Math.min(vb.width / v.videoWidth, vb.height / v.videoHeight);
    const w = v.videoWidth * s;
    const h = v.videoHeight * s;
    const left = vb.left + (vb.width - w) / 2;
    const top = vb.top + (vb.height - h) / 2;
    return { x: clamp01((e.clientX - left) / w), y: clamp01((e.clientY - top) / h) };
  };

  const rectFrom = (a: { x: number; y: number }, b: { x: number; y: number }): Roi => ({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x),
    h: Math.abs(b.y - a.y),
  });

  const onRoiDown = (e: React.MouseEvent) => {
    if (!roiMode || e.button !== 0) return;
    measureFrame();
    const p = toFramePoint(e);
    if (!p) return;
    roiStartRef.current = p;
    setDraftRoi({ x: p.x, y: p.y, w: 0, h: 0 });
  };
  const onRoiMove = (e: React.MouseEvent) => {
    const start = roiStartRef.current;
    if (!roiMode || !start) return;
    const p = toFramePoint(e);
    if (p) setDraftRoi(rectFrom(start, p));
  };
  const onRoiUp = (e: React.MouseEvent) => {
    const start = roiStartRef.current;
    if (!start) return;
    roiStartRef.current = null;
    const p = toFramePoint(e);
    const next = p ? rectFrom(start, p) : null;
    if (next && next.w >= MIN_ROI && next.h >= MIN_ROI) {
      updateRoi(next);
      setRoiMode(false);
    }
    setDraftRoi(null);
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const r = roi ?? { x: 0, y: 0, w: 1, h: 1 };
    const sw = Math.max(1, Math.round(r.w * vw));
    const sh = Math.max(1, Math.round(r.h * vh));
    const dispX = Math.round(r.x * vw);
    const sy = Math.round(r.y * vh);
    const sx = isFlipped ? vw - dispX - sw : dispX;

    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (isFlipped) {
      ctx.translate(sw, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
    canvas.toBlob(async (blob) => {
      if (blob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `cam_shot_${timestamp}.jpg`, { type: 'image/jpeg' });
        await onCaptureImage(file);
        setCapturedCount((prev) => prev + 1);
      }
    }, 'image/jpeg', 0.95);
  };
  const captureRef = useRef(captureFrame);
  captureRef.current = captureFrame;

  const toggleIntervalCapture = () => {
    if (isIntervalRunning) {
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
      setIsIntervalRunning(false);
    } else {
      captureRef.current();
      intervalTimerRef.current = setInterval(() => captureRef.current(), intervalSec * 1000);
      setIsIntervalRunning(true);
    }
  };

  const getAspectLabel = (w: number, h: number) => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(w, h);
    const rw = w / divisor;
    const rh = h / divisor;
    return rw <= 21 && rh <= 16 ? `${rw}:${rh}` : `${(w / h).toFixed(2)}:1`;
  };

  const shownRoi = draftRoi ?? roi;
  const roiPx = roi && videoResolution ? { w: Math.round(roi.w * videoResolution.width), h: Math.round(roi.h * videoResolution.height) } : null;
  const overlayBadge: React.CSSProperties = {
    background: 'rgba(17, 17, 19, 0.82)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#ededf0',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    fontVariantNumeric: 'tabular-nums',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    pointerEvents: 'none',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isZh ? '攝影機即時擷取' : 'Live Camera Capture'}
      closeLabel={isZh ? '關閉' : 'Close'}
      maxWidth={videoResolution && videoResolution.aspect < 1.3 ? '680px' : '820px'}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
          <div className="vf-num" style={{ fontSize: '13px', color: 'var(--accent-primary)', fontWeight: 500 }}>
            {isZh ? `已擷取 ${capturedCount} 張` : `Captured ${capturedCount} frame${capturedCount !== 1 ? 's' : ''}`}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="ghost" onClick={onClose}>
              {isZh ? '完成並關閉' : 'Done'}
            </Button>
            <Button
              variant={isIntervalRunning ? 'danger' : 'secondary'}
              onClick={toggleIntervalCapture}
              disabled={!!errorMsg}
              icon={isIntervalRunning ? <Square size={14} strokeWidth={1.5} /> : <Play size={14} strokeWidth={1.5} />}
            >
              {isIntervalRunning
                ? (isZh ? '停止連拍' : 'Stop auto capture')
                : (isZh ? `定時連拍（每 ${intervalSec} 秒）` : `Auto capture (${intervalSec}s)`)}
            </Button>
            <Button variant="primary" onClick={() => captureRef.current()} disabled={!!errorMsg} icon={<Camera size={15} strokeWidth={1.5} />}>
              {isZh ? (roi ? '拍照 (ROI)' : '單張拍照') : (roi ? 'Capture (ROI)' : 'Capture')}
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
            <label htmlFor="vf-capture-device" style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {isZh ? '裝置' : 'Device'}
            </label>
            <select
              id="vf-capture-device"
              className="form-select"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              style={{ fontSize: '13px', padding: '6px 10px' }}
            >
              <option value="">{isZh ? '預設攝影機' : 'Default camera'}</option>
              {devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Camera #${i + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${roiMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                measureFrame();
                setRoiMode((m) => !m);
                setDraftRoi(null);
              }}
              disabled={!!errorMsg}
              aria-pressed={roiMode}
              title={isZh ? '在畫面上拖曳框選要保存的區域' : 'Drag on the picture to choose the area to save'}
            >
              <Crop size={14} strokeWidth={1.5} /> {roiMode ? (isZh ? '框選中…' : 'Drawing…') : roi ? (isZh ? '重設 ROI' : 'Redraw ROI') : (isZh ? '設定 ROI' : 'Set ROI')}
            </button>
            {roi && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateRoi(null)} title={isZh ? '清除 ROI，改存整張畫面' : 'Clear ROI and save the full frame'}>
                <X size={14} strokeWidth={1.5} /> {isZh ? '清除 ROI' : 'Clear ROI'}
              </button>
            )}
            <button
              type="button"
              className={`btn btn-sm ${isFlipped ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIsFlipped(!isFlipped)}
              aria-pressed={isFlipped}
              title={isZh ? '水平鏡像翻轉' : 'Flip horizontal'}
            >
              <FlipHorizontal size={14} strokeWidth={1.5} /> {isZh ? '鏡像' : 'Flip'}
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>{isZh ? '間隔' : 'Interval'}</span>
              <select
                className="form-select"
                style={{ width: '68px', padding: '4px 8px', fontSize: '13px' }}
                value={intervalSec}
                onChange={(e) => setIntervalSec(Number(e.target.value))}
                disabled={isIntervalRunning}
              >
                <option value={1}>1s</option>
                <option value={2}>2s</option>
                <option value={3}>3s</option>
                <option value={5}>5s</option>
              </select>
            </label>
          </div>
        </div>

        {/* Video viewport */}
        <div
          ref={viewportRef}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: videoResolution ? `${videoResolution.width} / ${videoResolution.height}` : '16 / 9',
            maxHeight: '62vh',
            background: 'var(--canvas-bg)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          {errorMsg ? (
            <div style={{ textAlign: 'center', color: '#f87171', padding: '24px', maxWidth: '520px' }}>
              <AlertTriangle size={28} strokeWidth={1.5} style={{ margin: '0 auto 8px' }} />
              <p style={{ marginBottom: '12px', fontSize: '13px' }}>{errorMsg}</p>
              <Button variant="secondary" size="sm" icon={<RotateCcw size={14} strokeWidth={1.5} />} onClick={() => setRetryKey((k) => k + 1)}>
                {isZh ? '重試' : 'Retry'}
              </Button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={handleVideoLoadedMetadata}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: isFlipped ? 'scaleX(-1)' : 'none',
                display: 'block',
              }}
            />
          )}

          {!errorMsg && frameRect && (roiMode || shownRoi) && (
            <div
              onMouseDown={onRoiDown}
              onMouseMove={onRoiMove}
              onMouseUp={onRoiUp}
              onMouseLeave={onRoiUp}
              style={{
                position: 'absolute',
                left: frameRect.left,
                top: frameRect.top,
                width: frameRect.width,
                height: frameRect.height,
                cursor: roiMode ? 'crosshair' : 'default',
                pointerEvents: roiMode ? 'auto' : 'none',
                overflow: 'hidden',
              }}
            >
              {shownRoi && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${shownRoi.x * 100}%`,
                    top: `${shownRoi.y * 100}%`,
                    width: `${shownRoi.w * 100}%`,
                    height: `${shownRoi.h * 100}%`,
                    border: '2px dashed var(--accent-primary)',
                    boxShadow: '0 0 0 9999px rgba(17, 17, 19, 0.56)',
                    boxSizing: 'border-box',
                  }}
                />
              )}
              {roiMode && !draftRoi && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={overlayBadge}>{isZh ? '在畫面上拖曳，框選要保存的區域' : 'Drag on the frame to select the region'}</span>
                </div>
              )}
            </div>
          )}

          {videoResolution && !errorMsg && (
            <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={overlayBadge}>
                <span className="vf-status-dot online" aria-hidden="true" />
                <Video size={13} strokeWidth={1.5} />
                {videoResolution.width} × {videoResolution.height} ({getAspectLabel(videoResolution.width, videoResolution.height)})
              </span>
              {roiPx && (
                <span style={overlayBadge}>
                  <Crop size={13} strokeWidth={1.5} /> ROI {roiPx.w} × {roiPx.h}
                </span>
              )}
            </div>
          )}

          {isIntervalRunning && (
            <div
              className="vf-num"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(200, 30, 30, 0.92)',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} />
              {isZh ? `連拍中 (${intervalSec}s)` : `Auto capture (${intervalSec}s)`}
            </div>
          )}
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
          {roi
            ? (isZh ? '已設定 ROI：拍照與連拍只保存框內原始解析度區域，並對此專案記住該設定' : 'ROI active: captures save only the cropped full-resolution region for this project')
            : (isZh ? '未設定 ROI：保存整張畫面；點擊「設定 ROI」可僅保存局部區域' : 'No ROI: full frame is saved. Select "Set ROI" to crop a specific area')}
        </p>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </Modal>
  );
};
