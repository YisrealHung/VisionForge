import React, { useState } from 'react';
import { Plus, Trash2, Tag, Check } from 'lucide-react';
import { CategoryItem } from '../../types';
import { Button } from '../common/Button';
import { useProject } from '../../context/ProjectContext';

interface CategoryManagerProps {
  categories: CategoryItem[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number) => void;
  onAddCategory: (name: string, color?: string) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
}

const COLOR_PALETTE = [
  '#1d5fd6', '#15803d', '#c24914', '#b02555', '#0e7490',
  '#b45309', '#4f46e5', '#0f766e', '#be185d', '#475569',
];

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
}) => {
  const { language } = useProject();
  const isZh = language === 'zh-TW';
  const [newCatName, setNewCatName] = useState('');
  const [pickedColor, setPickedColor] = useState(COLOR_PALETTE[0]);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await onAddCategory(newCatName.trim(), pickedColor);
    setNewCatName('');
    setIsAdding(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 className="vf-num" style={{ fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={15} strokeWidth={1.5} color="var(--text-secondary)" />
          <span>{isZh ? `類別標籤 (${categories.length})` : `Classes (${categories.length})`}</span>
        </h4>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setIsAdding(!isAdding)}
          style={{ height: '28px', padding: '0 8px', fontSize: '12px', color: 'var(--accent-primary)' }}
        >
          <Plus size={14} strokeWidth={1.5} /> {isAdding ? (isZh ? '取消' : 'Cancel') : (isZh ? '新增' : 'Add')}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAdd}
          style={{
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-strong)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <input
            type="text"
            className="form-input"
            placeholder={isZh ? '類別名稱（如：良品、刮痕）' : 'Class name (e.g. Pass, Scratch)'}
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            autoFocus
            style={{ fontSize: '13px', padding: '6px 10px' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setPickedColor(c)}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: c,
                  cursor: 'pointer',
                  border: pickedColor === c ? '2px solid var(--text-primary)' : '1px solid transparent',
                  outline: pickedColor === c ? '2px solid var(--bg-surface)' : 'none',
                  outlineOffset: '-3px',
                }}
              />
            ))}
          </div>

          <Button type="submit" variant="primary" size="sm" style={{ width: '100%' }}>
            {isZh ? '確定新增標籤' : 'Create class'}
          </Button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '240px', overflowY: 'auto' }}>
        {categories.length === 0 ? (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '16px 8px',
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--border-subtle)',
            }}
          >
            {isZh ? '尚未建立類別，點擊右上角「新增」自訂標籤' : 'No classes yet. Click Add above to create one'}
          </div>
        ) : (
          categories.map((cat, idx) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: '36px',
                  padding: '0 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)',
                  border: `1.5px solid ${isSelected ? cat.color : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'background-color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: cat.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: isSelected ? 500 : 400,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {cat.name}
                  </span>
                  <span className="vf-num" style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {idx + 1}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  {isSelected && <Check size={14} strokeWidth={1.75} color={cat.color} />}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ width: '24px', height: '24px', padding: 0, color: 'var(--text-muted)', borderRadius: '4px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCategory(cat.id);
                    }}
                    title={isZh ? `刪除標籤「${cat.name}」` : `Delete "${cat.name}"`}
                    aria-label={isZh ? `刪除標籤 ${cat.name}` : `Delete ${cat.name}`}
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
