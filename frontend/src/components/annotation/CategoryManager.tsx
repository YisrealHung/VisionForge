import React, { useState } from 'react';
import { Plus, Trash2, Tag, Check } from 'lucide-react';
import { CategoryItem } from '../../types';
import { Button } from '../common/Button';

interface CategoryManagerProps {
  categories: CategoryItem[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number) => void;
  onAddCategory: (name: string, color?: string) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
}

const COLOR_PALETTE = [
  '#EB7E83', '#E1998A', '#B88F89', '#557B86', '#52495A', 
  '#67a390', '#c27d92', '#8da399', '#d49b7a', '#7895a2'
];

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
}) => {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Tag size={15} color="#EB7E83" /> 標註類別清單 ({categories.length})
        </h4>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setIsAdding(!isAdding)}
          style={{ fontSize: '0.75rem', padding: '2px 8px', color: '#EB7E83' }}
        >
          <Plus size={13} /> {isAdding ? '取消' : '新增類別'}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAdd}
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-highlight)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <input
            type="text"
            className="form-input"
            placeholder="類別名稱 (如：正常品、刮痕瑕疵、人、車)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            autoFocus
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {COLOR_PALETTE.map((c) => (
              <div
                key={c}
                onClick={() => setPickedColor(c)}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: c,
                  cursor: 'pointer',
                  border: pickedColor === c ? '2px solid white' : '1px solid transparent',
                  boxShadow: pickedColor === c ? '0 0 8px ' + c : 'none',
                }}
              />
            ))}
          </div>

          <Button type="submit" variant="primary" size="sm" style={{ width: '100%', marginTop: '4px' }}>
            確定新增標籤
          </Button>
        </form>
      )}

      {/* Categories List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '240px', overflowY: 'auto' }}>
        {categories.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.25rem 0.5rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-subtle)' }}>
            尚未建立標籤類別<br/>
            <span style={{ fontSize: '0.72rem', color: '#818cf8' }}>點擊右上角「新增類別」自訂標籤</span>
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
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? `${cat.color}25` : 'var(--bg-surface-elevated)',
                  border: `1px solid ${isSelected ? cat.color : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: cat.color,
                      boxShadow: `0 0 6px ${cat.color}`,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cat.name}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    ({idx + 1})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  {isSelected && <Check size={14} color={cat.color} />}
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '3px 5px', color: '#94a3b8', borderRadius: '3px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCategory(cat.id);
                    }}
                    title={`刪除標籤「${cat.name}」`}
                  >
                    <Trash2 size={13} />
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
