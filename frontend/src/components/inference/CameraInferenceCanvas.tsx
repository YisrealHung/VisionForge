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
  Cpu
} from 'lucide-react';
import { RoiBox, TriggerRule, InferenceResponse, ImageItem } from '../../types';
import { api } from '../../services/api';
import { Button } from '../common/Button';

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
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);
  const [confThreshold, setConfThreshold] = useState<number>(40); // 1% ~ 100% (Default 40%)
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
  const fpsCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(Date.now());
  const customImgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [categoryColorMap, setCategoryColorMap] = useState<Record<string, string>>({});

  // Load project categories & dataset images
  useEffect(() => {
    if (projectId) {
      api.getCategories(projectId).then((cats) => {
        const cMap: Record<string, string> = {};
        cats.forEach((c) => {
          cMap[c.name] = c.color;
        });
        setCategoryColorMap(cMap);
      }).catch(() => { });

      api.listImages(projectId).then((imgs) => {
        setDatasetImages(imgs);
      }).catch(() => { });
    }
  }, [projectId]);

  // Start Camera Stream
  const startCamera = async () => {
    try {
      setErrorMsg('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Webcam not accessible:', err);
      setErrorMsg('無法開啟攝影機（可點擊「載入專案樣本」或「上傳圖片」進行推論）');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (feedMode === 'webcam') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [feedMode]);

  // Handle custom image upload
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
          // Trigger a single frame render
          renderSingleImage(img);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Re-run inference on static image when selected architecture changes
  useEffect(() => {
    if (customImgRef.current && feedMode === 'image') {
      renderSingleImage(customImgRef.current);
    }
  }, [architecture]);

  // Load sample image from dataset
  const handleLoadDatasetSample = () => {
    if (datasetImages.length === 0) {
      alert('專案資料集中暫無圖片');
      return;
    }
    const randomImg = datasetImages[Math.floor(Math.random() * datasetImages.length)];
    const imgUrl = `/api/projects/${projectId}/images/${randomImg.filename}`;
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

  // Render single static image with inference
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

      // Draw bounding boxes based on confThreshold
      drawBoundingBoxes(ctx, canvas, res.predictions || [], res.trigger_matched);

      if (res.trigger_matched && res.triggered_events.length > 0 && onTriggerEvent) {
        res.triggered_events.forEach((ev) => onTriggerEvent(ev));
      }
    } catch (err) {
      console.error('Inference error:', err);
    }
  };

  const drawBoundingBoxes = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, predictions: any[], triggerMatched: boolean) => {
    predictions.forEach((p) => {
      if (p.bbox && p.bbox.length === 4 && p.confidence >= confThreshold) {
        const [bx, by, bw, bh] = p.bbox;
        const px = bx * canvas.width;
        const py = by * canvas.height;
        const pw = bw * canvas.width;
        const ph = bh * canvas.height;

        const isAlert = triggerMatched && triggerRules.some(
          (r) => r.enabled && (r.class_name === '全部類別' || r.class_name === p.label) && p.confidence >= r.min_confidence
        );
        const catColor = categoryColorMap[p.label] || '#10b981';
        const boxColor = isAlert ? '#f43f5e' : catColor;

        // Check if it's a point (Regression) instead of a Bounding Box
        if (bw === 0 && bh === 0) {
          // Draw a point / crosshair
          ctx.beginPath();
          ctx.arc(px, py, 7, 0, 2 * Math.PI);
          ctx.fillStyle = boxColor;
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          // Crosshair lines
          ctx.lineWidth = 2;
          ctx.strokeStyle = boxColor;
          ctx.beginPath();
          ctx.moveTo(px - 16, py); ctx.lineTo(px + 16, py);
          ctx.moveTo(px, py - 16); ctx.lineTo(px, py + 16);
          ctx.stroke();

          // Badge text for point
          const labelText = p.label;
          ctx.font = 'bold 13px Inter, system-ui, sans-serif';
          const textMetrics = ctx.measureText(labelText);
          const badgeW = textMetrics.width + 14;
          const badgeH = 22;
          const badgeY = py + 14;
          ctx.fillStyle = boxColor;
          ctx.fillRect(px - badgeW / 2, badgeY, badgeW, badgeH);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(labelText, px - badgeW / 2 + 7, badgeY + 16);
        } else {
          // Standard Bounding box stroke
          ctx.lineWidth = 3;
          ctx.strokeStyle = boxColor;
          ctx.strokeRect(px, py, pw, ph);

          // Fill semi-transparent tint
          ctx.fillStyle = `${boxColor}20`;
          ctx.fillRect(px, py, pw, ph);

          // Corner markers
          const len = Math.min(16, pw / 3, ph / 3);
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#ffffff';
          // Top-left
          ctx.beginPath(); ctx.moveTo(px, py + len); ctx.lineTo(px, py); ctx.lineTo(px + len, py); ctx.stroke();
          // Bottom-right
          ctx.beginPath(); ctx.moveTo(px + pw, py + ph - len); ctx.lineTo(px + pw, py + ph); ctx.lineTo(px + pw - len, py + ph); ctx.stroke();

          // Badge background
          ctx.fillStyle = boxColor;
          const labelText = `${p.label} ${p.confidence.toFixed(1)}%`;
          ctx.font = 'bold 13px Inter, system-ui, sans-serif';
          const textMetrics = ctx.measureText(labelText);
          const badgeW = textMetrics.width + 12;
          const badgeH = 22;
          const badgeY = Math.max(0, py - badgeH);
          ctx.fillRect(px, badgeY, badgeW, badgeH);

          // Badge text
          ctx.fillStyle = '#ffffff';
          ctx.fillText(labelText, px + 6, badgeY + 16);
        }
      }
    });
  };

  // Continuous Inference Frame Loop
  const processFrame = useCallback(async () => {
    if (!loopRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (feedMode === 'webcam' && video && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else if (feedMode === 'image' && customImgRef.current) {
      const img = customImgRef.current;
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 480;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
      // Standby / No Feed Display
      canvas.width = 640;
      canvas.height = 480;
      ctx.fillStyle = '#070a12';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('攝影機尚未開啟 · 請點擊「攝影機」或「載入專案樣本」', 320, 240);
      ctx.textAlign = 'left';
    }

    // Capture Base64 & send inference
    const b64 = canvas.toDataURL('image/jpeg', 0.8);

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

      // Draw bounding boxes filtered by user-selected confThreshold
      if (res.predictions && res.predictions.length > 0) {
        drawBoundingBoxes(ctx, canvas, res.predictions, res.trigger_matched);
      }

      if (res.trigger_matched && res.triggered_events.length > 0 && onTriggerEvent) {
        res.triggered_events.forEach((ev) => onTriggerEvent(ev));
      }

      // Calculate FPS
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

    if (loopRef.current) {
      setTimeout(processFrame, 65);
    }
  }, [projectId, roi, triggerRules, feedMode, confThreshold, onTriggerEvent]);

  const toggleRunning = () => {
    if (isRunning) {
      loopRef.current = false;
      setIsRunning(false);
    } else {
      loopRef.current = true;
      setIsRunning(true);
      processFrame();
    }
  };

  // Mouse ROI Drawing Handlers
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

  const validPredictionsCount = prediction?.predictions?.filter(
    (p) => p.bbox && p.confidence >= confThreshold
  ).length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Canvas Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/10',
          maxHeight: '440px',
          background: '#070a12',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: prediction?.trigger_matched
            ? '2px solid #f43f5e'
            : '1px solid var(--border-subtle)',
          boxShadow: prediction?.trigger_matched
            ? '0 0 20px rgba(244, 63, 94, 0.4)'
            : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Hidden video element for webcam decoding */}
        <video ref={videoRef} style={{ display: 'none' }} playsInline muted />

        {/* Hidden File Input for Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Main Rendering Canvas */}
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

        {/* ROI Overlay Box */}
        {(roi || currentRoi) && (
          <div
            style={{
              position: 'absolute',
              left: `${((currentRoi || roi)!.x / (canvasRef.current?.width || 640)) * 100}%`,
              top: `${((currentRoi || roi)!.y / (canvasRef.current?.height || 480)) * 100}%`,
              width: `${((currentRoi || roi)!.width / (canvasRef.current?.width || 640)) * 100}%`,
              height: `${((currentRoi || roi)!.height / (canvasRef.current?.height || 480)) * 100}%`,
              border: '2px dashed #06b6d4',
              background: 'rgba(6, 182, 212, 0.1)',
              pointerEvents: 'none',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'flex-start',
              padding: '4px 6px',
            }}
          >
            <span
              style={{
                fontSize: '0.65rem',
                color: '#fff',
                background: '#06b6d4',
                padding: '1px 5px',
                borderRadius: '3px',
                fontWeight: 700,
              }}
            >
              ROI 關注區域
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
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              background: 'rgba(0, 0, 0, 0.75)',
              color: isRunning ? '#10b981' : '#94a3b8',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isRunning ? '#10b981' : '#64748b',
              }}
            />
            {isRunning ? `${fps} FPS` : '已暫停'}
          </span>

          <span
            style={{
              background: 'rgba(0, 0, 0, 0.75)',
              color: '#06b6d4',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Zap size={11} /> {latency} ms
          </span>

          {prediction?.model_architecture && (
            <span
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#a5b4fc',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(165, 180, 252, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Cpu size={11} /> {prediction.model_architecture.toUpperCase().replace('_', '-')}
            </span>
          )}
        </div>

        {/* Top Right Live Prediction Badge */}
        {prediction && (() => {
          const topColor = categoryColorMap[prediction.top_label] || '#10b981';
          const isAlert = prediction.trigger_matched;
          const badgeBg = isAlert
            ? 'rgba(244, 63, 94, 0.92)'
            : 'rgba(15, 23, 42, 0.88)';
          const badgeBorder = isAlert ? '#f43f5e' : topColor;
          const glowColor = isAlert ? '#f43f5e' : topColor;

          return (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: badgeBg,
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                backdropFilter: 'blur(8px)',
                border: `1.5px solid ${badgeBorder}`,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: `0 4px 16px ${glowColor}40`,
                pointerEvents: 'none',
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                  {isAlert
                    ? '🚨 觸發條件命中'
                    : (prediction.predictions?.some((p) => p.bbox)
                      ? `🎯 檢出 ${validPredictionsCount} 個目標 (≥${confThreshold}%)`
                      : '即時辨識結果')}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: topColor,
                      boxShadow: `0 0 8px ${topColor}`,
                    }}
                  />
                  {prediction.top_label}
                </div>
              </div>
              <div
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: isAlert ? '#fff' : topColor,
                }}
              >
                {prediction.top_confidence > 0 ? `${prediction.top_confidence.toFixed(1)}%` : '--'}
              </div>
            </div>
          );
        })()}

        {/* Bottom Hint Banner */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.65)',
            color: 'var(--text-muted)',
            padding: '3px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.7rem',
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)',
          }}
        >
          💡 在畫面上拖曳可設定 ROI 關注區域 · 支援攝影機 / 上傳圖片 / 載入專案樣本
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '0.6rem 0.85rem',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#fda4af',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertTriangle size={14} /> {errorMsg}
        </div>
      )}

      {/* Control Actions & Confidence Slider Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'var(--bg-surface-elevated)',
          padding: '0.6rem 1rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button
            variant={isRunning ? 'danger' : 'primary'}
            size="sm"
            icon={isRunning ? <Square size={14} /> : <Play size={14} />}
            onClick={toggleRunning}
          >
            {isRunning ? '停止即時推論' : '啟動即時推論'}
          </Button>

          <Button
            variant={feedMode === 'webcam' ? 'secondary' : 'ghost'}
            size="sm"
            icon={<Camera size={14} />}
            onClick={() => setFeedMode('webcam')}
          >
            攝影機
          </Button>

          <Button
            variant={feedMode === 'image' ? 'secondary' : 'ghost'}
            size="sm"
            icon={<Upload size={14} />}
            onClick={() => fileInputRef.current?.click()}
          >
            上傳圖片
          </Button>

          {datasetImages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={<ImageIcon size={14} />}
              onClick={handleLoadDatasetSample}
            >
              載入專案樣本
            </Button>
          )}
        </div>

        {/* Interactive Confidence Threshold Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={14} color="#818cf8" />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            信心度門檻:
          </span>
          <input
            type="range"
            min={1}
            max={90}
            value={confThreshold}
            onChange={(e) => setConfThreshold(Number(e.target.value))}
            style={{ width: '110px', accentColor: '#818cf8', cursor: 'pointer' }}
          />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#818cf8',
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '1px 6px',
              borderRadius: '3px',
              minWidth: '34px',
              textAlign: 'center',
            }}
          >
            {confThreshold}%
          </span>
        </div>

        {roi && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 600 }}>
              ROI 已啟用 ({Math.round(roi.width)}×{Math.round(roi.height)} px)
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={clearRoi}
              style={{ fontSize: '0.75rem', padding: '2px 8px', color: 'var(--text-muted)' }}
            >
              <RotateCcw size={12} /> 清除 ROI
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
