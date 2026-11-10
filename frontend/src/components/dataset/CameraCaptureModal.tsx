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

/** Region of interest in *displayed* frame coordinates (after optional mirroring), 0–1. */
interface Roi {
  x: number;
  y: number;
  w: number;
  h: number;
}

const MIN_ROI = 0.02; // ignore accidental clicks smaller than 2% of the frame
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
    /* storage unavailable: ROI just isn't remembered */
  }
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose, onCaptureImage }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  // Kept in a ref (not state) so cleanups always see the current stream, never a stale closure value.
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

  // ROI
  const [roi, setRoi] = useState<Roi | null>(null);
  const [roiMode, setRoiMode] = useState(false);
  const [draftRoi, setDraftRoi] = useState<Roi | null>(null);
  const roiStartRef = useRef<{ x: number; y: number } | null>(null);
  // Where the video picture actually sits inside the viewport (object-fit: contain), in px.
  const [frameRect, setFrameRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (isOpen) setRoi(loadRoi(projectId));
  }, [isOpen, projectId]);

  const updateRoi = (next: Roi | null) => {
    setRoi(next);
    saveRoi(projectId, next);
  };

  // ---------- Devices & stream ----------
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        const videoDevs = devs.filter((d) => d.kind === 'videoinput');
        setDevices(videoDevs);
        // Only pick a device if none is chosen; the first stream opens with the default camera,
        // so we don't restart the camera just to switch to the same device.
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
        // Queued with every other camera open in the app, so StrictMode's double effect or a quick
        // device switch never makes two opens overlap (Windows rejects the second one).
        const newStream = await openCameraStream(videoConstraints(selectedDeviceId || undefined, 1920, 1080));
        if (cancelled) {
          stopStream(newStream);
          return;
        }
        streamRef.current = newStream;
        if (videoRef.current) videoRef.current.srcObject = newStream;
        // Labels become available once permission is granted.
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

  // Clear the interval-capture timer on unmount.
  useEffect(() => {
    return () => {
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
    };
  }, []);

  // Track the on-screen picture rectangle so the ROI overlay lines up with the video.
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
      setTimeout(measureFrame, 50); // again after layout settles (aspect-ratio change)
    }
  };

  // ---------- ROI drawing ----------
  // Map a mouse position to 0–1 coordinates on the picture, measured live from the <video>
  // element (object-fit: contain) so a stale layout measurement can never skew the ROI.
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
    // Use the release point itself (not the last rendered draft) so a fast drag is never lost.
    const p = toFramePoint(e);
    const next = p ? rectFrom(start, p) : null;
    if (next && next.w >= MIN_ROI && next.h >= MIN_ROI) {
      updateRoi(next);
      setRoiMode(false);
    }
    setDraftRoi(null);
  };

  // ---------- Capture ----------
  const captureFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    // Crop in source pixels. The ROI is drawn on the displayed (possibly mirrored) picture.
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
  // Interval capture always uses the latest ROI / mirror setting.
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
  const badge: React.CSSProperties = {
    background: 'rgba(15, 23, 42, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#e2e8f0',
    padding: '3px 9px',
    borderRadius: '9999px',
    fontSize: '0.72rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    pointerEvents: 'none',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isZh ? '📷 攝影機即時擷取' : '📷 Live Camera Capture'}
      closeLabel={isZh ? '關閉' : 'Close'}
      maxWidth={videoResolution && videoResolution.aspect < 1.3 ? '680px' : '820px'}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
            {isZh ? `已擷取：${capturedCount} 張` : `Captured: ${capturedCount} frame${capturedCount !== 1 ? 's' : ''}`}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button variant="ghost" onClick={onClose}>
              {isZh ? '完成並關閉' : 'Done & Close'}
            </Button>
            <Button
              variant={isIntervalRunning ? 'danger' : 'secondary'}
              onClick={toggleIntervalCapture}
              disabled={!!errorMsg}
              icon={isIntervalRunning ? <Square size={14} /> : <Play size={14} />}
            >
              {isIntervalRunning
                ? (isZh ? '停止定時連拍' : 'Stop Auto Capture')
                : (isZh ? `定時連拍 (每 ${intervalSec} 秒)` : `Auto Capture (every ${intervalSec}s)`)}
            </Button>
            <Button variant="primary" onClick={() => captureRef.current()} disabled={!!errorMsg} icon={<Camera size={15} />}>
              {isZh ? (roi ? '拍照（ROI）' : '單張拍照') : (roi ? 'Capture (ROI)' : 'Capture')}
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Top Control Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
            <label htmlFor="vf-capture-device" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {isZh ? '選擇裝置：' : 'Device:'}
            </label>
            <select
              id="vf-capture-device"
              className="form-select"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
            >
              <option value="">{isZh ? '預設攝影機' : 'Default camera'}</option>
              {devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Camera #${i + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
              <Crop size={14} /> {roiMode ? (isZh ? '框選中…' : 'Drawing…') : roi ? (isZh ? '重設 ROI' : 'Redraw ROI') : (isZh ? '設定 ROI' : 'Set ROI')}
            </button>
            {roi && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateRoi(null)} title={isZh ? '清除 ROI，改存整張畫面' : 'Clear ROI and save the full frame'}>
                <X size={14} /> {isZh ? '清除 ROI' : 'Clear ROI'}
              </button>
            )}
            <button
              type="button"
              className={`btn btn-sm ${isFlipped ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIsFlipped(!isFlipped)}
              aria-pressed={isFlipped}
              title={isZh ? '水平鏡像翻轉' : 'Flip Horizontal'}
            >
              <FlipHorizontal size={14} /> {isZh ? '鏡像' : 'Flip'}
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
              <span>{isZh ? '連拍間隔:' : 'Interval:'}</span>
              <select
                className="form-select"
                style={{ width: '70px', padding: '2px 6px', fontSize: '0.8rem' }}
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
            background: '#040711',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          {errorMsg ? (
            <div style={{ textAlign: 'center', color: '#fda4af', padding: '1.5rem', maxWidth: '520px' }}>
              <AlertTriangle size={32} style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ marginBottom: '0.75rem' }}>{errorMsg}</p>
              <Button variant="secondary" size="sm" icon={<RotateCcw size={14} />} onClick={() => setRetryKey((k) => k + 1)}>
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

          {/* ROI layer: dims everything outside the region; captures the drag while drawing */}
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
                    border: '2px dashed var(--studio-highlight, #c6f432)',
                    boxShadow: '0 0 0 9999px rgba(4, 7, 17, 0.55)',
                    boxSizing: 'border-box',
                  }}
                />
              )}
              {roiMode && !draftRoi && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={badge}>{isZh ? '在畫面上拖曳，框選要保存的區域' : 'Drag on the picture to select the area to save'}</span>
                </div>
              )}
            </div>
          )}

          {/* Resolution / ROI badges */}
          {videoResolution && !errorMsg && (
            <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={badge}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
                <Video size={12} style={{ color: '#38bdf8' }} />
                {videoResolution.width} × {videoResolution.height} ({getAspectLabel(videoResolution.width, videoResolution.height)})
              </span>
              {roiPx && (
                <span style={badge}>
                  <Crop size={12} /> ROI {roiPx.w} × {roiPx.h}
                </span>
              )}
            </div>
          )}

          {isIntervalRunning && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(244, 63, 94, 0.9)',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                animation: 'pulse 1.5s infinite',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />
              {isZh ? `定時連拍中 (每 ${intervalSec}s)` : `Auto capturing every ${intervalSec}s`}
            </div>
          )}
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
          {roi
            ? (isZh ? '已設定 ROI：拍照與連拍只會保存框內區域（原始解析度），此專案會記住這個 ROI。' : 'ROI set: captures save only the selected area at full resolution. This project remembers it.')
            : (isZh ? '未設定 ROI：保存整張畫面。按「設定 ROI」可只保存需要的區域。' : 'No ROI: the full frame is saved. Use “Set ROI” to keep only the area you need.')}
        </p>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </Modal>
  );
};
