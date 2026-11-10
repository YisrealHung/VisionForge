import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { AnnotationItem, CategoryItem } from '../../types';
import { useProject } from '../../context/ProjectContext';

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
type ActionMode = 'idle' | 'drawing' | 'moving' | 'resizing' | 'panning';

/**
 * View transform: a point (ix, iy) in image pixels is drawn at screen CSS pixel
 * (ix * scale + offsetX, iy * scale + offsetY) inside the canvas element.
 */
interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const MAX_SCALE = 20;
const FIT_PADDING = 16; // css px around the fitted image
const WHEEL_ZOOM_SPEED = 0.0015;

export const CanvasAnnotator: React.FC<CanvasAnnotatorProps> = ({
  imageUrl,
  annotations,
  categories,
  selectedCategoryId,
  onAnnotationsChange,
  selectedBoxId,
  onSelectBox,
}) => {
  const { language } = useProject();
  const isZh = language === 'zh-TW';
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [viewport, setViewport] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [view, setView] = useState<ViewState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  // Once the user zooms or pans, container resizes keep their view instead of re-fitting.
  const userAdjustedRef = useRef(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  // Space-to-pan only applies while the pointer is over the canvas.
  const pointerInsideRef = useRef(false);

  const [actionMode, setActionMode] = useState<ActionMode>('idle');
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialBox, setInitialBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [currentDrawBox, setCurrentDrawBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<HandleType | null>(null);

  // ---------- View helpers ----------
  const fitView = useCallback((vw: number, vh: number): ViewState | null => {
    const img = imageRef.current;
    if (!img || vw <= 0 || vh <= 0) return null;
    const scale = Math.min((vw - FIT_PADDING * 2) / img.naturalWidth, (vh - FIT_PADDING * 2) / img.naturalHeight);
    const s = Math.max(0.01, scale);
    return { scale: s, offsetX: (vw - img.naturalWidth * s) / 2, offsetY: (vh - img.naturalHeight * s) / 2 };
  }, []);

  const minScale = useCallback(() => {
    const fit = fitView(viewport.w, viewport.h);
    return fit ? Math.min(fit.scale, 1) * 0.5 : 0.05;
  }, [fitView, viewport.h, viewport.w]);

  /** Zoom to `nextScale`, keeping the screen point (sx, sy) fixed over the same image point. */
  const zoomAt = useCallback(
    (sx: number, sy: number, nextScale: number) => {
      const v = viewRef.current;
      const s = Math.max(minScale(), Math.min(MAX_SCALE, nextScale));
      const ix = (sx - v.offsetX) / v.scale;
      const iy = (sy - v.offsetY) / v.scale;
      userAdjustedRef.current = true;
      setView({ scale: s, offsetX: sx - ix * s, offsetY: sy - iy * s });
    },
    [minScale]
  );

  const resetToFit = useCallback(() => {
    const fit = fitView(viewport.w, viewport.h);
    if (fit) {
      userAdjustedRef.current = false;
      setView(fit);
    }
  }, [fitView, viewport.h, viewport.w]);

  // Load Image; every new image starts fitted to the viewport.
  useEffect(() => {
    setImageLoaded(false);
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      if (cancelled) return;
      imageRef.current = img;
      userAdjustedRef.current = false;
      // Fit in the same update that shows the image, so it never flashes at 100%.
      const el = containerRef.current;
      const fit = el ? fitView(el.clientWidth, el.clientHeight) : null;
      if (fit) setView(fit);
      setImageLoaded(true);
    };
    return () => {
      cancelled = true;
    };
  }, [imageUrl, fitView]);

  // Track the container size (the canvas always fills it).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setViewport({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fit on image load and on resize (unless the user has zoomed / panned this image).
  useEffect(() => {
    if (!imageLoaded || userAdjustedRef.current) return;
    const fit = fitView(viewport.w, viewport.h);
    if (fit) setView(fit);
  }, [imageLoaded, viewport, fitView]);

  // Wheel zoom: native listener because React's onWheel is passive (cannot preventDefault page scroll).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      // Trackpad pinch arrives as ctrl+wheel with small deltas; normalize line/page deltas.
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rect.height : 1;
      const factor = Math.exp(-e.deltaY * unit * WHEEL_ZOOM_SPEED * (e.ctrlKey ? 4 : 1));
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, viewRef.current.scale * factor);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [imageLoaded, zoomAt]);

  // Hold Space to pan with the left button (like most image editors).
  useEffect(() => {
    const isTyping = (t: EventTarget | null) =>
      t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || (t instanceof HTMLElement && t.isContentEditable);
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && pointerInsideRef.current && !isTyping(e.target)) {
        e.preventDefault(); // no page scroll / button activation while panning
        setSpaceHeld(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceHeld(false);
    };
    const blur = () => setSpaceHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  // Convert client mouse event coordinates to Image Space coordinates.
  // `scale` = image pixels per screen pixel (used to keep hit areas a constant on-screen size).
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number; scale: number } | null => {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      if (!canvas || !img) return null;
      const rect = canvas.getBoundingClientRect();
      const v = viewRef.current;
      const x = Math.max(0, Math.min(img.naturalWidth, (e.clientX - rect.left - v.offsetX) / v.scale));
      const y = Math.max(0, Math.min(img.naturalHeight, (e.clientY - rect.top - v.offsetY) / v.scale));
      return { x, y, scale: 1 / v.scale };
    },
    []
  );

  // Hit-test a specific box's 4 corner handles and center body
  const hitTestBox = useCallback(
    (coords: { x: number; y: number; scale: number }, bbox: [number, number, number, number]): HandleType | null => {
      const [bx, by, bw, bh] = bbox;
      const handleRadius = 12 * coords.scale; // 12 screen px at any zoom

      const corners: { type: HandleType; x: number; y: number }[] = [
        { type: 'tl', x: bx, y: by },
        { type: 'tr', x: bx + bw, y: by },
        { type: 'bl', x: bx, y: by + bh },
        { type: 'br', x: bx + bw, y: by + bh },
      ];
      for (const corner of corners) {
        if (Math.hypot(coords.x - corner.x, coords.y - corner.y) <= handleRadius) {
          return corner.type;
        }
      }
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

  // ---------- Rendering ----------
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded || viewport.w === 0 || viewport.h === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Backing store matches the on-screen size (sharp at any zoom and on HiDPI screens).
    const dpr = window.devicePixelRatio || 1;
    const bw0 = Math.round(viewport.w * dpr);
    const bh0 = Math.round(viewport.h * dpr);
    if (canvas.width !== bw0 || canvas.height !== bh0) {
      canvas.width = bw0;
      canvas.height = bh0;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#070a10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const { scale, offsetX, offsetY } = view;
    // From here on everything is drawn in image pixels.
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
    ctx.imageSmoothingEnabled = scale < 2; // show crisp pixels when zoomed in for precise boxes
    ctx.drawImage(img, 0, 0);

    /** Convert a size in screen CSS pixels to image pixels. */
    const px = (n: number) => n / scale;

    const catColorMap: Record<number, string> = {};
    const catNameMap: Record<number, string> = {};
    categories.forEach((c) => {
      catColorMap[c.id] = c.color;
      catNameMap[c.id] = c.name;
    });
    const handleSize = px(10);

    annotations.forEach((anno) => {
      const [bx, by, bw, bh] = anno.bbox;
      const isSelected = selectedBoxId === anno.id;
      const isHovered = hoveredBoxId === anno.id && !isSelected;
      const color = catColorMap[anno.category_id] || '#6366f1';
      const label = catNameMap[anno.category_id] || 'Target';

      ctx.fillStyle = isSelected ? `${color}45` : isHovered ? `${color}25` : `${color}15`;
      ctx.fillRect(bx, by, bw, bh);

      ctx.lineWidth = px(isSelected ? 3 : isHovered ? 2.5 : 2);
      ctx.strokeStyle = color;
      ctx.setLineDash(isHovered ? [px(6), px(6)] : []);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.setLineDash([]);

      // Label pill (constant on-screen size)
      const fontSize = px(13);
      ctx.font = `bold ${fontSize}px sans-serif`;
      const badgeH = fontSize + px(8);
      const badgeW = ctx.measureText(label).width + px(14);
      const badgeY = Math.max(0, by - badgeH);
      ctx.fillStyle = color;
      ctx.fillRect(bx, badgeY, badgeW, badgeH);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, bx + px(7), badgeY + fontSize + px(1));

      if (isSelected) {
        const corners = [
          { type: 'tl', x: bx, y: by },
          { type: 'tr', x: bx + bw, y: by },
          { type: 'bl', x: bx, y: by + bh },
          { type: 'br', x: bx + bw, y: by + bh },
        ];
        corners.forEach((c) => {
          const isTargetHandle = activeHandle === c.type || hoveredHandle === c.type;
          const curSize = isTargetHandle ? handleSize * 1.3 : handleSize;
          const curHalf = curSize / 2;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 6;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(c.x - curHalf, c.y - curHalf, curSize, curSize);
          ctx.shadowBlur = 0;
          ctx.lineWidth = px(2.5);
          ctx.strokeStyle = isTargetHandle ? '#ffffff' : color;
          ctx.strokeRect(c.x - curHalf, c.y - curHalf, curSize, curSize);
          ctx.fillStyle = color;
          ctx.fillRect(c.x - curHalf + px(2), c.y - curHalf + px(2), curSize - px(4), curSize - px(4));
        });

        // Center move anchor
        const centerX = bx + bw / 2;
        const centerY = by + bh / 2;
        const centerRadius = px(11);
        ctx.beginPath();
        ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = activeHandle === 'center' || hoveredHandle === 'center' ? color : 'rgba(15, 23, 42, 0.8)';
        ctx.fill();
        ctx.lineWidth = px(2);
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        const arrLen = centerRadius * 0.6;
        ctx.beginPath();
        ctx.moveTo(centerX - arrLen, centerY);
        ctx.lineTo(centerX + arrLen, centerY);
        ctx.moveTo(centerX, centerY - arrLen);
        ctx.lineTo(centerX, centerY + arrLen);
        ctx.stroke();

        // Dimension badge [W × H] (in image pixels)
        const dimText = `${Math.round(bw)} × ${Math.round(bh)}`;
        const dimFontSize = px(12);
        ctx.font = `bold ${dimFontSize}px sans-serif`;
        const dimW = ctx.measureText(dimText).width + px(12);
        const dimH = dimFontSize + px(6);
        const dimY = Math.min(img.naturalHeight - dimH, by + bh + px(4));
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(bx + bw - dimW, dimY, dimW, dimH);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(dimText, bx + bw - dimW + px(6), dimY + dimFontSize);
      }
    });

    // Box being drawn
    if (actionMode === 'drawing' && currentDrawBox) {
      const activeColor = catColorMap[selectedCategoryId] || '#6366f1';
      const { x, y, w, h } = currentDrawBox;
      ctx.fillStyle = `${activeColor}30`;
      ctx.fillRect(x, y, w, h);
      ctx.lineWidth = px(2);
      ctx.setLineDash([px(6), px(6)]);
      ctx.strokeStyle = activeColor;
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      const dimText = `${Math.round(w)} × ${Math.round(h)}`;
      ctx.font = `bold ${px(12)}px sans-serif`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(x + w + px(6), y + h + px(6), ctx.measureText(dimText).width + px(10), px(20));
      ctx.fillStyle = '#ffffff';
      ctx.fillText(dimText, x + w + px(11), y + h + px(20));
    }

    // Crosshair guides across the image
    if (mousePos && actionMode !== 'moving' && actionMode !== 'resizing' && actionMode !== 'panning') {
      ctx.lineWidth = px(1);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.setLineDash([px(3), px(4)]);
      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0);
      ctx.lineTo(mousePos.x, img.naturalHeight);
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(img.naturalWidth, mousePos.y);
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
    view,
    viewport,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getCursor = (): string => {
    if (actionMode === 'panning') return 'grabbing';
    if (spaceHeld) return 'grab';
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

  // ---------- Mouse ----------
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Middle button, or Space + left button: pan the view.
    if (e.button === 1 || (e.button === 0 && spaceHeld)) {
      e.preventDefault();
      const v = viewRef.current;
      panStartRef.current = { x: e.clientX, y: e.clientY, offsetX: v.offsetX, offsetY: v.offsetY };
      setActionMode('panning');
      return;
    }
    if (e.button !== 0) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    if (selectedBoxId) {
      const selectedAnno = annotations.find((a) => a.id === selectedBoxId);
      if (selectedAnno) {
        const hit = hitTestBox(coords, selectedAnno.bbox);
        if (hit) {
          setActionMode(hit === 'center' ? 'moving' : 'resizing');
          setActiveHandle(hit);
          setDragStart({ x: coords.x, y: coords.y });
          const [bx, by, bw, bh] = selectedAnno.bbox;
          setInitialBox({ x: bx, y: by, w: bw, h: bh });
          return;
        }
      }
    }

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
        setActionMode('moving');
        setActiveHandle('center');
        setDragStart({ x: coords.x, y: coords.y });
        const [bx, by, bw, bh] = anno.bbox;
        setInitialBox({ x: bx, y: by, w: bw, h: bh });
      }
      return;
    }

    onSelectBox(null);
    setActionMode('drawing');
    setDragStart({ x: coords.x, y: coords.y });
    setCurrentDrawBox({ x: coords.x, y: coords.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (actionMode === 'panning' && panStartRef.current) {
      const p = panStartRef.current;
      userAdjustedRef.current = true;
      setView((v) => ({ ...v, offsetX: p.offsetX + (e.clientX - p.x), offsetY: p.offsetY + (e.clientY - p.y) }));
      return;
    }

    const coords = getCanvasCoords(e);
    if (!coords) return;
    setMousePos({ x: coords.x, y: coords.y });

    const img = imageRef.current;
    if (!img) return;

    if (actionMode === 'moving' && dragStart && initialBox && selectedBoxId) {
      const dx = coords.x - dragStart.x;
      const dy = coords.y - dragStart.y;
      const newX = Math.max(0, Math.min(img.naturalWidth - initialBox.w, initialBox.x + dx));
      const newY = Math.max(0, Math.min(img.naturalHeight - initialBox.h, initialBox.y + dy));
      onAnnotationsChange(
        annotations.map((anno) =>
          anno.id !== selectedBoxId
            ? anno
            : {
                ...anno,
                bbox: [Math.round(newX), Math.round(newY), Math.round(initialBox.w), Math.round(initialBox.h)] as [
                  number,
                  number,
                  number,
                  number
                ],
              }
        )
      );
      return;
    }

    if (actionMode === 'resizing' && activeHandle && initialBox && selectedBoxId) {
      let { x, y, w, h } = initialBox;
      const minSize = 6;
      if (activeHandle === 'br') {
        w = Math.max(minSize, Math.min(img.naturalWidth - x, coords.x - x));
        h = Math.max(minSize, Math.min(img.naturalHeight - y, coords.y - y));
      } else if (activeHandle === 'tl') {
        const anchorX = initialBox.x + initialBox.w;
        const anchorY = initialBox.y + initialBox.h;
        x = Math.max(0, Math.min(anchorX - minSize, coords.x));
        y = Math.max(0, Math.min(anchorY - minSize, coords.y));
        w = anchorX - x;
        h = anchorY - y;
      } else if (activeHandle === 'tr') {
        const anchorX = initialBox.x;
        const anchorY = initialBox.y + initialBox.h;
        y = Math.max(0, Math.min(anchorY - minSize, coords.y));
        w = Math.max(minSize, Math.min(img.naturalWidth - anchorX, coords.x - anchorX));
        h = anchorY - y;
      } else if (activeHandle === 'bl') {
        const anchorX = initialBox.x + initialBox.w;
        const anchorY = initialBox.y;
        x = Math.max(0, Math.min(anchorX - minSize, coords.x));
        w = anchorX - x;
        h = Math.max(minSize, Math.min(img.naturalHeight - anchorY, coords.y - anchorY));
      }
      onAnnotationsChange(
        annotations.map((anno) =>
          anno.id !== selectedBoxId
            ? anno
            : {
                ...anno,
                bbox: [Math.round(x), Math.round(y), Math.round(w), Math.round(h)] as [number, number, number, number],
                area: Math.round(w * h),
              }
        )
      );
      return;
    }

    if (actionMode === 'drawing' && dragStart) {
      setCurrentDrawBox({
        x: Math.min(dragStart.x, coords.x),
        y: Math.min(dragStart.y, coords.y),
        w: Math.abs(coords.x - dragStart.x),
        h: Math.abs(coords.y - dragStart.y),
      });
      return;
    }

    // Hover inspection (idle)
    let foundHandle: HandleType | null = null;
    let foundBoxId: string | null = null;
    if (selectedBoxId) {
      const selectedAnno = annotations.find((a) => a.id === selectedBoxId);
      if (selectedAnno) foundHandle = hitTestBox(coords, selectedAnno.bbox);
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

  const handleMouseUp = () => {
    if (actionMode === 'drawing' && currentDrawBox) {
      // Minimum box: 8 screen pixels, so tiny boxes are possible when zoomed in.
      const minImagePx = 8 / viewRef.current.scale;
      if (currentDrawBox.w >= minImagePx && currentDrawBox.h >= minImagePx) {
        const newAnno: AnnotationItem = {
          id: `anno_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          image_id: '',
          category_id: selectedCategoryId,
          bbox: [
            Math.round(currentDrawBox.x),
            Math.round(currentDrawBox.y),
            Math.max(1, Math.round(currentDrawBox.w)),
            Math.max(1, Math.round(currentDrawBox.h)),
          ],
          area: Math.round(currentDrawBox.w * currentDrawBox.h),
        };
        onAnnotationsChange([...annotations, newAnno]);
        onSelectBox(newAnno.id);
      }
    }
    panStartRef.current = null;
    setActionMode('idle');
    setActiveHandle(null);
    setDragStart(null);
    setInitialBox(null);
    setCurrentDrawBox(null);
  };

  const zoomByButton = (factor: number) => zoomAt(viewport.w / 2, viewport.h / 2, view.scale * factor);
  const zoomPercent = Math.round(view.scale * 100);
  const toolBtn: React.CSSProperties = {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 0,
    borderRadius: '9999px',
    color: '#e2e8f0',
    cursor: 'pointer',
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '320px',
        flex: 1,
        background: '#070a10',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {!imageLoaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {isZh ? '正在載入影像畫布...' : 'Loading image…'}
        </div>
      )}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onAuxClick={(e) => e.preventDefault()}
        onMouseEnter={() => {
          pointerInsideRef.current = true;
        }}
        onDoubleClick={(e) => {
          // Double-click empty space with no selection: fit the image back to the window.
          if (!hoveredBoxId && !selectedBoxId && e.button === 0) resetToFit();
        }}
        onMouseLeave={() => {
          pointerInsideRef.current = false;
          setSpaceHeld(false);
          setMousePos(null);
          setHoveredHandle(null);
          setHoveredBoxId(null);
          if (actionMode !== 'idle') handleMouseUp();
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          cursor: getCursor(),
          display: imageLoaded ? 'block' : 'none',
          touchAction: 'none',
        }}
      />

      {/* Zoom controls */}
      {imageLoaded && (
        <div
          role="toolbar"
          aria-label={isZh ? '縮放' : 'Zoom'}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            padding: '4px',
            background: 'rgba(15, 23, 42, 0.8)',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <button type="button" style={toolBtn} onClick={() => zoomByButton(1 / 1.25)} aria-label={isZh ? '縮小' : 'Zoom out'} title={isZh ? '縮小' : 'Zoom out'}>
            <ZoomOut size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              const img = imageRef.current;
              if (img) zoomAt(viewport.w / 2, viewport.h / 2, 1);
            }}
            title={isZh ? '原始大小 (100%)' : 'Actual size (100%)'}
            aria-label={isZh ? `目前 ${zoomPercent}%，按此切換為原始大小` : `Zoom ${zoomPercent}%, click for actual size`}
            style={{ ...toolBtn, width: 'auto', minWidth: '52px', padding: '0 6px', fontSize: '0.75rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
          >
            {zoomPercent}%
          </button>
          <button type="button" style={toolBtn} onClick={() => zoomByButton(1.25)} aria-label={isZh ? '放大' : 'Zoom in'} title={isZh ? '放大' : 'Zoom in'}>
            <ZoomIn size={16} aria-hidden="true" />
          </button>
          <button type="button" style={toolBtn} onClick={resetToFit} aria-label={isZh ? '符合視窗' : 'Fit to window'} title={isZh ? '符合視窗' : 'Fit to window'}>
            <Maximize size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Interaction tips */}
      {imageLoaded && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 'calc(100% - 24px)',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '0.72rem',
            pointerEvents: 'none',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            columnGap: '12px',
            rowGap: '2px',
          }}
        >
          {(isZh
            ? ['拖曳空白處繪製框', '拖曳四角縮放框', '拖曳中心移動', '滾輪縮放', '中鍵或空白鍵+拖曳平移', 'Delete 刪除']
            : ['Drag empty area to draw', 'Drag corners to resize', 'Drag center to move', 'Wheel to zoom', 'Middle-drag or Space+drag to pan', 'Delete to remove']
          ).map((tip) => (
            <span key={tip} style={{ whiteSpace: 'nowrap' }}>{tip}</span>
          ))}
        </div>
      )}
    </div>
  );
};
