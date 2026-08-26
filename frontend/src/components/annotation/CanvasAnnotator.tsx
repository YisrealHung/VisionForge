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

type HandleType = 'tl' | 'tr' | 'bl' | 'br' | 'center';
type ActionMode = 'idle' | 'drawing' | 'moving' | 'resizing';

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
  const [actionMode, setActionMode] = useState<ActionMode>('idle');
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialBox, setInitialBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [currentDrawBox, setCurrentDrawBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<HandleType | null>(null);

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

  // Convert client mouse event coordinates to Image Space coordinates
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number; scale: number } | null => {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      if (!canvas || !img) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = img.naturalWidth / rect.width;
      const scaleY = img.naturalHeight / rect.height;
      const scale = (scaleX + scaleY) / 2;

      const x = Math.max(0, Math.min(img.naturalWidth, (e.clientX - rect.left) * scaleX));
      const y = Math.max(0, Math.min(img.naturalHeight, (e.clientY - rect.top) * scaleY));

      return { x, y, scale };
    },
    []
  );

  // Hit-test a specific box's 4 corner handles and center body
  const hitTestBox = useCallback(
    (coords: { x: number; y: number; scale: number }, bbox: [number, number, number, number]): HandleType | null => {
      const [bx, by, bw, bh] = bbox;
      const handleRadius = Math.max(12, 14 * coords.scale); // screen size adapted

      // 1. Check 4 corner handles
      const corners: { type: HandleType; x: number; y: number }[] = [
        { type: 'tl', x: bx, y: by },
        { type: 'tr', x: bx + bw, y: by },
        { type: 'bl', x: bx, y: by + bh },
        { type: 'br', x: bx + bw, y: by + bh },
      ];

      for (const corner of corners) {
        const dist = Math.hypot(coords.x - corner.x, coords.y - corner.y);
        if (dist <= handleRadius) {
          return corner.type;
        }
      }

      // 2. Check inside bbox body (center / move area)
      if (coords.x >= bx && coords.x <= bx + bw && coords.y >= by && coords.y <= by + bh) {
        return 'center';
      }

      return null;
    },
    []
  );

  // Keyboard navigation & delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedBoxId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Prevent backspace from navigating back
        e.preventDefault();
        onAnnotationsChange(annotations.filter((a) => a.id !== selectedBoxId));
        onSelectBox(null);
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        const img = imageRef.current;
        if (!img) return;

        const updated = annotations.map((anno) => {
          if (anno.id !== selectedBoxId) return anno;
          let [x, y, w, h] = anno.bbox;
          if (e.key === 'ArrowUp') y = Math.max(0, y - delta);
          if (e.key === 'ArrowDown') y = Math.min(img.naturalHeight - h, y + delta);
          if (e.key === 'ArrowLeft') x = Math.max(0, x - delta);
          if (e.key === 'ArrowRight') x = Math.min(img.naturalWidth - w, x + delta);
          return { ...anno, bbox: [x, y, w, h] as [number, number, number, number] };
        });
        onAnnotationsChange(updated);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [annotations, onAnnotationsChange, onSelectBox, selectedBoxId]);

  // Main Canvas Rendering Routine
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match natural image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // 1. Draw Image Background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const catColorMap: Record<number, string> = {};
    const catNameMap: Record<number, string> = {};
    categories.forEach((c) => {
      catColorMap[c.id] = c.color;
      catNameMap[c.id] = c.name;
    });

    const scaleFactor = Math.max(1, canvas.width / 900);
    const handleSize = Math.max(9, Math.round(9 * scaleFactor));
    const handleHalf = handleSize / 2;

    // 2. Draw Existing Annotations
    annotations.forEach((anno) => {
      const [bx, by, bw, bh] = anno.bbox;
      const isSelected = selectedBoxId === anno.id;
      const isHovered = hoveredBoxId === anno.id && !isSelected;
      const color = catColorMap[anno.category_id] || '#6366f1';
      const label = catNameMap[anno.category_id] || 'Target';

      // Semi-transparent fill
      ctx.fillStyle = isSelected ? `${color}45` : (isHovered ? `${color}25` : `${color}15`);
      ctx.fillRect(bx, by, bw, bh);

      // Border outline
      ctx.lineWidth = isSelected ? Math.max(3, 3 * scaleFactor) : (isHovered ? 2.5 : 2);
      ctx.strokeStyle = color;
      if (isHovered && !isSelected) {
        ctx.setLineDash([6, 6]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.strokeRect(bx, by, bw, bh);
      ctx.setLineDash([]);

      // Label background pill & text
      const fontSize = Math.max(12, Math.min(22, Math.round(14 * scaleFactor)));
      ctx.font = `bold ${fontSize}px sans-serif`;
      const textMetrics = ctx.measureText(label);
      const textWidth = textMetrics.width;
      const badgeH = fontSize + 8;
      const badgeW = textWidth + 14;
      const badgeY = Math.max(0, by - badgeH);

      ctx.fillStyle = color;
      ctx.fillRect(bx, badgeY, badgeW, badgeH);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, bx + 7, badgeY + fontSize + 1);

      // 3. Draw Selected BBox Handles & Center Indicator
      if (isSelected) {
        const corners = [
          { type: 'tl', x: bx, y: by },
          { type: 'tr', x: bx + bw, y: by },
          { type: 'bl', x: bx, y: by + bh },
          { type: 'br', x: bx + bw, y: by + bh },
        ];

        // Draw 4 Corner Handles
        corners.forEach((c) => {
          const isTargetHandle = (activeHandle === c.type) || (hoveredHandle === c.type);
          const curSize = isTargetHandle ? handleSize * 1.3 : handleSize;
          const curHalf = curSize / 2;

          // Outer shadow glow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 6;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(c.x - curHalf, c.y - curHalf, curSize, curSize);
          ctx.shadowBlur = 0;

          // Colored border
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = isTargetHandle ? '#ffffff' : color;
          ctx.strokeRect(c.x - curHalf, c.y - curHalf, curSize, curSize);

          // Center accent dot
          ctx.fillStyle = color;
          ctx.fillRect(c.x - curHalf + 2, c.y - curHalf + 2, curSize - 4, curSize - 4);
        });

        // Center Move Anchor Icon
        const centerX = bx + bw / 2;
        const centerY = by + bh / 2;
        const centerRadius = Math.max(10, 11 * scaleFactor);

        ctx.beginPath();
        ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = activeHandle === 'center' || hoveredHandle === 'center' ? color : 'rgba(15, 23, 42, 0.8)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Crosshair arrows inside center move anchor
        const arrLen = centerRadius * 0.6;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Horizontal
        ctx.moveTo(centerX - arrLen, centerY); ctx.lineTo(centerX + arrLen, centerY);
        // Vertical
        ctx.moveTo(centerX, centerY - arrLen); ctx.lineTo(centerX, centerY + arrLen);
        ctx.stroke();

        // Dimension Badge [W × H]
        const dimText = `${Math.round(bw)} × ${Math.round(bh)}`;
        const dimFontSize = Math.max(11, Math.round(12 * scaleFactor));
        ctx.font = `bold ${dimFontSize}px sans-serif`;
        const dimW = ctx.measureText(dimText).width + 12;
        const dimH = dimFontSize + 6;
        const dimY = Math.min(canvas.height - dimH, by + bh + 4);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(bx + bw - dimW, dimY, dimW, dimH);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + bw - dimW, dimY, dimW, dimH);

        ctx.fillStyle = '#38bdf8';
        ctx.fillText(dimText, bx + bw - dimW + 6, dimY + dimFontSize);
      }
    });

    // 4. Draw Active Drawing Box (when creating new bbox)
    if (actionMode === 'drawing' && currentDrawBox) {
      const activeColor = catColorMap[selectedCategoryId] || '#6366f1';
      const { x, y, w, h } = currentDrawBox;

      ctx.fillStyle = `${activeColor}30`;
      ctx.fillRect(x, y, w, h);

      ctx.lineWidth = Math.max(2, 2 * scaleFactor);
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = activeColor;
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      // Realtime Dimension tooltip
      const dimText = `${Math.round(w)} × ${Math.round(h)}`;
      ctx.font = `bold 12px sans-serif`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(x + w + 6, y + h + 6, ctx.measureText(dimText).width + 10, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(dimText, x + w + 11, y + h + 20);
    }

    // 5. Crosshair Cursor Guides
    if (mousePos && actionMode !== 'moving' && actionMode !== 'resizing') {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.setLineDash([3, 4]);

      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0);
      ctx.lineTo(mousePos.x, canvas.height);
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(canvas.width, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [
    actionMode,
    activeHandle,
    annotations,
    categories,
    currentDrawBox,
    hoveredBoxId,
    hoveredHandle,
    imageLoaded,
    mousePos,
    selectedBoxId,
    selectedCategoryId,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Compute CSS Cursor based on hover and active state
  const getCursor = (): string => {
    if (actionMode === 'moving') return 'grabbing';
    if (actionMode === 'resizing') {
      if (activeHandle === 'tl' || activeHandle === 'br') return 'nwse-resize';
      if (activeHandle === 'tr' || activeHandle === 'bl') return 'nesw-resize';
    }
    if (hoveredHandle === 'tl' || hoveredHandle === 'br') return 'nwse-resize';
    if (hoveredHandle === 'tr' || hoveredHandle === 'bl') return 'nesw-resize';
    if (hoveredHandle === 'center') return 'grab';
    if (hoveredBoxId) return 'pointer';
    return 'crosshair';
  };

  // Mouse Down Event Handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    // 1. If we have a selected box, check if clicked on one of its 4 corner handles or center
    if (selectedBoxId) {
      const selectedAnno = annotations.find((a) => a.id === selectedBoxId);
      if (selectedAnno) {
        const hit = hitTestBox(coords, selectedAnno.bbox);
        if (hit === 'center') {
          // Start Moving selected box
          setActionMode('moving');
          setActiveHandle('center');
          setDragStart({ x: coords.x, y: coords.y });
          const [bx, by, bw, bh] = selectedAnno.bbox;
          setInitialBox({ x: bx, y: by, w: bw, h: bh });
          return;
        } else if (hit) {
          // Start Resizing selected box
          setActionMode('resizing');
          setActiveHandle(hit);
          setDragStart({ x: coords.x, y: coords.y });
          const [bx, by, bw, bh] = selectedAnno.bbox;
          setInitialBox({ x: bx, y: by, w: bw, h: bh });
          return;
        }
      }
    }

    // 2. Check if clicked inside any other box
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
      const anno = annotations.find((a) => a.id === clickedBoxId);
      if (anno) {
        // Immediately allow moving on first click
        setActionMode('moving');
        setActiveHandle('center');
        setDragStart({ x: coords.x, y: coords.y });
        const [bx, by, bw, bh] = anno.bbox;
        setInitialBox({ x: bx, y: by, w: bw, h: bh });
      }
      return;
    }

    // 3. Clicked on empty canvas -> Clear selection & start drawing new box
    onSelectBox(null);
    setActionMode('drawing');
    setDragStart({ x: coords.x, y: coords.y });
    setCurrentDrawBox({ x: coords.x, y: coords.y, w: 0, h: 0 });
  };

  // Mouse Move Event Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setMousePos({ x: coords.x, y: coords.y });

    const img = imageRef.current;
    if (!img) return;

    // A. Handling BBox Drag/Move
    if (actionMode === 'moving' && dragStart && initialBox && selectedBoxId) {
      const dx = coords.x - dragStart.x;
      const dy = coords.y - dragStart.y;

      const newX = Math.max(0, Math.min(img.naturalWidth - initialBox.w, initialBox.x + dx));
      const newY = Math.max(0, Math.min(img.naturalHeight - initialBox.h, initialBox.y + dy));

      const updated = annotations.map((anno) => {
        if (anno.id !== selectedBoxId) return anno;
        return {
          ...anno,
          bbox: [Math.round(newX), Math.round(newY), Math.round(initialBox.w), Math.round(initialBox.h)] as [
            number,
            number,
            number,
            number
          ],
        };
      });
      onAnnotationsChange(updated);
      return;
    }

    // B. Handling BBox 4-Corner Resizing
    if (actionMode === 'resizing' && activeHandle && initialBox && selectedBoxId) {
      let { x, y, w, h } = initialBox;
      const minSize = 6;

      if (activeHandle === 'br') {
        // Dragging Bottom-Right corner
        const newW = Math.max(minSize, Math.min(img.naturalWidth - x, coords.x - x));
        const newH = Math.max(minSize, Math.min(img.naturalHeight - y, coords.y - y));
        w = newW;
        h = newH;
      } else if (activeHandle === 'tl') {
        // Dragging Top-Left corner (Anchor is Bottom-Right)
        const anchorX = initialBox.x + initialBox.w;
        const anchorY = initialBox.y + initialBox.h;
        const newX = Math.max(0, Math.min(anchorX - minSize, coords.x));
        const newY = Math.max(0, Math.min(anchorY - minSize, coords.y));
        x = newX;
        y = newY;
        w = anchorX - newX;
        h = anchorY - newY;
      } else if (activeHandle === 'tr') {
        // Dragging Top-Right corner (Anchor is Bottom-Left)
        const anchorX = initialBox.x;
        const anchorY = initialBox.y + initialBox.h;
        const newY = Math.max(0, Math.min(anchorY - minSize, coords.y));
        const newW = Math.max(minSize, Math.min(img.naturalWidth - anchorX, coords.x - anchorX));
        y = newY;
        w = newW;
        h = anchorY - newY;
      } else if (activeHandle === 'bl') {
        // Dragging Bottom-Left corner (Anchor is Top-Right)
        const anchorX = initialBox.x + initialBox.w;
        const anchorY = initialBox.y;
        const newX = Math.max(0, Math.min(anchorX - minSize, coords.x));
        const newH = Math.max(minSize, Math.min(img.naturalHeight - anchorY, coords.y - anchorY));
        x = newX;
        w = anchorX - newX;
        h = newH;
      }

      const updated = annotations.map((anno) => {
        if (anno.id !== selectedBoxId) return anno;
        return {
          ...anno,
          bbox: [Math.round(x), Math.round(y), Math.round(w), Math.round(h)] as [number, number, number, number],
          area: Math.round(w * h),
        };
      });
      onAnnotationsChange(updated);
      return;
    }

    // C. Handling New BBox Drawing
    if (actionMode === 'drawing' && dragStart) {
      const x = Math.min(dragStart.x, coords.x);
      const y = Math.min(dragStart.y, coords.y);
      const w = Math.abs(coords.x - dragStart.x);
      const h = Math.abs(coords.y - dragStart.y);
      setCurrentDrawBox({ x, y, w, h });
      return;
    }

    // D. Hover State Inspection (when idle)
    let foundHandle: HandleType | null = null;
    let foundBoxId: string | null = null;

    if (selectedBoxId) {
      const selectedAnno = annotations.find((a) => a.id === selectedBoxId);
      if (selectedAnno) {
        foundHandle = hitTestBox(coords, selectedAnno.bbox);
      }
    }

    if (!foundHandle) {
      for (let i = annotations.length - 1; i >= 0; i--) {
        const [bx, by, bw, bh] = annotations[i].bbox;
        if (coords.x >= bx && coords.x <= bx + bw && coords.y >= by && coords.y <= by + bh) {
          foundBoxId = annotations[i].id;
          break;
        }
      }
    }

    setHoveredHandle(foundHandle);
    setHoveredBoxId(foundBoxId);
  };

  // Mouse Up Event Handler
  const handleMouseUp = () => {
    if (actionMode === 'drawing' && currentDrawBox) {
      if (currentDrawBox.w >= 8 && currentDrawBox.h >= 8) {
        const newAnno: AnnotationItem = {
          id: `anno_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          image_id: '',
          category_id: selectedCategoryId,
          bbox: [
            Math.round(currentDrawBox.x),
            Math.round(currentDrawBox.y),
            Math.round(currentDrawBox.w),
            Math.round(currentDrawBox.h),
          ],
          area: Math.round(currentDrawBox.w * currentDrawBox.h),
        };
        onAnnotationsChange([...annotations, newAnno]);
        onSelectBox(newAnno.id);
      }
    }

    setActionMode('idle');
    setActiveHandle(null);
    setDragStart(null);
    setInitialBox(null);
    setCurrentDrawBox(null);
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
        userSelect: 'none',
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
            setHoveredHandle(null);
            setHoveredBoxId(null);
            if (actionMode !== 'idle') handleMouseUp();
          }}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            cursor: getCursor(),
            display: 'block',
          }}
        />
      )}

      {/* Floating Bottom Interaction Tips */}
      {imageLoaded && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            padding: '4px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.72rem',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            letterSpacing: '0.02em',
          }}
        >
          <span>🖱️ 拖曳空白處繪製框</span>
          <span>📐 拖曳四角把手縮放</span>
          <span>✋ 拖曳中心移動位置</span>
          <span>⌨️ Delete 刪除</span>
        </div>
      )}
    </div>
  );
};
