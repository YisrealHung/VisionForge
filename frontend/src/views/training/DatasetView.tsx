import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FolderSearch, 
  Camera, 
  UploadCloud, 
  Download,
  Trash2, 
  PieChart, 
  Sparkles, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Layers,
  FileArchive,
  AlertCircle
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ImageItem } from '../../types';
import { api, DATASET_IMPORT_ACCEPT, formatImportSummary } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
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
    } catch (err) {
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
    if (confirm(isZh ? `確定要刪除圖片「${filename}」嗎？` : `Are you sure you want to delete image "${filename}"?`)) {
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
    } catch (err) {
      alert(isZh ? '分割資料集失敗' : 'Failed to split dataset');
    }
  };

  // Export Complete Dataset ZIP
  const handleExportDataset = () => {
    if (!activeProject) return;
    const exportUrl = api.getDatasetExportUrl(activeProject.id);
    window.open(exportUrl, '_blank');
  };

  // Import Dataset ZIP or loose image/JSON files
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
      alert(isZh ? `匯入失敗: ${err.message || '檔案格式不支援'}` : `Import failed: ${err.message || 'Unsupported format'}`);
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
  const trainCount = images.filter((i) => i.split === 'train').length;
  const valCount = images.filter((i) => i.split === 'val').length;

  if (!activeProject) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>{isZh ? '請先在頂部選單選擇或建立一個專案' : 'Please select or create a project from the top menu first'}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Hidden File Input for Dataset Import */}
      <input
        ref={importDatasetInputRef}
        type="file"
        multiple
        accept={DATASET_IMPORT_ACCEPT}
        style={{ display: 'none' }}
        onChange={handleImportDataset}
      />

      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            📁 {isZh ? '資料集管理中心' : 'Dataset Management Center'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {isZh ? '專案：' : 'Project: '}<span style={{ color: '#818cf8', fontWeight: 600 }}>{activeProject.name}</span> · {isZh ? '匯入/匯出圖片與標註檔、相機拍攝與資料集分割' : 'Import/Export images and annotations, camera capture, and dataset split'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Import Button */}
          <Button
            variant="secondary"
            icon={<UploadCloud size={15} />}
            loading={importing}
            onClick={() => importDatasetInputRef.current?.click()}
            title={isZh ? '支援 ZIP 或多選檔案：影像 + COCO JSON，或影像 + YOLO 標籤 (labels/*.txt + data.yaml)' : 'ZIP or multiple files: images + COCO JSON, or images + YOLO labels (labels/*.txt + data.yaml)'}
          >
            {isZh ? '匯入資料集 (COCO / YOLO)' : 'Import Dataset (COCO / YOLO)'}
          </Button>

          {/* Export Button */}
          <Button
            variant="secondary"
            icon={<Download size={15} />}
            onClick={handleExportDataset}
            disabled={images.length === 0}
          >
            {isZh ? '匯出資料集 (ZIP)' : 'Export Dataset (ZIP)'}
          </Button>

          {/* Camera Button */}
          <Button
            variant="secondary"
            icon={<Camera size={15} />}
            onClick={() => setIsCameraOpen(true)}
          >
            {isZh ? '啟動相機拍攝' : 'Start Camera Capture'}
          </Button>

          {/* Split Button */}
          <Button
            variant="secondary"
            icon={<PieChart size={15} />}
            onClick={() => setIsSplitModalOpen(!isSplitModalOpen)}
          >
            {isZh ? '資料集分割' : 'Split Dataset'}
          </Button>

          {/* Annotator Navigation */}
          <Button
            variant="primary"
            icon={<ArrowRight size={15} />}
            onClick={() => setCurrentView('annotator')}
          >
            {isZh ? '前往標註工具' : 'Go to Annotator'}
          </Button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {importSuccessMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#34d399',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span style={{ whiteSpace: 'pre-line' }}>{importSuccessMsg}</span>
          </div>
          <button
            onClick={() => setImportSuccessMsg('')}
            style={{ background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            {isZh ? '關閉' : 'Close'}
          </button>
        </div>
      )}

      {/* Dataset Statistics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{isZh ? '總圖片數' : 'Total Images'}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{images.length}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {isZh ? '已標註:' : 'Labeled:'} <span style={{ color: '#10b981', fontWeight: 600 }}>{labeledCount}</span> / {isZh ? '未標註:' : 'Unlabeled:'} {images.length - labeledCount}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{isZh ? '訓練集 (Train)' : 'Train Set'}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8' }}>{trainCount}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {isZh ? '佔比' : 'Ratio'} {images.length > 0 ? Math.round((trainCount / images.length) * 100) : 0}%
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{isZh ? '驗證集 (Val)' : 'Val Set'}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#06b6d4' }}>{valCount}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {isZh ? '佔比' : 'Ratio'} {images.length > 0 ? Math.round((valCount / images.length) * 100) : 0}%
          </div>
        </Card>
      </div>

      {/* Split Settings Drawer */}
      {isSplitModalOpen && (
        <Card style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-highlight)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PieChart size={16} color="#818cf8" /> {isZh ? '自動依比例劃分訓練集與驗證集' : 'Auto-split Train and Val Sets'}
          </h3>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem' }}>{isZh ? '訓練集比例:' : 'Train Ratio:'}</span>
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
                style={{ width: '120px', accentColor: '#818cf8' }}
              />
              <span style={{ fontWeight: 700, color: '#818cf8' }}>{Math.round(trainRatio * 100)}%</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem' }}>{isZh ? '驗證集比例:' : 'Val Ratio:'}</span>
              <span style={{ fontWeight: 700, color: '#06b6d4' }}>{Math.round(valRatio * 100)}%</span>
            </div>

            <Button variant="primary" size="sm" onClick={handleSplitDataset}>
              {isZh ? '確認執行隨機劃分' : 'Confirm Random Split'}
            </Button>
          </div>
        </Card>
      )}

      {/* Image Uploader Component */}
      <ImageUploader onUpload={handleUpload} loading={uploading} />

      {/* Gallery Filter & Actions Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{isZh ? '子集篩選:' : 'Filter:'}</span>
          {['all', 'train', 'val', 'labeled', 'unlabeled'].map((split) => (
            <button
              key={split}
              className={`btn btn-sm ${filterSplit === split ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setFilterSplit(split)}
              style={{
                fontSize: '0.75rem',
                textTransform: 'capitalize',
                borderColor: filterSplit === split ? '#818cf8' : undefined,
              }}
            >
              {split === 'all' && (isZh ? '全部' : 'All')}
              {split === 'train' && (isZh ? '訓練集' : 'Train')}
              {split === 'val' && (isZh ? '驗證集' : 'Val')}
              {split === 'labeled' && (isZh ? '已標註' : 'Labeled')}
              {split === 'unlabeled' && (isZh ? '未標註' : 'Unlabeled')}
            </button>
          ))}
        </div>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {isZh ? `顯示 ${filteredImages.length} / ${images.length} 張圖片` : `Showing ${filteredImages.length} / ${images.length} images`}
        </span>
      </div>

      {/* Images Thumbnail Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          {isZh ? '載入圖片列表中...' : 'Loading images...'}
        </div>
      ) : filteredImages.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)',
          }}
        >
          <FolderSearch size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{isZh ? '資料集中尚無相符圖片' : 'No matching images in dataset'}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
            {isZh ? '您可以點擊上方「匯入資料集 (ZIP)」、拖放照片上傳，或開啟攝影機即時拍攝採集樣本。' : 'You can click "Import Dataset", upload photos by drag-and-drop, or use the camera to collect samples.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '1rem',
            alignItems: 'start',
          }}
        >
          {filteredImages.map((img) => {
            const aspect = (img.width && img.height) ? `${img.width} / ${img.height}` : '16 / 9';
            return (
              <div
                key={img.id}
                style={{
                  position: 'relative',
                  aspectRatio: aspect,
                  background: '#040711',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-card)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
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

                {/* Status Badges */}
                <div style={{ position: 'absolute', top: '6px', left: '6px', display: 'flex', gap: '4px', zIndex: 2 }}>
                  {img.labeled ? (
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.9)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      }}
                    >
                      <CheckCircle2 size={10} /> {img.annotation_count > 0 ? `${img.annotation_count} ${isZh ? '標記' : 'box'}` : (isZh ? '已標' : 'L')}
                    </span>
                  ) : (
                    <span
                      style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: '#94a3b8',
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      }}
                    >
                      {isZh ? '未標註' : 'Unlabeled'}
                    </span>
                  )}

                  {img.split && img.split !== 'unassigned' && (
                    <span
                      style={{
                        background: img.split === 'train' ? 'rgba(99, 102, 241, 0.9)' : 'rgba(6, 182, 212, 0.9)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backdropFilter: 'blur(4px)',
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      }}
                    >
                      {img.split}
                    </span>
                  )}
                </div>

                {/* Delete Button overlay */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteImage(img.filename);
                  }}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'rgba(244, 63, 94, 0.85)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    zIndex: 2,
                  }}
                  title={isZh ? '刪除此圖片' : 'Delete image'}
                >
                  <Trash2 size={12} />
                </button>

                {/* Native Camera Resolution Badge */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '6px',
                    right: '6px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: '#e2e8f0',
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    letterSpacing: '0.02em',
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

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onCaptureImage={handleCameraCapture}
        onClose={() => setIsCameraOpen(false)}
      />
    </div>
  );
};
