import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';

interface ImageUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  loading?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload, loading = false }) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const validFiles: File[] = [];
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      if (validExtensions.includes(f.type) || f.name.match(/\.(jpg|jpeg|png|webp|bmp)$/i)) {
        validFiles.push(f);
      }
    }

    if (validFiles.length > 0) {
      await onUpload(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragOver ? 'var(--accent-primary)' : 'var(--border-card)'}`,
        background: dragOver ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-glass-card)',
        borderRadius: 'var(--radius-md)',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.85rem',
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        multiple
        accept="image/jpeg,image/png,image/webp,image/bmp"
        style={{ display: 'none' }}
      />

      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.15)',
          color: '#818cf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <UploadCloud size={26} />
      </div>

      <div>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          拖放圖片至此處，或 <span style={{ color: '#818cf8', textDecoration: 'underline' }}>點擊瀏覽檔案</span>
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          支援 JPG, PNG, WebP, BMP 格式 · 支援多檔案與資料夾批次匯入
        </p>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={loading}
        icon={<ImageIcon size={14} />}
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
      >
        選擇本地圖片
      </Button>
    </div>
  );
};
