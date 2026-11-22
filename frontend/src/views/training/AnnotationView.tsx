import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Tag,
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  Check,
  CheckSquare,
  Sliders,
  X,
  Send,
  Download,
  UploadCloud,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ImageItem, CategoryItem, AnnotationItem } from '../../types';
import { api, DATASET_IMPORT_ACCEPT, formatImportSummary } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
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

  const [classInputText, setClassInputText] = useState('');
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [imageCategoryMap, setImageCategoryMap] = useState<Record<string, number>>({});

  const [regressionPoint, setRegressionPoint] = useState<{ x: number; y: number } | null>(null);

  const [importing, setImporting] = useState(false);
  const [annoReloadKey, setAnnoReloadKey] = useState(0);
  const [annoStatus, setAnnoStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const taskType = activeProject?.task_type || 'classification';

  const handleExportDataset = () => {
    if (!activeProject) return;
    window.open(api.getDatasetExportUrl(activeProject.id), '_blank');
  };

  const handleImportDataset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeProject) return;
    if ((taskType === 'detection' || taskType === 'feature') && !(await saveCurrentAnnotations())) {
      alert(isZh ? '目前圖片的標註儲存失敗，已取消匯入以免遺失' : 'Saving the current image failed; import cancelled');
      if (importInputRef.current) importInputRef.current.value = '';
      return;
    }
    try {
      setImporting(true);
      const res = await api.importDataset(activeProject.id, Array.from(files));
      alert(formatImportSummary(res, isZh));
      await loadInitialData();
      setAnnoReloadKey((k) => k + 1);
    } catch (err: any) {
      alert(isZh ? `匯入失敗：${err.message || '檔案格式不支援'}` : `Import failed: ${err.message || 'Unsupported format'}`);
    } finally {
      setImporting(false);
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

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
        }),
      ]);

      setImages(imgs);
      setCurrentIndex((prev) => Math.min(prev, Math.max(imgs.length - 1, 0)));
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCategoryId(cats[0].id);
      }

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

  const annotationsOwnerRef = useRef<string | null>(null);
  const loadSeqRef = useRef(0);
  const navBusyRef = useRef(false);

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeProjectId]);

  useEffect(() => {
    if (!activeProjectId || !activeFilename) return;
    const seq = ++loadSeqRef.current;
    annotationsOwnerRef.current = null;
    setAnnoStatus('loading');
    setAnnotations([]);
    setSelectedBoxId(null);

    (async () => {
      try {
        const data = await api.getImageAnnotations(activeProjectId, activeFilename);
        if (seq !== loadSeqRef.current) return;
        const annos = data.annotations || [];
        setAnnotations(annos);
        annotationsOwnerRef.current = activeFilename;
        setAnnoStatus('ready');

        if (annos.length > 0) {
          setSelectedCategoryId(annos[0].category_id);
          setImageCategoryMap((prev) => ({ ...prev, [activeFilename]: annos[0].category_id }));
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
          setAnnoStatus('error');
        }
      }
    })();
  }, [activeProjectId, activeFilename, activeTaskType, annoReloadKey]);

  const invalidatePendingLoad = () => {
    loadSeqRef.current += 1;
  };
  const claimAnnotations = (filename: string) => {
    annotationsOwnerRef.current = filename;
    setAnnoStatus('ready');
  };

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
        is_crowd: 0,
      };

      invalidatePendingLoad();
      await api.saveImageAnnotations(activeProject.id, activeImage.filename, {
        image_id: activeImage.filename,
        annotations: [singleAnno],
      });

      setAnnotations([singleAnno]);
      claimAnnotations(activeImage.filename);
      setSelectedCategoryId(catId);
      setImageCategoryMap((prev) => ({ ...prev, [activeImage.filename]: catId }));
      setImages((prev) => prev.map((img, i) => (i === currentIndex ? { ...img, labeled: true, annotation_count: 1 } : img)));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 800);

      if (advance && currentIndex < images.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Failed to assign category:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDirectInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = classInputText.trim();
    if (!trimmed || !activeProject || !activeImage) return;

    try {
      setSaving(true);
      let targetCat = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
      if (!targetCat) {
        targetCat = await api.addCategory(activeProject.id, trimmed);
        setCategories((prev) => [...prev, targetCat!]);
      }

      setClassInputText('');
      await handleAssignCategory(targetCat.id, autoAdvance);
    } catch (err) {
      console.error('Failed to create/assign category:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClearCurrentLabel = async () => {
    if (!activeProject || !activeImage) return;
    try {
      setSaving(true);
      invalidatePendingLoad();
      await api.saveImageAnnotations(activeProject.id, activeImage.filename, {
        image_id: activeImage.filename,
        annotations: [],
      });

      setAnnotations([]);
      claimAnnotations(activeImage.filename);
      setImageCategoryMap((prev) => {
        const next = { ...prev };
        delete next[activeImage.filename];
        return next;
      });
      setImages((prev) => prev.map((img, i) => (i === currentIndex ? { ...img, labeled: false, annotation_count: 0 } : img)));
    } catch (err) {
      console.error('Failed to clear label:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleBatchAssign = async (catId: number) => {
    if (!activeProject || selectedImageIds.length === 0) return;
    try {
      setSaving(true);
      await api.batchAssignCategory(activeProject.id, selectedImageIds, catId);

      const selectedSet = new Set(selectedImageIds);
      setImageCategoryMap((prev) => {
        const next = { ...prev };
        selectedImageIds.forEach((id) => {
          next[id] = catId;
        });
        return next;
      });

      setImages((prev) => prev.map((img) => (selectedSet.has(img.filename) ? { ...img, labeled: true, annotation_count: 1 } : img)));
      if (activeFilename && selectedSet.has(activeFilename)) {
        setAnnoReloadKey((k) => k + 1);
      }
      setSelectedImageIds([]);
      setIsBatchMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    } catch {
      alert(isZh ? '批次標註失敗' : 'Batch annotation failed');
    } finally {
      setSaving(false);
    }
  };

  const saveCurrentAnnotations = async (): Promise<boolean> => {
    if (!activeProject || !activeImage) return true;
    if (annotationsOwnerRef.current !== activeImage.filename) {
      return true;
    }
    try {
      setSaving(true);
      let toSave = [...annotations];

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
        setImageCategoryMap((prev) => ({ ...prev, [activeImage.filename]: toSave[0].category_id }));
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
      return true;
    } catch (err) {
      console.error('Save failed:', err);
      alert(
        isZh
          ? '標註儲存失敗，請稍後再試（尚未切換圖片，標註仍保留在畫面上）'
          : 'Saving annotations failed. Please retry (current boxes are kept)'
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const navigate = async (delta: 1 | -1) => {
    if (navBusyRef.current) return;
    navBusyRef.current = true;
    try {
      if ((taskType === 'detection' || taskType === 'feature') && !(await saveCurrentAnnotations())) {
        return;
      }
      setCurrentIndex((prev) => Math.min(Math.max(prev + delta, 0), Math.max(images.length - 1, 0)));
    } finally {
      navBusyRef.current = false;
    }
  };

  const handleNext = () => navigate(1);
  const handlePrev = () => navigate(-1);

  const keyStateRef = useRef({ handleNext, handlePrev, selectedBoxId });
  keyStateRef.current = { handleNext, handlePrev, selectedBoxId };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }
      const isArrow = e.key === 'ArrowLeft' || e.key === 'ArrowRight';
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

    const confirmMsg =
      affectedImageCount > 0
        ? isZh
          ? `目前共有 ${affectedImageCount} 張照片標註了「${catName}」標籤。確定要刪除此標籤嗎？刪除後相關標註將一併移除。`
          : `${affectedImageCount} images are labeled with "${catName}". Delete this category and all related annotations?`
        : isZh
        ? `確定要刪除標籤「${catName}」嗎？`
        : `Delete category "${catName}"?`;

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
      alert(isZh ? `刪除標籤失敗：${err.message || err}` : `Failed to delete category: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const labeledCount = images.filter((i) => i.labeled).length;
  const progressPercent = images.length > 0 ? Math.round((labeledCount / images.length) * 100) : 0;

  if (!activeProject) {
    return (
      <div className="vf-container">
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            {isZh ? '請先在頂部選單選擇專案' : 'Select a project from the header first'}
          </p>
        </Card>
      </div>
    );
  }

  if (images.length === 0 && !loading) {
    return (
      <div className="vf-container">
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>
            {isZh ? '資料集中尚未新增圖片' : 'No images in dataset'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
            {isZh ? '請先前往資料集管理頁上傳圖片或開啟攝影機擷取' : 'Upload images or capture from camera in the Dataset view first'}
          </p>
          <Button variant="primary" onClick={() => setCurrentView('dataset')}>
            {isZh ? '前往資料集' : 'Open dataset'}
          </Button>
        </Card>
      </div>
    );
  }

  const currentCatId = activeImage ? imageCategoryMap[activeImage.filename] : null;
  const currentAssignedCat = categories.find((c) => c.id === currentCatId);

  return (
    <div className="vf-page vf-page-fill">
      <div className="vf-page-header">
        <div className="vf-page-heading">
          <div className="vf-page-eyebrow">
            <Tag size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>{isZh ? '影像標註' : 'Annotation'}</span>
            <TaskBadge taskType={taskType} />
          </div>
          <div className="vf-page-title-row">
            <h1 className="vf-page-title" title={activeImage?.filename}>
              {activeImage ? activeImage.filename : (isZh ? '載入中…' : 'Loading…')}
            </h1>
            {currentAssignedCat ? (
              <span
                style={{
                  fontSize: '12px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  border: `1px solid ${currentAssignedCat.color}`,
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: currentAssignedCat.color }} />
                <span>{currentAssignedCat.name}</span>
                <button
                  type="button"
                  onClick={handleClearCurrentLabel}
                  aria-label={isZh ? '清除此圖片的標籤' : 'Clear tag'}
                  title={isZh ? '清除此圖片的標籤' : 'Clear tag'}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={12} strokeWidth={1.5} />
                </button>
              </span>
            ) : (
              <span className="vf-chip">{isZh ? '尚未標註' : 'Unlabeled'}</span>
            )}
          </div>
        </div>

        <div className="vf-page-actions">
          <div
            className="vf-progress-pill"
            role="status"
            aria-label={isZh ? `已標註 ${labeledCount} / ${images.length} 張` : `${labeledCount} of ${images.length} labeled`}
          >
            <span className="vf-progress-pill-value">{progressPercent}%</span>
            <span className="vf-progress-pill-text">
              {isZh ? '已標註' : 'Labeled'} {labeledCount} / {images.length}
            </span>
            <span className="vf-progress-pill-track" aria-hidden="true">
              <span className="vf-progress-pill-bar" style={{ width: `${progressPercent}%` }} />
            </span>
          </div>

          <input
            ref={importInputRef}
            type="file"
            multiple
            accept={DATASET_IMPORT_ACCEPT}
            style={{ display: 'none' }}
            onChange={handleImportDataset}
          />

          <Button
            variant="ghost"
            size="sm"
            icon={<UploadCloud size={14} strokeWidth={1.5} />}
            loading={importing}
            onClick={() => importInputRef.current?.click()}
            title={isZh ? '匯入圖片與標註 JSON / ZIP' : 'Import images and annotations JSON / ZIP'}
          >
            {isZh ? '匯入' : 'Import'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<Download size={14} strokeWidth={1.5} />}
            onClick={handleExportDataset}
            title={isZh ? '匯出資料集與標註檔 (ZIP)' : 'Export dataset and annotations (ZIP)'}
          >
            {isZh ? '匯出' : 'Export'}
          </Button>

          {taskType === 'classification' && (
            <Button
              variant={isBatchMode ? 'primary' : 'secondary'}
              size="sm"
              icon={<CheckSquare size={14} strokeWidth={1.5} />}
              onClick={() => {
                setIsBatchMode(!isBatchMode);
                setSelectedImageIds([]);
              }}
            >
              {isBatchMode
                ? (isZh ? `退出批次 (${selectedImageIds.length})` : `Exit batch (${selectedImageIds.length})`)
                : (isZh ? '批次模式' : 'Batch mode')}
            </Button>
          )}

          {(taskType === 'detection' || taskType === 'feature') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (annoStatus === 'error') {
                  alert(isZh ? '此圖片的標註載入失敗，請先重新載入' : 'Failed to load annotations. Reload first');
                  return;
                }
                saveCurrentAnnotations();
              }}
              loading={saving}
              icon={saveSuccess ? <Check size={14} strokeWidth={1.75} /> : <Save size={14} strokeWidth={1.5} />}
            >
              {saveSuccess ? (isZh ? '已儲存' : 'Saved') : (isZh ? '儲存標註' : 'Save annotations')}
            </Button>
          )}
        </div>
      </div>

      {isBatchMode && (
        <div
          style={{
            background: 'var(--accent-primary-soft)',
            border: '1px solid var(--accent-primary-border)',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            flexWrap: 'wrap',
            gap: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', flexWrap: 'wrap' }}>
            <span className="vf-num" style={{ fontWeight: 500, color: 'var(--accent-primary)' }}>
              {isZh ? `已選取 ${selectedImageIds.length} 張` : `${selectedImageIds.length} selected`}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedImageIds(images.map((i) => i.filename))}
            >
              {isZh ? `全選 (${images.length})` : `Select all (${images.length})`}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedImageIds(images.filter((i) => !i.labeled).map((i) => i.filename))}
            >
              {isZh ? `未標註 (${images.filter((i) => !i.labeled).length})` : `Unlabeled (${images.filter((i) => !i.labeled).length})`}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedImageIds([])}
            >
              {isZh ? '清除選取' : 'Clear'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {isZh ? '套用標籤：' : 'Apply tag:'}
            </span>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={selectedImageIds.length === 0 || saving}
                onClick={() => handleBatchAssign(c.id)}
                style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: `1.5px solid ${c.color}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: selectedImageIds.length > 0 ? 'pointer' : 'not-allowed',
                  opacity: selectedImageIds.length > 0 ? 1 : 0.5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div style={{ display: 'flex', flex: 1, gap: '16px', overflow: 'hidden', minHeight: 0 }}>
        <div className="vf-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          {/* Classification Workspace */}
          {taskType === 'classification' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', overflowY: 'auto' }}>
              <div
                style={{
                  flex: 1,
                  minHeight: '280px',
                  background: 'var(--canvas-bg)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {activeImage ? (
                  <img
                    src={activeImage.url}
                    alt={activeImage.filename}
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ color: 'var(--canvas-muted)' }}>{isZh ? '無圖片' : 'No image'}</div>
                )}

                {currentAssignedCat && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(17, 17, 19, 0.85)',
                      color: '#ededf0',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-xs)',
                      border: `1px solid ${currentAssignedCat.color}`,
                      fontWeight: 500,
                      fontSize: '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: currentAssignedCat.color }} />
                    <span>{currentAssignedCat.name}</span>
                  </div>
                )}
              </div>

              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <form onSubmit={handleDirectInputSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={isZh ? '輸入類別名稱（例如：良品、刮痕、異常）…' : 'Enter category name (e.g. Pass, Scratch)…'}
                    value={classInputText}
                    onChange={(e) => setClassInputText(e.target.value)}
                    style={{ flex: 1, minWidth: '200px' }}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={<Send size={14} strokeWidth={1.5} />}
                    disabled={!classInputText.trim()}
                  >
                    {isZh ? '套用標籤' : 'Apply tag'}
                  </Button>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: '8px', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={autoAdvance}
                      onChange={(e) => setAutoAdvance(e.target.checked)}
                      style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                    />
                    {isZh ? '標註後自動下一張' : 'Auto-advance'}
                  </label>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={13} strokeWidth={1.5} />
                    <span>{isZh ? '點選類別直接標註' : 'Click a category to label'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {categories.length === 0 ? (
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {isZh ? '尚未建立類別，請在上方輸入名稱建立' : 'No categories yet. Enter a name above to create one'}
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
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              height: '36px',
                              padding: '0 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: isCurrent ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)',
                              border: `1.5px solid ${isCurrent ? cat.color : 'var(--border-subtle)'}`,
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: isCurrent ? 500 : 400,
                              transition: 'border-color var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out)',
                            }}
                          >
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: cat.color,
                                flexShrink: 0,
                              }}
                            />
                            <span>{cat.name}</span>
                            {isCurrent && <Check size={14} strokeWidth={1.75} color={cat.color} />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regression Workspace */}
          {taskType === 'regression' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px', overflowY: 'auto' }}>
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sliders size={15} strokeWidth={1.5} color="var(--text-secondary)" />
                    <span>{isZh ? '2D 座標點標註' : '2D coordinate annotation'}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {isZh ? '在影像上點擊目標位置即可自動儲存座標' : 'Click on the image to set and save the target point'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="vf-mono" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--accent-primary)' }}>
                    {regressionPoint
                      ? `(${regressionPoint.x.toFixed(3)}, ${regressionPoint.y.toFixed(3)})`
                      : (isZh ? '尚未標註' : 'Unlabeled')}
                  </span>
                  <Button variant="primary" size="sm" onClick={handleNext}>
                    {isZh ? '確認並下一張' : 'Confirm & next'}
                  </Button>
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  minHeight: '360px',
                  background: 'var(--canvas-bg)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-subtle)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {activeImage && (
                  <div
                    style={{ position: 'relative', display: 'inline-block', cursor: 'crosshair' }}
                    onClick={async (e) => {
                      if (!activeProject || !activeImage) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = (e.clientX - rect.left) / rect.width;
                      const y = (e.clientY - rect.top) / rect.height;
                      setRegressionPoint({ x, y });

                      try {
                        setSaving(true);
                        const singleAnno: AnnotationItem = {
                          id: `anno_${Date.now()}`,
                          image_id: activeImage.filename,
                          category_id: 0,
                          bbox: [x, y, 0, 0],
                          area: 0,
                          is_crowd: 0,
                        };

                        invalidatePendingLoad();
                        await api.saveImageAnnotations(activeProject.id, activeImage.filename, {
                          image_id: activeImage.filename,
                          annotations: [singleAnno],
                        });

                        setAnnotations([singleAnno]);
                        claimAnnotations(activeImage.filename);
                        setImages((prev) =>
                          prev.map((img, i) =>
                            i === currentIndex ? { ...img, labeled: true, annotation_count: 1 } : img
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
                          border: '2px solid #e5484d',
                          borderRadius: '50%',
                          transform: 'translate(-50%, -50%)',
                          pointerEvents: 'none',
                          backgroundColor: 'rgba(229, 72, 77, 0.35)',
                        }}
                      >
                        <div style={{ position: 'absolute', top: '50%', left: '-100%', width: '300%', height: '1px', background: '#e5484d', transform: 'translateY(-50%)' }} />
                        <div style={{ position: 'absolute', left: '50%', top: '-100%', height: '300%', width: '1px', background: '#e5484d', transform: 'translateX(-50%)' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detection / Feature Canvas Workspace */}
          {(taskType === 'detection' || taskType === 'feature') && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {activeImage ? (
                <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, pointerEvents: annoStatus === 'ready' ? 'auto' : 'none' }}
                    aria-busy={annoStatus === 'loading'}
                  >
                    <CanvasAnnotator
                      imageUrl={activeImage.url}
                      annotations={annotations}
                      categories={categories}
                      selectedCategoryId={selectedCategoryId}
                      onAnnotationsChange={setAnnotations}
                      selectedBoxId={selectedBoxId}
                      onSelectBox={setSelectedBoxId}
                    />
                  </div>
                  {annoStatus !== 'ready' && (
                    <div
                      role={annoStatus === 'error' ? 'alert' : 'status'}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: annoStatus === 'error' ? 'var(--accent-rose-soft)' : 'var(--bg-surface)',
                        color: annoStatus === 'error' ? 'var(--accent-rose)' : 'var(--text-primary)',
                        border: `1px solid ${annoStatus === 'error' ? 'rgba(200, 30, 30, 0.3)' : 'var(--border-strong)'}`,
                      }}
                    >
                      {annoStatus === 'loading'
                        ? (isZh ? '正在載入標註…' : 'Loading annotations…')
                        : (isZh ? '標註載入失敗，已暫停編輯以免覆蓋既有標註' : 'Failed to load annotations; editing paused')}
                      {annoStatus === 'error' && (
                        <Button variant="secondary" size="sm" onClick={() => setAnnoReloadKey((k) => k + 1)}>
                          {isZh ? '重新載入' : 'Reload'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  {isZh ? '無圖片' : 'No image'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div
          className="vf-panel"
          style={{
            width: '280px',
            flexShrink: 0,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
          }}
        >
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

          {(taskType === 'detection' || taskType === 'feature') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="vf-num" style={{ fontSize: '13px', fontWeight: 500 }}>
                  {taskType === 'feature'
                    ? (isZh ? `特徵 ROI (${annotations.length})` : `Feature ROI (${annotations.length})`)
                    : (isZh ? `標註框 (${annotations.length})` : `Bounding boxes (${annotations.length})`)}
                </span>
                {selectedBoxId && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--accent-rose)', height: '28px', padding: '0 8px', fontSize: '12px' }}
                    onClick={() => {
                      setAnnotations((prev) => prev.filter((a) => a.id !== selectedBoxId));
                      setSelectedBoxId(null);
                    }}
                  >
                    <Trash2 size={12} strokeWidth={1.5} /> {isZh ? '刪除' : 'Delete'}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                {annotations.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 4px' }}>
                    {taskType === 'feature'
                      ? (isZh ? '可拖曳框選局部特徵，留空則使用全圖' : 'Drag to select ROI, or leave empty for full image')
                      : (isZh ? '在畫布上按住滑鼠拖曳繪製標註框' : 'Drag on the canvas to draw a bounding box')}
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
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'var(--accent-primary-soft)' : 'var(--bg-surface-elevated)',
                          border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'transparent'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat?.color || 'var(--accent-primary)', flexShrink: 0 }} />
                          <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cat?.name || (isZh ? '未命名' : 'Unnamed')}
                          </span>
                        </div>
                        <span className="vf-mono" style={{ color: 'var(--text-muted)', fontSize: '11px', flexShrink: 0 }}>
                          {anno.bbox[2]}×{anno.bbox[3]}
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
      <div className="vf-panel vf-pager">
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          icon={<ChevronLeft size={15} strokeWidth={1.5} />}
          title={isZh ? '上一張 (快捷鍵 A 或 ←)' : 'Previous (A or ←)'}
        >
          {isZh ? '上一張' : 'Previous'}
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="vf-num" style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {isZh ? '第 ' : 'Image '}
            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentIndex + 1}</strong>
            {' / '}
            {images.length}
            {isZh ? ' 張' : ''}
          </span>
          <span className="vf-chip vf-pager-hint">
            <kbd className="vf-kbd">A</kbd> {isZh ? '上一張' : 'prev'}
            <kbd className="vf-kbd">D</kbd> {isZh ? '下一張' : 'next'}
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleNext}
          disabled={currentIndex === images.length - 1}
          title={isZh ? '下一張 (快捷鍵 D 或 →)' : 'Next (D or →)'}
        >
          {isZh ? '下一張' : 'Next'} <ChevronRight size={15} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
};
