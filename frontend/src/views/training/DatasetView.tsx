import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FolderSearch,
  Camera,
  UploadCloud,
  Download,
  Trash2,
  PieChart,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ImageItem } from '../../types';
import { api, DATASET_IMPORT_ACCEPT, formatImportSummary } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { TaskBadge } from '../../components/common/Badge';
import { ImageUploader } from '../../components/dataset/ImageUploader';
import { CameraCaptureModal } from '../../components/dataset/CameraCaptureModal';

export const DatasetView: React.FC = () => {
  const { activeProject, setCurrentView, language } = useProject();
  const isZh = language === 'zh-TW';
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterSplit, setFilterSplit] = useState<string>('all');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [trainRatio, setTrainRatio] = useState(0.8);
  const [valRatio, setValRatio] = useState(0.2);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  const importDatasetInputRef = useRef<HTMLInputElement | null>(null);

  const loadImages = useCallback(async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const list = await api.listImages(activeProject.id);
      setImages(list);
    } catch (err) {
      console.error('Failed to load images:', err);
    } finally {
      setLoading(false);
    }
  }, [activeProject]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleUpload = async (files: File[]) => {
    if (!activeProject) return;
    try {
      setUploading(true);
      await api.uploadImages(activeProject.id, files);
      await loadImages();
    } catch {
      alert(isZh ? '圖片上傳失敗' : 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleCameraCapture = async (file: File) => {
    if (!activeProject) return;
    await api.uploadImages(activeProject.id, [file]);
    await loadImages();
  };

  const handleDeleteImage = async (filename: string) => {
    if (!activeProject) return;
    if (confirm(isZh ? `確定要刪除圖片「${filename}」嗎？` : `Delete image "${filename}"?`)) {
      await api.deleteImage(activeProject.id, filename);
      setImages((prev) => prev.filter((img) => img.filename !== filename));
    }
  };

  const handleSplitDataset = async () => {
    if (!activeProject) return;
    try {
      await api.splitDataset(activeProject.id, {
        train_ratio: trainRatio,
        val_ratio: valRatio,
        test_ratio: Math.max(0, 1 - trainRatio - valRatio),
      });
      setIsSplitModalOpen(false);
      await loadImages();
    } catch {
      alert(isZh ? '分割資料集失敗' : 'Failed to split dataset');
    }
  };

  const handleExportDataset = () => {
    if (!activeProject) return;
    const exportUrl = api.getDatasetExportUrl(activeProject.id);
    window.open(exportUrl, '_blank');
  };

  const handleImportDataset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeProject) return;

    try {
      setImporting(true);
      setImportSuccessMsg('');
      const res = await api.importDataset(activeProject.id, Array.from(files));
      setImportSuccessMsg(formatImportSummary(res, isZh));
      await loadImages();
    } catch (err: any) {
      alert(isZh ? `匯入失敗：${err.message || '檔案格式不支援'}` : `Import failed: ${err.message || 'Unsupported format'}`);
    } finally {
      setImporting(false);
      if (importDatasetInputRef.current) {
        importDatasetInputRef.current.value = '';
      }
    }
  };

  const filteredImages = images.filter((img) => {
    if (filterSplit === 'all') return true;
    if (filterSplit === 'labeled') return img.labeled;
    if (filterSplit === 'unlabeled') return !img.labeled;
    return img.split === filterSplit;
  });

  const labeledCount = images.filter((i) => i.labeled).length;
  const unlabeledCount = Math.max(0, images.length - labeledCount);
  const trainCount = images.filter((i) => i.split === 'train').length;
  const valCount = images.filter((i) => i.split === 'val').length;

  if (!activeProject) {
    return (
      <div className="vf-container">
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            {isZh ? '請先在頂部選單選擇或建立專案' : 'Select or create a project from the header first'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="vf-container">
      <input
        ref={importDatasetInputRef}
        type="file"
        multiple
        accept={DATASET_IMPORT_ACCEPT}
        style={{ display: 'none' }}
        onChange={handleImportDataset}
      />

      <div className="vf-page-header">
        <div className="vf-page-heading">
          <div className="vf-page-eyebrow">
            <FolderSearch size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>{isZh ? '資料集管理' : 'Dataset'}</span>
            <TaskBadge taskType={activeProject.task_type} />
          </div>
          <div className="vf-page-title-row">
            <h1 className="vf-page-title">{activeProject.name}</h1>
          </div>
        </div>

        <div className="vf-page-actions">
          <Button
            variant="secondary"
            size="sm"
            icon={<UploadCloud size={15} strokeWidth={1.5} />}
            loading={importing}
            onClick={() => importDatasetInputRef.current?.click()}
            title={isZh ? '支援 ZIP 或多選檔案：影像 + COCO JSON，或影像 + YOLO 標籤' : 'ZIP or multiple files: images + COCO JSON or YOLO labels'}
          >
            {isZh ? '匯入 COCO / YOLO' : 'Import COCO / YOLO'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={15} strokeWidth={1.5} />}
            onClick={handleExportDataset}
            disabled={images.length === 0}
          >
            {isZh ? '匯出 ZIP' : 'Export ZIP'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Camera size={15} strokeWidth={1.5} />}
            onClick={() => setIsCameraOpen(true)}
          >
            {isZh ? '相機擷取' : 'Camera capture'}
          </Button>

          <Button
            variant={isSplitModalOpen ? 'primary' : 'secondary'}
            size="sm"
            icon={<PieChart size={15} strokeWidth={1.5} />}
            onClick={() => setIsSplitModalOpen(!isSplitModalOpen)}
          >
            {isZh ? '資料集分割' : 'Split dataset'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<ArrowRight size={15} strokeWidth={1.5} />}
            onClick={() => setCurrentView('annotator')}
          >
            {isZh ? '前往標註' : 'Open annotator'}
          </Button>
        </div>
      </div>

      {importSuccessMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--accent-emerald-soft)',
            border: '1px solid rgba(21, 128, 61, 0.25)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent-emerald)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} strokeWidth={1.5} />
            <span style={{ whiteSpace: 'pre-line' }}>{importSuccessMsg}</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setImportSuccessMsg('')}
            style={{ color: 'var(--accent-emerald)' }}
          >
            {isZh ? '關閉' : 'Close'}
          </button>
        </div>
      )}

      {/* Dataset Statistics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
        <Card>
          <div className="vf-stat-label">{isZh ? '總影像數' : 'Total images'}</div>
          <div className="vf-stat-value vf-num">{images.length.toLocaleString()}</div>
          <div className="vf-stat-sub">
            {isZh ? `未標註 ${unlabeledCount.toLocaleString()} 張` : `${unlabeledCount.toLocaleString()} unlabeled`}
          </div>
        </Card>

        <Card>
          <div className="vf-stat-label">{isZh ? '已標註影像' : 'Labeled'}</div>
          <div className="vf-stat-value vf-num" style={{ color: labeledCount > 0 ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>
            {labeledCount.toLocaleString()}
          </div>
          <div className="vf-stat-sub">
            {images.length > 0 ? `${Math.round((labeledCount / images.length) * 100)}%` : '0%'} {isZh ? '完成率' : 'complete'}
          </div>
        </Card>

        <Card>
          <div className="vf-stat-label">{isZh ? '訓練集 (Train)' : 'Train subset'}</div>
          <div className="vf-stat-value vf-num">{trainCount.toLocaleString()}</div>
          <div className="vf-stat-sub">
            {isZh ? '佔比' : 'Share'} {images.length > 0 ? Math.round((trainCount / images.length) * 100) : 0}%
          </div>
        </Card>

        <Card>
          <div className="vf-stat-label">{isZh ? '驗證集 (Val)' : 'Validation subset'}</div>
          <div className="vf-stat-value vf-num">{valCount.toLocaleString()}</div>
          <div className="vf-stat-sub">
            {isZh ? '佔比' : 'Share'} {images.length > 0 ? Math.round((valCount / images.length) * 100) : 0}%
          </div>
        </Card>
      </div>

      {/* Split Settings Drawer */}
      {isSplitModalOpen && (
        <Card style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={16} strokeWidth={1.5} color="var(--text-secondary)" />
            <span>{isZh ? '依比例劃分訓練集與驗證集' : 'Split into train and validation subsets'}</span>
          </h3>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{isZh ? '訓練集比例' : 'Train ratio'}</span>
              <input
                type="range"
                min="0.5"
                max="0.9"
                step="0.05"
                value={trainRatio}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTrainRatio(val);
                  setValRatio(parseFloat((1 - val).toFixed(2)));
                }}
                style={{ width: '132px', accentColor: 'var(--accent-primary)' }}
              />
              <span className="vf-num" style={{ fontWeight: 500, color: 'var(--accent-primary)' }}>
                {Math.round(trainRatio * 100)}%
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{isZh ? '驗證集比例' : 'Val ratio'}</span>
              <span className="vf-num" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                {Math.round(valRatio * 100)}%
              </span>
            </div>

            <Button variant="primary" size="sm" onClick={handleSplitDataset}>
              {isZh ? '執行隨機劃分' : 'Apply random split'}
            </Button>
          </div>
        </Card>
      )}

      <ImageUploader onUpload={handleUpload} loading={uploading} />

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div className="vf-tabs" role="tablist" aria-label={isZh ? '子集篩選' : 'Dataset filter'}>
          {[
            { id: 'all', label: isZh ? '全部' : 'All' },
            { id: 'train', label: isZh ? '訓練集' : 'Train' },
            { id: 'val', label: isZh ? '驗證集' : 'Val' },
            { id: 'labeled', label: isZh ? '已標註' : 'Labeled' },
            { id: 'unlabeled', label: isZh ? '未標註' : 'Unlabeled' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filterSplit === tab.id}
              className={`vf-tab ${filterSplit === tab.id ? 'active' : ''}`}
              onClick={() => setFilterSplit(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="vf-num" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {isZh ? `顯示 ${filteredImages.length} / ${images.length} 張影像` : `Showing ${filteredImages.length} of ${images.length} images`}
        </span>
      </div>

      {/* Images Thumbnail Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
          {isZh ? '正在載入影像列表…' : 'Loading images…'}
        </div>
      ) : filteredImages.length === 0 ? (
        <Card
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            borderStyle: 'dashed',
          }}
        >
          <FolderSearch size={32} strokeWidth={1.5} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>
            {isZh ? '資料集中尚無相符影像' : 'No matching images'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '420px', margin: '0 auto' }}>
            {isZh
              ? '點擊上方匯入 COCO / YOLO 資料集、拖放圖片至此或使用攝影機擷取樣本'
              : 'Import a COCO / YOLO dataset above, drag & drop images, or capture with your camera'}
          </p>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          {filteredImages.map((img) => {
            const aspect = img.width && img.height ? `${img.width} / ${img.height}` : '16 / 9';
            const splitLabel = img.split === 'train' ? 'Train' : img.split === 'val' ? 'Val' : img.split;
            return (
              <div
                key={img.id}
                style={{
                  position: 'relative',
                  aspectRatio: aspect,
                  background: 'var(--canvas-bg)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={img.url}
                  alt={img.filename}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />

                {/* Top-left Status Badges */}
                <div style={{ position: 'absolute', top: '6px', left: '6px', display: 'flex', gap: '4px', zIndex: 2 }}>
                  {img.labeled ? (
                    <span
                      className="vf-num"
                      style={{
                        background: 'rgba(17, 17, 19, 0.78)',
                        color: '#6ee7b7',
                        fontSize: '11px',
                        fontWeight: 500,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle2 size={11} strokeWidth={1.75} />
                      {img.annotation_count > 0 ? `${img.annotation_count}` : (isZh ? '已標' : 'Labeled')}
                    </span>
                  ) : (
                    <span
                      style={{
                        background: 'rgba(17, 17, 19, 0.78)',
                        color: '#a1a1aa',
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255, 255, 255, 0.10)',
                      }}
                    >
                      {isZh ? '未標註' : 'Unlabeled'}
                    </span>
                  )}

                  {img.split && img.split !== 'unassigned' && (
                    <span
                      style={{
                        background: 'rgba(17, 17, 19, 0.78)',
                        color: '#e4e4e7',
                        fontSize: '11px',
                        fontWeight: 500,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      {splitLabel}
                    </span>
                  )}
                </div>

                {/* Delete Button overlay */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteImage(img.filename);
                  }}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'rgba(17, 17, 19, 0.78)',
                    color: '#f4f4f5',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '4px',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(6px)',
                    zIndex: 2,
                  }}
                  title={isZh ? '刪除圖片' : 'Delete image'}
                  aria-label={isZh ? `刪除 ${img.filename}` : `Delete ${img.filename}`}
                >
                  <Trash2 size={12} strokeWidth={1.5} />
                </button>

                {/* Resolution Badge */}
                <div
                  className="vf-num"
                  style={{
                    position: 'absolute',
                    bottom: '6px',
                    right: '6px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#e4e4e7',
                    background: 'rgba(17, 17, 19, 0.78)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255, 255, 255, 0.10)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                >
                  {img.width} × {img.height}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onCaptureImage={handleCameraCapture}
        onClose={() => setIsCameraOpen(false)}
      />
    </div>
  );
};
