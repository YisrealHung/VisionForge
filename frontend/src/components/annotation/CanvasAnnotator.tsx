import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AnnotationItem, CategoryItem } from '../../types';

interface CanvasAnnotatorProps {
  imageUrl: string;
  annotations: AnnotationItem[];
  categories: CategoryItem[];
  selectedCategoryId: number;
  onAnnotationsChange: (newAnnos: AnnotationItem[]) => void;
  selectedBoxId: string | null;
  onSelectBox: (id: string | null) => void;
}

export const CanvasAnnotator: React.FC<CanvasAnnotatorProps> = ({
  imageUrl,
  annotations,
  categories,
  selectedCategoryId,
  onAnnotationsChange,
  selectedBoxId,
  onSelectBox,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Load Image
  useEffect(() => {
    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
  }, [imageUrl]);

  // Convert Mouse Event Coordinates to Image Space Coordinates
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      if (!canvas || !img) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = img.naturalWidth / rect.width;
      const scaleY = img.naturalHeight / rect.height;

      const x = Math.max(0, Math.min(img.naturalWidth, (e.clientX - rect.left) * scaleX));
      const y = Math.max(0, Math.min(img.naturalHeight, (e.clientY - rect.top) * scaleY));

      return { x, y };
    },
    []
  );

  // Draw Canvas Loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match natural image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // 1. Draw original Image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const catColorMap: Record<number, string> = {};
    const catNameMap: Record<number, string> = {};
    categories.forEach((c) => {
      catColorMap[c.id] = c.color;
      catNameMap[c.id] = c.name;
    });

    // 2. Draw existing Annotations
    annotations.forEach((anno) => {
      const [bx, by, bw, bh] = anno.bbox;
      const isSelected = selectedBoxId === anno.id;
      const color = catColorMap[anno.category_id] || '#6366f1';
      const label = catNameMap[anno.category_id] || 'Target';

      // Box fill & stroke
      ctx.fillStyle = isSelected ? `${color}40` : `${color}20`;
      ctx.fillRect(bx, by, bw, bh);

      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeStyle = color;
      ctx.strokeRect(bx, by, bw, bh);

      // Label background & text
      const fontSize = Math.max(12, Math.min(18, Math.round(canvas.width / 45)));
      ctx.font = `600 ${fontSize}px sans-serif`;
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = color;
      ctx.fillRect(bx, Math.max(0, by - fontSize - 6), textWidth + 12, fontSize + 6);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, bx + 6, Math.max(fontSize, by - 4));
    });

    // 3. Draw Active Drawing Box
    if (isDrawing && currentBox) {
      const activeColor = catColorMap[selectedCategoryId] || '#6366f1';
      const { x, y, w, h } = currentBox;

      ctx.fillStyle = `${activeColor}30`;
      ctx.fillRect(x, y, w, h);

      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = activeColor;
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }

    // 4. Draw Crosshair cursor
    if (mousePos) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.setLineDash([2, 4]);

      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0);
      ctx.lineTo(mousePos.x, canvas.height);
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(canvas.width, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [annotations, categories, currentBox, imageLoaded, isDrawing, mousePos, selectedBoxId, selectedCategoryId]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    // Check if clicked inside an existing box
    let clickedBoxId: string | null = null;
    for (let i = annotations.length - 1; i >= 0; i--) {
      const [bx, by, bw, bh] = annotations[i].bbox;
      if (coords.x >= bx && coords.x <= bx + bw && coords.y >= by && coords.y <= by + bh) {
        clickedBoxId = annotations[i].id;
        break;
      }
    }

    if (clickedBoxId) {
      onSelectBox(clickedBoxId);
      return;
    }

    // Start drawing new box
    onSelectBox(null);
    setIsDrawing(true);
    setDrawStart(coords);
    setCurrentBox({ x: coords.x, y: coords.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setMousePos(coords);

    if (isDrawing && drawStart) {
      const x = Math.min(drawStart.x, coords.x);
      const y = Math.min(drawStart.y, coords.y);
      const w = Math.abs(coords.x - drawStart.x);
      const h = Math.abs(coords.y - drawStart.y);
      setCurrentBox({ x, y, w, h });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentBox) {
      if (currentBox.w > 10 && currentBox.h > 10) {
        const newAnno: AnnotationItem = {
          id: `anno_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          image_id: '',
          category_id: selectedCategoryId,
          bbox: [Math.round(currentBox.x), Math.round(currentBox.y), Math.round(currentBox.w), Math.round(currentBox.h)],
          area: Math.round(currentBox.w * currentBox.h),
        };
        onAnnotationsChange([...annotations, newAnno]);
        onSelectBox(newAnno.id);
      }
    }
    setIsDrawing(false);
    setDrawStart(null);
    setCurrentBox(null);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '520px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#070a10',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-card)',
      }}
    >
      {!imageLoaded ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>正在載入影像畫布...</div>
      ) : (
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setMousePos(null);
            if (isDrawing) handleMouseUp();
          }}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            cursor: 'crosshair',
          }}
        />
      )}
    </div>
  );
};
