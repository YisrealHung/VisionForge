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
      className="vf-reticle"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      style={{
        border: `1px dashed ${dragOver ? 'var(--accent-primary)' : 'var(--border-strong)'}`,
        backgroundColor: dragOver ? 'var(--accent-primary-soft)' : 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        padding: '32px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}
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
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-sm)',
          background: dragOver ? 'var(--accent-primary-soft)' : 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          color: dragOver ? 'var(--accent-primary)' : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <UploadCloud size={20} strokeWidth={1.5} />
      </div>

      <div>
        <h4 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px', color: 'var(--text-primary)' }}>
          {isZh ? (
            <>
              拖放圖片至此處，或{' '}
              <span style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>點擊瀏覽檔案</span>
            </>
          ) : (
            <>
              Drag & drop images here, or{' '}
              <span style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>browse files</span>
            </>
          )}
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {isZh ? 'JPG, PNG, WebP, BMP · 支援多檔案批次匯入' : 'JPG, PNG, WebP, BMP · Batch import supported'}
        </p>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={loading}
        icon={<ImageIcon size={14} strokeWidth={1.5} />}
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
      >
        {isZh ? '選擇本機圖片' : 'Select images'}
      </Button>
    </div>
  );
};
