import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Zap,
  Play,
  Square,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Sliders,
  AlertTriangle,
  Cpu,
  Video,
} from 'lucide-react';
import { RoiBox, TriggerRule, InferenceResponse, ImageItem, isAllClasses } from '../../types';
import { api } from '../../services/api';
import { describeCameraError, openCameraStream, stopStream, videoConstraints } from '../../services/camera';
import { Button } from '../common/Button';
import { useProject } from '../../context/ProjectContext';

const hasVideoFrame = (v: HTMLVideoElement) => v.readyState >= v.HAVE_CURRENT_DATA && v.videoWidth > 0;

interface CameraInferenceCanvasProps {
  projectId: string;
  architecture?: string;
  triggerRules: TriggerRule[];
  onTriggerEvent?: (event: any) => void;
}

export const CameraInferenceCanvas: React.FC<CameraInferenceCanvasProps> = ({
  projectId,
  architecture,
  triggerRules,
  onTriggerEvent,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [feedMode, setFeedMode] = useState<'webcam' | 'image'>('webcam');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [, setCustomImageSrc] = useState<string | null>(null);
  const [confThreshold, setConfThreshold] = useState<number>(40);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [prediction, setPrediction] = useState<InferenceResponse | null>(null);
  const [roi, setRoi] = useState<RoiBox | null>(null);
  const [isDrawingRoi, setIsDrawingRoi] = useState(false);
  const [roiStart, setRoiStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRoi, setCurrentRoi] = useState<RoiBox | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [datasetImages, setDatasetImages] = useState<ImageItem[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<boolean>(false);
  const loopGenRef = useRef<number>(0);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraSeqRef = useRef<number>(0);
  const fpsCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(Date.now());
  const customImgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [categoryColorMap, setCategoryColorMap] = useState<Record<string, string>>({});
  const { language } = useProject();
  const isZh = language === 'zh-TW';

  useEffect(() => {
    if (projectId) {
      api
        .getCategories(projectId)
        .then((cats) => {
          const cMap: Record<string, string> = {};
          cats.forEach((c) => {
            cMap[c.name] = c.color;
          });
          setCategoryColorMap(cMap);
        })
        .catch(() => {});

      api
        .listImages(projectId)
        .then((imgs) => {
          setDatasetImages(imgs);
        })
        .catch(() => {});
    }
  }, [projectId]);

  const enumerateDevices = useCallback(async () => {
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = devs.filter((d) => d.kind === 'videoinput');
      setDevices(videoDevs);
      if (videoDevs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevs[0].deviceId);
      }
    } catch (err) {
      console.warn('Failed to enumerate video devices:', err);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    enumerateDevices();
  }, [enumerateDevices]);

  const startCamera = async (deviceId?: string) => {
    stopCamera();
    const seq = cameraSeqRef.current;
    try {
      setErrorMsg('');
      const targetId = deviceId !== undefined ? deviceId : selectedDeviceId;
      const stream = await openCameraStream(videoConstraints(targetId || undefined, 1280, 720));
      if (seq !== cameraSeqRef.current) {
        stopStream(stream);
        return;
      }
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.muted = true;
        v.srcObject = stream;
        v.play().catch((playErr) => {
          if (seq !== cameraSeqRef.current) return;
          console.warn('Video play() rejected:', playErr);
          setErrorMsg(
            isZh
              ? '攝影機已連線但瀏覽器尚未開始播放畫面，請按「重試」'
              : 'Camera connected but playback did not start. Click Retry'
          );
        });
        const startedAt = Date.now();
        const waitForFrame = () => {
          if (seq !== cameraSeqRef.current) return;
          if (hasVideoFrame(v)) return;
          if (Date.now() - startedAt > 4000) {
            setErrorMsg(
              isZh
                ? `攝影機已連線但未收到影像（狀態 ${v.readyState}）。請關閉其他使用攝影機的分頁或程式後重試，或切換裝置`
                : `Camera connected but no frames arrived (state ${v.readyState}). Close other apps using the camera and retry`
            );
            return;
          }
          setTimeout(waitForFrame, 150);
        };
        waitForFrame();
      }
      enumerateDevices();
    } catch (err: any) {
      if (seq !== cameraSeqRef.current) return;
      console.warn('Webcam not accessible:', err);
      setErrorMsg(describeCameraError(err, isZh));
    }
  };

  const stopCamera = () => {
    cameraSeqRef.current += 1;
    if (streamRef.current) {
      stopStream(streamRef.current);
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (feedMode !== 'webcam' || isRunning) return;
    let raf = 0;
    const tick = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx && video && hasVideoFrame(video)) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [feedMode, isRunning]);

  useEffect(() => {
    if (feedMode === 'webcam') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setCustomImageSrc(src);
      const img = new Image();
      img.onload = () => {
        customImgRef.current = img;
        setFeedMode('image');
        if (!isRunning) {
          renderSingleImage(img);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (customImgRef.current && feedMode === 'image') {
      renderSingleImage(customImgRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [architecture]);

  const handleLoadDatasetSample = () => {
    if (datasetImages.length === 0) {
      alert(isZh ? '專案資料集中暫無圖片' : 'No images in the project dataset');
      return;
    }
    const randomImg = datasetImages[Math.floor(Math.random() * datasetImages.length)];
    const imgUrl = `/api/projects/${projectId}/images/${encodeURIComponent(randomImg.filename)}`;
    setCustomImageSrc(imgUrl);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      customImgRef.current = img;
      setFeedMode('image');
      if (!isRunning) {
        renderSingleImage(img);
      }
    };
    img.src = imgUrl;
  };

  const renderSingleImage = async (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth || 640;
    canvas.height = img.naturalHeight || 480;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const b64 = canvas.toDataURL('image/jpeg', 0.85);
    try {
      const res = await api.inferencePredict({
        model_id: projectId,
        architecture: architecture || undefined,
        image_base64: b64,
        roi: roi,
        trigger_rules: triggerRules,
      });

      setPrediction(res);
      setLatency(res.inference_time_ms);
      drawBoundingBoxes(ctx, canvas, res.predictions || [], res.trigger_matched);

      if (res.trigger_matched && res.triggered_events.length > 0 && onTriggerEvent) {
        res.triggered_events.forEach((ev) => onTriggerEvent(ev));
      }
    } catch (err) {
      console.error('Inference error:', err);
    }
  };

  const drawBoundingBoxes = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    predictions: any[],
    triggerMatched: boolean
  ) => {
    predictions.forEach((p) => {
      if (p.bbox && p.bbox.length === 4 && p.confidence >= confThreshold) {
        const [bx, by, bw, bh] = p.bbox;
        const px = bx * canvas.width;
        const py = by * canvas.height;
        const pw = bw * canvas.width;
        const ph = bh * canvas.height;

        const isAlert =
          triggerMatched &&
          triggerRules.some(
            (r) => r.enabled && (isAllClasses(r.class_name) || r.class_name === p.label) && p.confidence >= r.min_confidence
          );
        const catColor = categoryColorMap[p.label] || '#15803d';
        const boxColor = isAlert ? '#e5484d' : catColor;

        if (bw === 0 && bh === 0) {
          ctx.beginPath();
          ctx.arc(px, py, 7, 0, 2 * Math.PI);
          ctx.fillStyle = boxColor;
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          ctx.lineWidth = 2;
          ctx.strokeStyle = boxColor;
          ctx.beginPath();
          ctx.moveTo(px - 16, py);
          ctx.lineTo(px + 16, py);
          ctx.moveTo(px, py - 16);
          ctx.lineTo(px, py + 16);
          ctx.stroke();

          const labelText = p.label;
          ctx.font = '500 13px Allo, system-ui, sans-serif';
          const textMetrics = ctx.measureText(labelText);
          const badgeW = textMetrics.width + 14;
          const badgeH = 22;
          const badgeY = py + 14;
          ctx.fillStyle = boxColor;
          ctx.fillRect(px - badgeW / 2, badgeY, badgeW, badgeH);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(labelText, px - badgeW / 2 + 7, badgeY + 16);
        } else {
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = boxColor;
          ctx.strokeRect(px, py, pw, ph);

          ctx.fillStyle = `${boxColor}20`;
          ctx.fillRect(px, py, pw, ph);

          const len = Math.min(16, pw / 3, ph / 3);
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(px, py + len);
          ctx.lineTo(px, py);
          ctx.lineTo(px + len, py);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(px + pw, py + ph - len);
          ctx.lineTo(px + pw, py + ph);
          ctx.lineTo(px + pw - len, py + ph);
          ctx.stroke();

          ctx.fillStyle = boxColor;
          const labelText = `${p.label} ${p.confidence.toFixed(1)}%`;
          ctx.font = '500 13px Allo, system-ui, sans-serif';
          const textMetrics = ctx.measureText(labelText);
          const badgeW = textMetrics.width + 12;
          const badgeH = 22;
          const badgeY = Math.max(0, py - badgeH);
          ctx.fillRect(px, badgeY, badgeW, badgeH);

          ctx.fillStyle = '#ffffff';
          ctx.fillText(labelText, px + 6, badgeY + 16);
        }
      }
    });
  };

  const processFrame = async (gen: number) => {
    if (!loopRef.current || gen !== loopGenRef.current) return;

    const scheduleNext = (delayMs: number) => {
      if (loopRef.current && gen === loopGenRef.current) {
        loopTimerRef.current = setTimeout(() => processFrameRef.current(gen), delayMs);
      }
    };

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas?.getContext('2d') ?? null;
    if (!canvas || !ctx) {
      scheduleNext(250);
      return;
    }

    const webcamReady = feedMode === 'webcam' && !!video && hasVideoFrame(video);
    if (webcamReady && video) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else if (feedMode === 'image' && customImgRef.current) {
      const img = customImgRef.current;
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 480;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
      canvas.width = 640;
      canvas.height = 480;
      ctx.fillStyle = '#111113';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#9898a1';
      ctx.font = '14px Allo, system-ui, sans-serif';
      ctx.textAlign = 'center';
      const waiting = feedMode === 'webcam' && !!streamRef.current;
      ctx.fillText(
        waiting
          ? isZh
            ? '等待攝影機畫面…'
            : 'Waiting for camera frames…'
          : isZh
          ? '請開啟攝影機或載入影像樣本'
          : 'Start camera or load an image sample',
        320,
        240
      );
      ctx.textAlign = 'left';
      setPrediction(null);
      scheduleNext(300);
      return;
    }

    const b64 = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const res = await api.inferencePredict({
        model_id: projectId,
        architecture: architecture || undefined,
        image_base64: b64,
        roi: roi,
        trigger_rules: triggerRules,
      });

      if (!loopRef.current || gen !== loopGenRef.current) return;

      setPrediction(res);
      setLatency(res.inference_time_ms);

      if (res.predictions && res.predictions.length > 0) {
        drawBoundingBoxes(ctx, canvas, res.predictions, res.trigger_matched);
      }

      if (res.trigger_matched && res.triggered_events.length > 0 && onTriggerEvent) {
        res.triggered_events.forEach((ev) => onTriggerEvent(ev));
      }

      fpsCountRef.current += 1;
      const now = Date.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(fpsCountRef.current);
        fpsCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }
    } catch (err) {
      console.error('Frame inference error:', err);
    }

    scheduleNext(65);
  };
  const processFrameRef = useRef(processFrame);
  processFrameRef.current = processFrame;

  const stopLoop = () => {
    loopRef.current = false;
    loopGenRef.current += 1;
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopLoop();
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRunning = () => {
    if (isRunning) {
      stopLoop();
      setIsRunning(false);
    } else {
      stopLoop();
      loopRef.current = true;
      const gen = loopGenRef.current;
      setIsRunning(true);
      processFrameRef.current(gen);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDrawingRoi(true);
    setRoiStart({ x, y });
    setCurrentRoi({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRoi || !roiStart || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const curX = (e.clientX - rect.left) * scaleX;
    const curY = (e.clientY - rect.top) * scaleY;

    const x = Math.min(roiStart.x, curX);
    const y = Math.min(roiStart.y, curY);
    const width = Math.abs(curX - roiStart.x);
    const height = Math.abs(curY - roiStart.y);

    setCurrentRoi({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (isDrawingRoi && currentRoi && currentRoi.width > 20 && currentRoi.height > 20) {
      setRoi(currentRoi);
    }
    setIsDrawingRoi(false);
    setRoiStart(null);
    setCurrentRoi(null);
  };

  const clearRoi = () => {
    setRoi(null);
    setCurrentRoi(null);
  };

  const validPredictionsCount =
    prediction?.predictions?.filter((p) => p.bbox && p.confidence >= confThreshold).length || 0;

  const chipStyle: React.CSSProperties = {
    background: 'rgba(17, 17, 19, 0.84)',
    color: '#ededf0',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    fontVariantNumeric: 'tabular-nums',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        className="vf-reticle"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/10',
          maxHeight: '440px',
          background: 'var(--canvas-bg)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: prediction?.trigger_matched
            ? '1.5px solid var(--accent-rose)'
            : '1px solid var(--border-subtle)',
          transition: 'border-color var(--dur-fast) var(--ease-out)',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-hidden="true"
          style={{ position: 'absolute', left: 0, top: 0, width: '2px', height: '2px', opacity: 0.01, pointerEvents: 'none' }}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            cursor: 'crosshair',
          }}
        />

        {(roi || currentRoi) && (
          <div
            style={{
              position: 'absolute',
              left: `${((currentRoi || roi)!.x / (canvasRef.current?.width || 640)) * 100}%`,
              top: `${((currentRoi || roi)!.y / (canvasRef.current?.height || 480)) * 100}%`,
              width: `${((currentRoi || roi)!.width / (canvasRef.current?.width || 640)) * 100}%`,
              height: `${((currentRoi || roi)!.height / (canvasRef.current?.height || 480)) * 100}%`,
              border: '1.5px dashed var(--accent-primary)',
              background: 'rgba(29, 95, 214, 0.12)',
              pointerEvents: 'none',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'flex-start',
              padding: '4px 6px',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                color: '#ffffff',
                background: 'var(--accent-primary)',
                padding: '1px 6px',
                borderRadius: '3px',
                fontWeight: 500,
              }}
            >
              ROI {isZh ? '關注區域' : 'Region of Interest'}
            </span>
          </div>
        )}

        {/* Top Left Stats Overlay */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            pointerEvents: 'none',
          }}
        >
          <span style={{ ...chipStyle, color: isRunning ? '#4cc38a' : '#a1a1aa' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isRunning ? '#4cc38a' : '#71717a',
              }}
            />
            {isRunning ? `${fps} FPS` : isZh ? '已暫停' : 'Paused'}
          </span>

          <span style={chipStyle}>
            <Zap size={11} strokeWidth={1.5} /> {latency} ms
          </span>

          {prediction?.model_architecture && (
            <span style={chipStyle}>
              <Cpu size={11} strokeWidth={1.5} /> {prediction.model_architecture.toUpperCase().replace('_', '-')}
            </span>
          )}

          {feedMode === 'webcam' && (
            <span
              style={{
                ...chipStyle,
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={devices.find((d) => d.deviceId === selectedDeviceId)?.label || 'Camera'}
            >
              <Video size={11} strokeWidth={1.5} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {devices.find((d) => d.deviceId === selectedDeviceId)?.label || (isZh ? '攝影機' : 'Camera')}
              </span>
            </span>
          )}
        </div>

        {/* Top Right Live Prediction Badge */}
        {prediction && (() => {
          const topColor = categoryColorMap[prediction.top_label] || '#4cc38a';
          const isAlert = prediction.trigger_matched;
          const badgeBg = isAlert ? 'rgba(200, 30, 30, 0.92)' : 'rgba(17, 17, 19, 0.88)';
          const badgeBorder = isAlert ? '#e5484d' : 'rgba(255, 255, 255, 0.16)';

          return (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: badgeBg,
                color: '#ededf0',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${badgeBorder}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                pointerEvents: 'none',
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <div className="vf-num" style={{ fontSize: '11px', color: 'rgba(237, 237, 240, 0.78)' }}>
                  {isAlert
                    ? isZh
                      ? '觸發條件命中'
                      : 'Trigger hit'
                    : prediction.predictions?.some((p) => p.bbox)
                    ? isZh
                      ? `檢出 ${validPredictionsCount} 個目標 (≥${confThreshold}%)`
                      : `${validPredictionsCount} object(s) (≥${confThreshold}%)`
                    : isZh
                    ? '即時辨識結果'
                    : 'Live result'}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: topColor }} />
                  {prediction.top_label}
                </div>
              </div>
              <div className="vf-num" style={{ fontSize: '20px', fontWeight: 500, color: isAlert ? '#ffffff' : topColor }}>
                {prediction.top_confidence > 0 ? `${prediction.top_confidence.toFixed(1)}%` : '--'}
              </div>
            </div>
          );
        })()}

        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(17, 17, 19, 0.84)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            color: '#d4d4d8',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            pointerEvents: 'none',
            backdropFilter: 'blur(6px)',
            whiteSpace: 'nowrap',
          }}
        >
          {isZh
            ? '在畫面上拖曳可設定 ROI · 支援攝影機、上傳圖片或專案樣本'
            : 'Drag on canvas to set ROI · Supports camera, upload, or sample'}
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '10px 12px',
            background: 'var(--accent-rose-soft)',
            border: '1px solid rgba(200, 30, 30, 0.25)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent-rose)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={15} strokeWidth={1.5} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{errorMsg}</span>
          {feedMode === 'webcam' && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => startCamera()} style={{ flexShrink: 0 }}>
              {isZh ? '重試' : 'Retry'}
            </button>
          )}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--bg-surface-elevated)',
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant={isRunning ? 'danger' : 'primary'}
            size="sm"
            icon={isRunning ? <Square size={14} strokeWidth={1.5} /> : <Play size={14} strokeWidth={1.5} />}
            onClick={toggleRunning}
          >
            {isRunning ? (isZh ? '停止推論' : 'Stop inference') : isZh ? '啟動推論' : 'Start inference'}
          </Button>

          <Button
            variant={feedMode === 'webcam' ? 'secondary' : 'ghost'}
            size="sm"
            icon={<Camera size={14} strokeWidth={1.5} />}
            onClick={() => {
              if (feedMode === 'webcam') {
                if (!streamRef.current) startCamera();
              } else {
                setFeedMode('webcam');
              }
            }}
          >
            {isZh ? '攝影機' : 'Camera'}
          </Button>

          {feedMode === 'webcam' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '32px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0 8px',
              }}
            >
              <Video size={13} strokeWidth={1.5} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              <select
                value={selectedDeviceId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedDeviceId(newId);
                  startCamera(newId);
                }}
                style={{
                  fontSize: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  maxWidth: '180px',
                  textOverflow: 'ellipsis',
                  outline: 'none',
                }}
                title={isZh ? '選擇攝影機裝置' : 'Select camera device'}
              >
                {devices.length === 0 ? (
                  <option value="">{isZh ? '偵測相機中…' : 'Detecting cameras…'}</option>
                ) : (
                  devices.map((d, i) => (
                    <option
                      key={d.deviceId || i}
                      value={d.deviceId}
                      style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    >
                      {d.label || `${isZh ? '攝影機' : 'Camera'} #${i + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <Button
            variant={feedMode === 'image' ? 'secondary' : 'ghost'}
            size="sm"
            icon={<Upload size={14} strokeWidth={1.5} />}
            onClick={() => fileInputRef.current?.click()}
          >
            {isZh ? '上傳圖片' : 'Upload image'}
          </Button>

          {datasetImages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={<ImageIcon size={14} strokeWidth={1.5} />}
              onClick={handleLoadDatasetSample}
            >
              {isZh ? '載入樣本' : 'Load sample'}
            </Button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={14} strokeWidth={1.5} color="var(--text-secondary)" />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {isZh ? '信心度門檻' : 'Confidence'}
          </span>
          <input
            type="range"
            min={1}
            max={90}
            value={confThreshold}
            onChange={(e) => setConfThreshold(Number(e.target.value))}
            style={{ width: '108px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
          />
          <span className="badge badge-indigo vf-num" style={{ minWidth: '42px', justifyContent: 'center' }}>
            {confThreshold}%
          </span>
        </div>

        {roi && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="vf-num" style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 500 }}>
              ROI {isZh ? `已啟用 (${Math.round(roi.width)}×${Math.round(roi.height)} px)` : `Active (${Math.round(roi.width)}×${Math.round(roi.height)} px)`}
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearRoi} style={{ height: '28px', padding: '0 8px', fontSize: '12px' }}>
              <RotateCcw size={12} strokeWidth={1.5} /> {isZh ? '清除 ROI' : 'Clear ROI'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
