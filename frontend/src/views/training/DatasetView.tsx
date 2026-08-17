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
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ImageUploader } from '../../components/dataset/ImageUploader';
import { CameraCaptureModal } from '../../components/dataset/CameraCaptureModal';

export const DatasetView: React.FC = () => {
  const { activeProject, setCurrentView } = useProject();
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
      alert('圖片上傳失敗');
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
    if (confirm(`確定要刪除圖片「${filename}」嗎？`)) {
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
      alert('分割資料集失敗');
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
      setImportSuccessMsg(`🎉 成功匯入 ${res.imported_images} 張圖片與 ${res.imported_annotations} 筆標註資料（總計 ${res.total_images} 張）！`);
      await loadImages();
    } catch (err: any) {
      alert(`匯入失敗: ${err.message || '檔案格式不支援'}`);
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
        <p style={{ color: 'var(--text-muted)' }}>請先在頂部選單選擇或建立一個專案</p>
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
        accept=".zip,.json,.jpg,.jpeg,.png,.webp,.bmp"
        style={{ display: 'none' }}
        onChange={handleImportDataset}
      />

      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            📁 資料集管理中心
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            專案：<span style={{ color: '#818cf8', fontWeight: 600 }}>{activeProject.name}</span> · 匯入/匯出圖片與標註檔、相機拍攝與資料集分割
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Import Button */}
          <Button
            variant="secondary"
            icon={<UploadCloud size={15} />}
            loading={importing}
            onClick={() => importDatasetInputRef.current?.click()}
          >
            匯入資料集 (ZIP / 標註)
          </Button>

          {/* Export Button */}
          <Button
            variant="secondary"
            icon={<Download size={15} />}
            onClick={handleExportDataset}
            disabled={images.length === 0}
          >
            匯出資料集 (ZIP)
          </Button>

          {/* Camera Button */}
          <Button
            variant="secondary"
            icon={<Camera size={15} />}
            onClick={() => setIsCameraOpen(true)}
          >
            啟動相機拍攝
          </Button>

          {/* Split Button */}
          <Button
            variant="secondary"
            icon={<PieChart size={15} />}
            onClick={() => setIsSplitModalOpen(!isSplitModalOpen)}
          >
            資料集分割
          </Button>

          {/* Annotator Navigation */}
          <Button
            variant="primary"
            icon={<ArrowRight size={15} />}
            onClick={() => setCurrentView('annotator')}
          >
            前往標註工具
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
            <span>{importSuccessMsg}</span>
          </div>
          <button
            onClick={() => setImportSuccessMsg('')}
            style={{ background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            關閉
          </button>
        </div>
      )}

      {/* Dataset Statistics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>總圖片數</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{images.length}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            已標註: <span style={{ color: '#10b981', fontWeight: 600 }}>{labeledCount}</span> / 未標註: {images.length - labeledCount}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>訓練集 (Train)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8' }}>{trainCount}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            佔比 {images.length > 0 ? Math.round((trainCount / images.length) * 100) : 0}%
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>驗證集 (Val)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#06b6d4' }}>{valCount}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            佔比 {images.length > 0 ? Math.round((valCount / images.length) * 100) : 0}%
          </div>
        </Card>
      </div>

      {/* Split Settings Drawer */}
      {isSplitModalOpen && (
        <Card style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-highlight)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PieChart size={16} color="#818cf8" /> 自動依比例劃分訓練集與驗證集
          </h3>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem' }}>訓練集比例:</span>
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
              <span style={{ fontSize: '0.85rem' }}>驗證集比例:</span>
              <span style={{ fontWeight: 700, color: '#06b6d4' }}>{Math.round(valRatio * 100)}%</span>
            </div>

            <Button variant="primary" size="sm" onClick={handleSplitDataset}>
              確認執行隨機劃分
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
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>子集篩選:</span>
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
              {split === 'all' && '全部'}
              {split === 'train' && '訓練集'}
              {split === 'val' && '驗證集'}
              {split === 'labeled' && '已標註'}
              {split === 'unlabeled' && '未標註'}
            </button>
          ))}
        </div>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          顯示 {filteredImages.length} / {images.length} 張圖片
        </span>
      </div>

      {/* Images Thumbnail Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          載入圖片列表中...
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
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>資料集中尚無相符圖片</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
            您可以點擊上方「匯入資料集 (ZIP)」、拖放照片上傳，或開啟攝影機即時拍攝採集樣本。
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1rem',
          }}
        >
          {filteredImages.map((img) => (
            <div
              key={img.id}
              style={{
                position: 'relative',
                aspectRatio: '4/3',
                background: '#0b0f19',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <img
                src={img.url}
                alt={img.filename}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />

              {/* Status Badges */}
              <div style={{ position: 'absolute', top: '6px', left: '6px', display: 'flex', gap: '4px' }}>
                {img.labeled ? (
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.85)',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '3px',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <CheckCircle2 size={10} /> {img.annotation_count > 0 ? `${img.annotation_count} 標記` : '已標'}
                  </span>
                ) : (
                  <span
                    style={{
                      background: 'rgba(0, 0, 0, 0.65)',
                      color: '#94a3b8',
                      fontSize: '0.65rem',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    未標註
                  </span>
                )}

                {img.split && img.split !== 'unassigned' && (
                  <span
                    style={{
                      background: img.split === 'train' ? 'rgba(99, 102, 241, 0.85)' : 'rgba(6, 182, 212, 0.85)',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '3px',
                      backdropFilter: 'blur(4px)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {img.split}
                  </span>
                )}
              </div>

              {/* Delete Button overlay on Hover */}
              <button
                onClick={() => handleDeleteImage(img.filename)}
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
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
                title="刪除此圖片"
              >
                <Trash2 size={12} />
              </button>

              {/* Dimensions info overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '6px',
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.75)',
                  background: 'rgba(0,0,0,0.6)',
                  padding: '1px 4px',
                  borderRadius: '2px',
                }}
              >
                {img.width}×{img.height}
              </div>
            </div>
          ))}
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
