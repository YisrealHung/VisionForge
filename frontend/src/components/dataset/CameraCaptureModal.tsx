import React, { useState, useRef, useEffect } from 'react';
import { Camera, FlipHorizontal, Play, Square } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useProject } from '../../context/ProjectContext';
import { AlertTriangle } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureImage: (file: File) => Promise<void>;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCaptureImage,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [isIntervalRunning, setIsIntervalRunning] = useState(false);
  const [intervalSec, setIntervalSec] = useState(2);
  const [errorMsg, setErrorMsg] = useState('');
  const intervalTimerRef = useRef<any>(null);
  const { language } = useProject();
  const isZh = language === 'zh-TW';

  useEffect(() => {
    if (!isOpen) return;
    const getDevices = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devs.filter((d) => d.kind === 'videoinput');
        setDevices(videoDevs);
        if (videoDevs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevs[0].deviceId);
        }
      } catch (err) {
        console.error('Failed to enumerate devices:', err);
      }
    };
    getDevices();
  }, [isOpen, selectedDeviceId]);

  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
        setIsIntervalRunning(false);
      }
      return;
    }

    const startCamera = async () => {
      try {
        setErrorMsg('');
        if (stream) stream.getTracks().forEach((t) => t.stop());
        const constraints: MediaStreamConstraints = {
          video: selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);
        if (videoRef.current) videoRef.current.srcObject = newStream;
      } catch (err: any) {
        setErrorMsg(
          isZh
            ? '無法存取攝影機，請確認瀏覽器已允許攝影機權限或裝置未被其他程式占用。'
            : 'Cannot access camera. Please ensure the browser has camera permission and the device is not in use.'
        );
        console.error('Camera access error:', err);
      }
    };

    startCamera();
    return () => { if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, [isOpen, selectedDeviceId]);

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (isFlipped) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (blob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `cam_shot_${timestamp}.jpg`, { type: 'image/jpeg' });
        await onCaptureImage(file);
        setCapturedCount((prev) => prev + 1);
      }
    }, 'image/jpeg', 0.95);
  };

  const toggleIntervalCapture = () => {
    if (isIntervalRunning) {
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
      setIsIntervalRunning(false);
    } else {
      captureFrame();
      intervalTimerRef.current = setInterval(() => captureFrame(), intervalSec * 1000);
      setIsIntervalRunning(true);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isZh ? '📷 攝影機即時擷取' : '📷 Live Camera Capture'}
      maxWidth="780px"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 600 }}>
            {isZh ? `已擷取：${capturedCount} 張` : `Captured: ${capturedCount} frame${capturedCount !== 1 ? 's' : ''}`}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="ghost" onClick={onClose}>
              {isZh ? '完成並關閉' : 'Done & Close'}
            </Button>
            <Button
              variant={isIntervalRunning ? 'danger' : 'secondary'}
              onClick={toggleIntervalCapture}
              icon={isIntervalRunning ? <Square size={14} /> : <Play size={14} />}
            >
              {isIntervalRunning
                ? (isZh ? '停止定時連拍' : 'Stop Auto Capture')
                : (isZh ? `定時連拍 (每 ${intervalSec} 秒)` : `Auto Capture (every ${intervalSec}s)`)}
            </Button>
            <Button variant="primary" onClick={captureFrame} icon={<Camera size={15} />}>
              {isZh ? '單張拍照' : 'Capture'}
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {isZh ? '選擇裝置：' : 'Device:'}
            </label>
            <select
              className="form-select"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
            >
              {devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Camera #${i + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className={`btn btn-sm ${isFlipped ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIsFlipped(!isFlipped)}
              title={isZh ? '水平鏡像翻轉' : 'Flip Horizontal'}
            >
              <FlipHorizontal size={14} /> {isZh ? '鏡像' : 'Flip'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
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
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '420px',
            background: '#000',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-card)',
          }}
        >
          {errorMsg ? (
            <div style={{ textAlign: 'center', color: '#fda4af', padding: '1.5rem' }}>
              <AlertTriangle size={32} style={{ margin: '0 auto 0.5rem' }} />
              <p>{errorMsg}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: isFlipped ? 'scaleX(-1)' : 'none',
              }}
            />
          )}

          {isIntervalRunning && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(244, 63, 94, 0.85)',
                color: 'white',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                animation: 'pulse 1.5s infinite',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />
              {isZh ? `自動定時連拍中 (每 ${intervalSec}s)` : `Auto capturing every ${intervalSec}s`}
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </Modal>
  );
};
