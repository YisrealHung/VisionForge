import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';
import { Button } from '../common/Button';
import { useProject } from '../../context/ProjectContext';

interface ImageUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  loading?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload, loading = false }) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language } = useProject();
  const isZh = language === 'zh-TW';

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
          {isZh
            ? <>拖放圖片至此處，或 <span style={{ color: '#818cf8', textDecoration: 'underline' }}>點擊瀏覽檔案</span></>
            : <>Drag & drop images here, or <span style={{ color: '#818cf8', textDecoration: 'underline' }}>click to browse</span></>
          }
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {isZh
            ? 'JPG, PNG, WebP, BMP · 支援多檔案批次匯入'
            : 'JPG, PNG, WebP, BMP · Supports batch import'}
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
        {isZh ? '選擇本地圖片' : 'Select Images'}
      </Button>
    </div>
  );
};
