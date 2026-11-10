import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Tag, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Trash2, 
  Plus,
  Check, 
  AlertCircle,
  HelpCircle,
  CheckSquare,
  Sparkles,
  Zap,
  Sliders,
  X,
  Send,
  Download,
  UploadCloud
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ImageItem, CategoryItem, AnnotationItem } from '../../types';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { TaskBadge } from '../../components/common/Badge';
import { CanvasAnnotator } from '../../components/annotation/CanvasAnnotator';
import { CategoryManager } from '../../components/annotation/CategoryManager';

export const AnnotationView: React.FC = () => {
  const { activeProject, setCurrentView, language } = useProject();
  const isZh = language === 'zh-TW';
  const [images, setImages] = useState<ImageItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1);
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Classification Direct UI Input & Click states
  const [classInputText, setClassInputText] = useState('');
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [imageCategoryMap, setImageCategoryMap] = useState<Record<string, number>>({});

  // Regression Target Point state
  const [regressionPoint, setRegressionPoint] = useState<{x: number, y: number} | null>(null);

  const [importing, setImporting] = useState(false);
  const [annoReloadKey, setAnnoReloadKey] = useState(0);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const taskType = activeProject?.task_type || 'classification';

  const handleExportDataset = () => {
    if (!activeProject) return;
    window.open(api.getDatasetExportUrl(activeProject.id), '_blank');
  };

  const handleImportDataset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeProject) return;
    try {
      setImporting(true);
      const res = await api.importDataset(activeProject.id, Array.from(files));
      alert(isZh ? `🎉 成功匯入 ${res.imported_images} 張圖片與 ${res.imported_annotations} 筆標註！` : `🎉 Successfully imported ${res.imported_images} images and ${res.imported_annotations} annotations!`);
      await loadInitialData();
      setAnnoReloadKey((k) => k + 1);
    } catch (err: any) {
      alert(isZh ? `匯入失敗: ${err.message || '檔案格式不支援'}` : `Import failed: ${err.message || 'Unsupported format'}`);
    } finally {
      setImporting(false);
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

  // Load project images, categories, and existing annotations map
  const loadInitialData = useCallback(async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const [imgs, cats, coco] = await Promise.all([
        api.listImages(activeProject.id),
        api.getCategories(activeProject.id),
        api.getAnnotationsCoco(activeProject.id).catch((err) => {
          console.error('Failed to load COCO annotations:', err);
          return { annotations: [] };
        })
      ]);

      setImages(imgs);
      setCurrentIndex(prev => Math.min(prev, Math.max(imgs.length - 1, 0)));
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCategoryId(cats[0].id);
      }

      // Build image -> category map
      const catMap: Record<string, number> = {};
      if (coco && coco.annotations) {
        for (const a of coco.annotations) {
          const imgId = String(a.image_id);
          if (a.category_id) {
            catMap[imgId] = a.category_id;
          }
        }
      }
      setImageCategoryMap(catMap);

    } catch (err) {
      console.error('Failed to load annotation data:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const activeImage = images[currentIndex] || null;
  const activeFilename = activeImage?.filename ?? null;
  const activeProjectId = activeProject?.id ?? null;
  const activeTaskType = activeProject?.task_type;

  // Which image the `annotations` state currently belongs to. null while loading or after a failed load,
  // so a save can never write one image's boxes onto another image.
  const annotationsOwnerRef = useRef<string | null>(null);
  // Incremented per load so a slow, out-of-order response for a previous image is ignored.
  const loadSeqRef = useRef(0);
  // Prevents a second navigation (e.g. pressing D twice quickly) while one is saving.
  const navBusyRef = useRef(false);

  // Start from the first image when switching projects.
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeProjectId]);

  // Load annotations when the active image changes (keyed by filename, not object identity,
  // so updating `images` after a save does not trigger a reload).
  useEffect(() => {
    if (!activeProjectId || !activeFilename) return;
    const seq = ++loadSeqRef.current;
    annotationsOwnerRef.current = null;
    setAnnotations([]);
    setSelectedBoxId(null);

    (async () => {
      try {
        const data = await api.getImageAnnotations(activeProjectId, activeFilename);
        if (seq !== loadSeqRef.current) return;
        const annos = data.annotations || [];
        setAnnotations(annos);
        annotationsOwnerRef.current = activeFilename;

        if (annos.length > 0) {
          setSelectedCategoryId(annos[0].category_id);
          setImageCategoryMap(prev => ({ ...prev, [activeFilename]: annos[0].category_id }));
          if (activeTaskType === 'regression' && annos[0].bbox) {
            setRegressionPoint({ x: annos[0].bbox[0], y: annos[0].bbox[1] });
          } else {
            setRegressionPoint(null);
          }
        } else {
          setRegressionPoint(null);
        }
      } catch (err) {
        if (seq === loadSeqRef.current) {
          console.error('Failed to load image annotations:', err);
        }
      }
    })();
  }, [activeProjectId, activeFilename, activeTaskType, annoReloadKey]);

  // Direct Click or Input: Assign category to current image
  const handleAssignCategory = async (catId: number, advance = autoAdvance) => {
    if (!activeProject || !activeImage) return;
    try {
      setSaving(true);
      const singleAnno: AnnotationItem = {
        id: `anno_${Date.now()}`,
        image_id: activeImage.filename,
        category_id: catId,
        bbox: [0, 0, activeImage.width || 800, activeImage.height || 600],
        area: (activeImage.width || 800) * (activeImage.height || 600),
        is_crowd: 0
      };

      await api.saveImageAnnotations(activeProject.id, activeImage.filename, {
        image_id: activeImage.filename,
        annotations: [singleAnno]
      });

      setAnnotations([singleAnno]);
      annotationsOwnerRef.current = activeImage.filename;
      setSelectedCategoryId(catId);
      setImageCategoryMap(prev => ({ ...prev, [activeImage.filename]: catId }));
      setImages(prev => prev.map((img, i) => i === currentIndex ? { ...img, labeled: true, annotation_count: 1 } : img));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 800);

      // Auto advance if enabled
      if (advance && currentIndex < images.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to assign category:', err);
    } finally {
      setSaving(false);
    }
  };

  // Direct Input Submit (Create category if new, then assign)
  const handleDirectInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = classInputText.trim();
    if (!trimmed || !activeProject || !activeImage) return;

    try {
      setSaving(true);
      // Check if category already exists
      let targetCat = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
      if (!targetCat) {
        // Create new category
        targetCat = await api.addCategory(activeProject.id, trimmed);
        setCategories(prev => [...prev, targetCat!]);
      }

      setClassInputText('');
      await handleAssignCategory(targetCat.id, autoAdvance);
    } catch (err) {
      console.error('Failed to create/assign category:', err);
    } finally {
      setSaving(false);
    }
  };

  // Clear current image label
  const handleClearCurrentLabel = async () => {
    if (!activeProject || !activeImage) return;
    try {
      setSaving(true);
      await api.saveImageAnnotations(activeProject.id, activeImage.filename, {
        image_id: activeImage.filename,
        annotations: []
      });

      setAnnotations([]);
      annotationsOwnerRef.current = activeImage.filename;
      setImageCategoryMap(prev => {
        const next = { ...prev };
        delete next[activeImage.filename];
        return next;
      });
      setImages(prev => prev.map((img, i) => i === currentIndex ? { ...img, labeled: false, annotation_count: 0 } : img));
    } catch (err) {
      console.error('Failed to clear label:', err);
    } finally {
      setSaving(false);
    }
  };

  // Batch Assign Category
  const handleBatchAssign = async (catId: number) => {
    if (!activeProject || selectedImageIds.length === 0) return;
    try {
      setSaving(true);
      await api.batchAssignCategory(activeProject.id, selectedImageIds, catId);
      
      const selectedSet = new Set(selectedImageIds);
      setImageCategoryMap(prev => {
        const next = { ...prev };
        selectedImageIds.forEach(id => { next[id] = catId; });
        return next;
      });

      setImages(prev => prev.map(img => selectedSet.has(img.filename) ? { ...img, labeled: true, annotation_count: 1 } : img));
      if (activeFilename && selectedSet.has(activeFilename)) {
        setAnnoReloadKey((k) => k + 1);
      }
      setSelectedImageIds([]);
      setIsBatchMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    } catch (err) {
      alert(isZh ? '批次標註失敗' : 'Batch annotation failed');
    } finally {
      setSaving(false);
    }
  };

  // General Save (for Detection & Feature)
  const saveCurrentAnnotations = async () => {
    if (!activeProject || !activeImage) return;
    if (annotationsOwnerRef.current !== activeImage.filename) {
      // Annotations for this image have not finished loading (or failed to load): nothing to save.
      return;
    }
    try {
      setSaving(true);
      let toSave = [...annotations];

      // If feature task and no box drawn, but category is selected, auto-create a full-image ROI
      if (toSave.length === 0 && selectedCategoryId && taskType === 'feature') {
        const fullBox: AnnotationItem = {
          id: `anno_${Date.now()}`,
          image_id: activeImage.filename,
          category_id: selectedCategoryId,
          bbox: [0, 0, activeImage.width || 800, activeImage.height || 600],
          area: (activeImage.width || 800) * (activeImage.height || 600),
          is_crowd: 0,
        };
        toSave = [fullBox];
        setAnnotations([fullBox]);
      }

      await api.saveImageAnnotations(activeProject.id, activeImage.filename, {
        image_id: activeImage.filename,
        annotations: toSave,
      });

      if (toSave.length > 0) {
        setImageCategoryMap(prev => ({ ...prev, [activeImage.filename]: toSave[0].category_id }));
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1200);

      setImages((prev) =>
        prev.map((img, i) =>
          i === currentIndex
            ? { ...img, labeled: toSave.length > 0, annotation_count: toSave.length }
            : img
        )
      );
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const navigate = async (delta: 1 | -1) => {
    if (navBusyRef.current) return;
    navBusyRef.current = true;
    try {
      if (taskType === 'detection' || taskType === 'feature') {
        await saveCurrentAnnotations();
      }
      // Note: Regression is auto-saved on click, classification is auto-saved on button click.
      setCurrentIndex((prev) => Math.min(Math.max(prev + delta, 0), Math.max(images.length - 1, 0)));
    } finally {
      navBusyRef.current = false;
    }
  };

  const handleNext = () => navigate(1);
  const handlePrev = () => navigate(-1);

  // Keep the latest handlers in a ref so the keydown listener is registered once and never stale.
  const keyStateRef = useRef({ handleNext, handlePrev, selectedBoxId });
  keyStateRef.current = { handleNext, handlePrev, selectedBoxId };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return; // e.g. CanvasAnnotator used the key to nudge/delete a box
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }
      const isArrow = e.key === 'ArrowLeft' || e.key === 'ArrowRight';
      // Arrow keys nudge the selected box; never also change images.
      if (isArrow && keyStateRef.current.selectedBoxId) return;
      const k = e.key.toLowerCase();
      if (k === 'd' || e.key === '.' || e.key === '>' || e.key === 'ArrowRight') {
        keyStateRef.current.handleNext();
      } else if (k === 'a' || e.key === ',' || e.key === '<' || e.key === 'ArrowLeft') {
        keyStateRef.current.handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddCategory = async (name: string, color?: string) => {
    if (!activeProject) return;
    const newCat = await api.addCategory(activeProject.id, name, color);
    setCategories((prev) => [...prev, newCat]);
    setSelectedCategoryId(newCat.id);
  };

  const handleDeleteCategory = async (catId: number) => {
    if (!activeProject) return;

    const targetCat = categories.find((c) => c.id === catId);
    const catName = targetCat ? targetCat.name : (isZh ? '此' : 'this');

    // Count how many images in the project are labeled with this category
    let affectedImageCount = 0;
    try {
      const cocoRes = await api.getAnnotationsCoco(activeProject.id);
      const annos = cocoRes.annotations || [];
      const matchingAnnos = annos.filter((a) => a.category_id === catId);
      const matchingImgSet = new Set(matchingAnnos.map((a) => String(a.image_id)));

      Object.entries(imageCategoryMap).forEach(([imgId, cid]) => {
        if (cid === catId) matchingImgSet.add(imgId);
      });
      affectedImageCount = matchingImgSet.size;
    } catch {
      affectedImageCount = Object.values(imageCategoryMap).filter((cid) => cid === catId).length;
    }

    const confirmMsg = affectedImageCount > 0
      ? (isZh 
          ? `⚠️ 目前共有 ${affectedImageCount} 張照片標註了「${catName}」標籤！\n\n確定要刪除此標籤嗎？一旦確認，這 ${affectedImageCount} 張照片上的相關標註將一併全數移除。`
          : `⚠️ There are ${affectedImageCount} images labeled with "${catName}"!\n\nAre you sure you want to delete this category? All related annotations will be removed.`)
      : (isZh 
          ? `確定要刪除標籤「${catName}」嗎？`
          : `Are you sure you want to delete category "${catName}"?`);

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setSaving(true);
      await api.deleteCategory(activeProject.id, catId);

      const updatedCategories = categories.filter((c) => c.id !== catId);
      setCategories(updatedCategories);

      setImageCategoryMap((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(next)) {
          if (v === catId) delete next[k];
        }
        return next;
      });

      setAnnotations((prev) => prev.filter((a) => a.category_id !== catId));

      if (selectedCategoryId === catId) {
        setSelectedCategoryId(updatedCategories.length > 0 ? updatedCategories[0].id : 0);
      }

      await loadInitialData();
    } catch (err: any) {
      alert(isZh ? `刪除標籤失敗: ${err.message || err}` : `Failed to delete category: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const labeledCount = images.filter((i) => i.labeled).length;
  const progressPercent = images.length > 0 ? Math.round((labeledCount / images.length) * 100) : 0;

  if (!activeProject) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>{isZh ? '請先在頂部選單選擇專案' : 'Please select a project from the top menu first'}</div>;
  }

  if (images.length === 0 && !loading) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {isZh ? '資料集中目前沒有任何圖片' : 'No images in the dataset'}
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {isZh ? '請先前往「資料集管理」上傳圖片或透過攝影機進行擷取。' : 'Please go to Dataset Management to upload or capture images first.'}
        </p>
        <Button variant="primary" onClick={() => setCurrentView('dataset')}>
          {isZh ? '前往資料集管理' : 'Go to Dataset Management'}
        </Button>
      </div>
    );
  }

  const currentCatId = activeImage ? imageCategoryMap[activeImage.filename] : null;
  const currentAssignedCat = categories.find(c => c.id === currentCatId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '0.75rem' }}>
      {/* Top Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
          padding: '0.6rem 1rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={16} color="#818cf8" />
            {activeImage ? activeImage.filename : (isZh ? '載入中...' : 'Loading...')}
          </span>
          <TaskBadge taskType={taskType} />
          {currentAssignedCat ? (
            <div
              style={{
                fontSize: '0.8rem',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                background: `${currentAssignedCat.color}25`,
                color: currentAssignedCat.color,
                border: `1px solid ${currentAssignedCat.color}`,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Check size={13} /> {isZh ? '當前標籤:' : 'Current Tag:'} {currentAssignedCat.name}
              <button
                onClick={handleClearCurrentLabel}
                title={isZh ? '清除此圖片的標籤' : 'Clear tag for this image'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: '0 2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-surface-elevated)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
              {isZh ? '尚未標註' : 'Unlabeled'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Progress Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {isZh ? '標註:' : 'Labeled:'} <strong style={{ color: '#818cf8' }}>{labeledCount}</strong>/{images.length}
            </span>
            <div style={{ width: '80px', height: '6px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--gradient-brand)', transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Hidden Import Input */}
          <input
            ref={importInputRef}
            type="file"
            multiple
            accept=".zip,.json,.jpg,.jpeg,.png,.webp,.bmp"
            style={{ display: 'none' }}
            onChange={handleImportDataset}
          />

          <Button
            variant="ghost"
            size="sm"
            icon={<UploadCloud size={14} />}
            loading={importing}
            onClick={() => importInputRef.current?.click()}
            title={isZh ? '匯入圖片與標註 JSON / ZIP' : 'Import images and annotations JSON / ZIP'}
          >
            {isZh ? '匯入' : 'Import'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<Download size={14} />}
            onClick={handleExportDataset}
            title={isZh ? '匯出資料集與標註檔 (ZIP)' : 'Export dataset and annotations (ZIP)'}
          >
            {isZh ? '匯出' : 'Export'}
          </Button>

          {taskType === 'classification' && (
            <Button
              variant={isBatchMode ? 'primary' : 'secondary'}
              size="sm"
              icon={<CheckSquare size={14} />}
              onClick={() => {
                setIsBatchMode(!isBatchMode);
                setSelectedImageIds([]);
              }}
            >
              {isBatchMode ? (isZh ? `退出批次 (${selectedImageIds.length})` : `Exit Batch (${selectedImageIds.length})`) : (isZh ? '批次模式' : 'Batch Mode')}
            </Button>
          )}

          {(taskType === 'detection' || taskType === 'feature') && (
            <Button
              variant="primary"
              size="sm"
              onClick={saveCurrentAnnotations}
              loading={saving}
              icon={saveSuccess ? <Check size={14} /> : <Save size={14} />}
            >
              {saveSuccess ? (isZh ? '已儲存！' : 'Saved!') : (isZh ? '儲存標註' : 'Save Annotations')}
            </Button>
          )}
        </div>
      </div>

      {/* Batch Mode Toolbar */}
      {isBatchMode && (
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid var(--accent-primary)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeIn 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 700, color: '#818cf8' }}>
              {isZh ? `已選取 ${selectedImageIds.length} 張圖片` : `${selectedImageIds.length} images selected`}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', padding: '2px 6px' }}
              onClick={() => setSelectedImageIds(images.map(i => i.filename))}
            >
              {isZh ? `全選 (${images.length})` : `Select All (${images.length})`}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', padding: '2px 6px' }}
              onClick={() => setSelectedImageIds(images.filter(i => !i.labeled).map(i => i.filename))}
            >
              {isZh ? `選取未標註 (${images.filter(i => !i.labeled).length})` : `Select Unlabeled (${images.filter(i => !i.labeled).length})`}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', padding: '2px 6px', color: 'var(--text-muted)' }}
              onClick={() => setSelectedImageIds([])}
            >
              {isZh ? '清除選取' : 'Clear Selection'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{isZh ? '批次套用標籤：' : 'Batch apply tags:'}</span>
            {categories.map((c) => (
              <button
                key={c.id}
                disabled={selectedImageIds.length === 0 || saving}
                onClick={() => handleBatchAssign(c.id)}
                style={{
                  background: c.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-xs)',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: selectedImageIds.length > 0 ? 'pointer' : 'not-allowed',
                  opacity: selectedImageIds.length > 0 ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main 2-Column Layout: Center Work Area & Right Panel */}
      <div style={{ display: 'flex', flex: 1, gap: '0.75rem', overflow: 'hidden' }}>
        {/* Center: Specialized Workspace */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          
          {/* A. CLASSIFICATION WORKSPACE (Direct Click & Type UI) */}
          {taskType === 'classification' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.75rem', overflowY: 'auto' }}>
              {/* Image Preview */}
              <div
                style={{
                  flex: 1,
                  minHeight: '280px',
                  background: '#090a0f',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {activeImage ? (
                  <img
                    src={activeImage.url}
                    alt={activeImage.filename}
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ color: 'var(--text-muted)' }}>{isZh ? '無圖片' : 'No image'}</div>
                )}

                {/* Current Tag Floating Indicator on Image */}
                {currentAssignedCat && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: `${currentAssignedCat.color}e6`,
                      color: 'white',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      boxShadow: `0 4px 14px ${currentAssignedCat.color}66`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Check size={16} /> {currentAssignedCat.name}
                  </div>
                )}
              </div>

              {/* Direct Class Input & Click Control Panel */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                {/* 1. Direct Text Input Form */}
                <form onSubmit={handleDirectInputSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={isZh ? '點此輸入類別名稱（例如：正常品、刮痕瑕疵、貓、狗）...' : 'Enter category name (e.g. Cat, Dog, Defect)...'}
                    value={classInputText}
                    onChange={(e) => setClassInputText(e.target.value)}
                    style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem 0.8rem' }}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={<Send size={14} />}
                    disabled={!classInputText.trim()}
                  >
                    {isZh ? '套用標籤' : 'Apply Tag'}
                  </Button>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: '8px', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={autoAdvance}
                      onChange={(e) => setAutoAdvance(e.target.checked)}
                      style={{ accentColor: '#818cf8', cursor: 'pointer' }}
                    />
                    {isZh ? '標註後自動下一張' : 'Auto-advance on tag'}
                  </label>
                </form>

                {/* 2. Direct Click Category Pills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={13} /> {isZh ? '點選下方類別直接標註此圖片：' : 'Click category below to tag this image:'}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {categories.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {isZh ? '尚未建立任何類別，可在上方輸入框輸入名稱直接建立！' : 'No categories yet. Type above to create one!'}
                      </div>
                    ) : (
                      categories.map((cat) => {
                        const isCurrent = currentCatId === cat.id;

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleAssignCategory(cat.id, autoAdvance)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '0.5rem 1rem',
                              borderRadius: 'var(--radius-sm)',
                              background: isCurrent ? `${cat.color}33` : 'var(--bg-surface)',
                              border: `2px solid ${isCurrent ? cat.color : 'var(--border-subtle)'}`,
                              color: isCurrent ? 'white' : 'var(--text-primary)',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              transition: 'all 0.15s ease',
                              boxShadow: isCurrent ? `0 0 10px ${cat.color}40` : 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (!isCurrent) e.currentTarget.style.borderColor = cat.color;
                            }}
                            onMouseLeave={(e) => {
                              if (!isCurrent) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            }}
                          >
                            <span
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: cat.color,
                                boxShadow: `0 0 6px ${cat.color}`,
                              }}
                            />
                            <span>{cat.name}</span>
                            {isCurrent && <Check size={14} color={cat.color} />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* B. REGRESSION WORKSPACE */}
          {taskType === 'regression' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1.5rem', overflowY: 'auto' }}>
              
              <div className="glass-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sliders size={15} color="#06b6d4" /> {isZh ? '圖像迴歸 (2D 座標標註)' : 'Image Regression (2D Coordinate)'}
                  </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#06b6d4' }}>
                    {regressionPoint ? `( X: ${regressionPoint.x.toFixed(3)}, Y: ${regressionPoint.y.toFixed(3)} )` : (isZh ? '尚未標註' : 'Unlabeled')}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {isZh ? '請在下方圖片中點擊標註目標位置。點擊後將自動儲存並顯示十字標記。' : 'Click on the image to mark the target location. It will automatically save and show a crosshair.'}
                </p>
                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="primary" size="sm" onClick={handleNext}>{isZh ? '確認並下一張' : 'Confirm & Next'}</Button>
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  minHeight: '400px',
                  background: '#090a0f',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-subtle)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {activeImage && (
                  <div 
                    style={{ position: 'relative', display: 'inline-block' }}
                    onClick={async (e) => {
                      if (!activeProject || !activeImage) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = (e.clientX - rect.left) / rect.width;
                      const y = (e.clientY - rect.top) / rect.height;
                      setRegressionPoint({ x, y });
                      
                      // Auto save
                      try {
                        setSaving(true);
                        const singleAnno: AnnotationItem = {
                          id: `anno_${Date.now()}`,
                          image_id: activeImage.filename,
                          category_id: 0,
                          bbox: [x, y, 0, 0],
                          area: 0,
                          is_crowd: 0
                        };
                        
                        await api.saveImageAnnotations(activeProject.id, activeImage.filename, {
                          image_id: activeImage.filename,
                          annotations: [singleAnno]
                        });
                        
                        setAnnotations([singleAnno]);
                        annotationsOwnerRef.current = activeImage.filename;
                        setImages((prev) =>
                          prev.map((img, i) =>
                            i === currentIndex
                              ? { ...img, labeled: true, annotation_count: 1 }
                              : img
                          )
                        );
                        setSaveSuccess(true);
                        setTimeout(() => setSaveSuccess(false), 800);
                      } catch (err) {
                        console.error('Save failed:', err);
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    <img
                      src={activeImage.url}
                      alt={activeImage.filename}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
                      draggable={false}
                    />
                    {regressionPoint && (
                      <div 
                        style={{
                          position: 'absolute',
                          left: `${regressionPoint.x * 100}%`,
                          top: `${regressionPoint.y * 100}%`,
                          width: '14px',
                          height: '14px',
                          border: '2px solid red',
                          borderRadius: '50%',
                          transform: 'translate(-50%, -50%)',
                          pointerEvents: 'none',
                          boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                          backgroundColor: 'rgba(255, 0, 0, 0.4)'
                        }}
                      >
                        <div style={{ position: 'absolute', top: '50%', left: '-100%', width: '300%', height: '1px', background: 'red', transform: 'translateY(-50%)' }} />
                        <div style={{ position: 'absolute', left: '50%', top: '-100%', height: '300%', width: '1px', background: 'red', transform: 'translateX(-50%)' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* C. DETECTION / FEATURE CANVAS WORKSPACE */}
          {(taskType === 'detection' || taskType === 'feature') && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {activeImage ? (
                <CanvasAnnotator
                  imageUrl={activeImage.url}
                  annotations={annotations}
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  onAnnotationsChange={setAnnotations}
                  selectedBoxId={selectedBoxId}
                  onSelectBox={setSelectedBoxId}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  {isZh ? '無圖片' : 'No image'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Category Management & Settings */}
        <div
          style={{
            width: '260px',
            flexShrink: 0,
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            overflowY: 'auto',
          }}
        >
          {/* Category Selector & Manager */}
          <CategoryManager
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(id) => {
              setSelectedCategoryId(id);
              if (taskType === 'classification') {
                handleAssignCategory(id, false);
              } else if (taskType === 'feature') {
                setImageCategoryMap((prev) => ({ ...prev, [activeImage?.filename || '']: id }));
                if (annotations.length > 0) {
                  setAnnotations((prev) => prev.map((a) => ({ ...a, category_id: id })));
                }
              }
            }}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
          />

          {/* Detection / Feature Bounding Box List */}
          {(taskType === 'detection' || taskType === 'feature') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  {taskType === 'feature' ? (isZh ? `特徵 ROI 區域 (${annotations.length})` : `Feature ROI (${annotations.length})`) : (isZh ? `已標註框 (${annotations.length})` : `Bounding Boxes (${annotations.length})`)}
                </span>
                {selectedBoxId && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#fda4af', padding: '2px 6px', fontSize: '0.7rem' }}
                    onClick={() => {
                      setAnnotations((prev) => prev.filter((a) => a.id !== selectedBoxId));
                      setSelectedBoxId(null);
                    }}
                  >
                    <Trash2 size={12} /> {isZh ? '刪除選中框' : 'Delete Box'}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                {annotations.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.75rem 0' }}>
                    {taskType === 'feature' ? (isZh ? '可拖曳框選局部特徵，未框選時將自動以全圖標記' : 'Drag to crop ROI, or leave empty for full image') : (isZh ? '在畫布上按住滑鼠拖曳以繪製框選' : 'Click and drag on canvas to draw a bounding box')}
                  </div>
                ) : (
                  annotations.map((anno) => {
                    const cat = categories.find((c) => c.id === anno.category_id);
                    const isSelected = selectedBoxId === anno.id;
                    return (
                      <div
                        key={anno.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onClick={() => setSelectedBoxId(anno.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedBoxId(anno.id);
                          }
                        }}
                        style={{
                          padding: '0.35rem 0.6rem',
                          borderRadius: 'var(--radius-xs)',
                          background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-surface-elevated)',
                          border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat?.color || '#6366f1' }} />
                          <span style={{ fontWeight: 600 }}>{cat?.name || (isZh ? '未命名標籤' : 'Unnamed tag')}</span>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                          [{anno.bbox[0]}, {anno.bbox[1]}, {anno.bbox[2]}×{anno.bbox[3]}]
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Paging Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
          padding: '0.4rem 1rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          icon={<ChevronLeft size={15} />}
          title={isZh ? '上一張圖片 (快捷鍵: A 或 ←)' : 'Previous image (Shortcut: A or ←)'}
        >
          {isZh ? '上一張 (A)' : 'Prev (A)'}
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {isZh ? '第' : 'Image'} <strong style={{ color: '#818cf8' }}>{currentIndex + 1}</strong> / {images.length} {isZh ? '張' : ''}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-surface-elevated)', padding: '2px 6px', borderRadius: '3px' }}>
            快捷鍵: <kbd style={{ fontFamily: 'monospace', color: '#818cf8', fontWeight: 700 }}>A</kbd> 上一張 · <kbd style={{ fontFamily: 'monospace', color: '#818cf8', fontWeight: 700 }}>D</kbd> 下一張
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleNext}
          disabled={currentIndex === images.length - 1}
          title={isZh ? '下一張圖片 (快捷鍵: D 或 →)' : 'Next image (Shortcut: D or →)'}
        >
          {isZh ? '下一張 (D)' : 'Next (D)'} <ChevronRight size={15} />
        </Button>
      </div>
    </div>
  );
};
