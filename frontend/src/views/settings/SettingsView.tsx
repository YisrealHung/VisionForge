import React, { useState } from 'react';
import { 
  Settings, 
  Server, 
  Cpu, 
  Database, 
  Palette, 
  Moon, 
  Sun, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Card } from '../../components/common/Card';
import { THEME_REGISTRY } from '../../types';

export const SettingsView: React.FC = () => {
  const { systemHealth, theme, setTheme } = useProject();
  const [themeFilter, setThemeFilter] = useState<'all' | 'palette' | 'dark' | 'light'>('all');

  const filteredThemes = THEME_REGISTRY.filter((t) => {
    if (themeFilter === 'palette') return t.category === 'palette';
    if (themeFilter === 'dark') return t.mode === 'dark';
    if (themeFilter === 'light') return t.mode === 'light';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          ⚙️ 系統設定與診斷
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          介面風格切換、本地後端運行狀態、硬體算力環境與系統儲存路徑
        </p>
      </div>

      {/* Theme & Appearance Switcher */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={20} color="var(--accent-primary)" /> 介面外觀風格 (Theme & Aesthetics)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              共 10 款特調主題 · 包含依您提供色票特調與現代專業設計推薦 · 即時切換自動儲存
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface-elevated)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            {[
              { key: 'all', label: '全部 (10)' },
              { key: 'palette', label: '🎨 色票特調 (4)' },
              { key: 'dark', label: '🌙 深色 (5)' },
              { key: 'light', label: '☀️ 淺色 (5)' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setThemeFilter(tab.key as any)}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: themeFilter === tab.key ? 700 : 500,
                  borderRadius: 'var(--radius-xs)',
                  background: themeFilter === tab.key ? 'var(--accent-primary)' : 'transparent',
                  color: themeFilter === tab.key ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {filteredThemes.map((item) => {
            const isSelected = theme === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setTheme(item.id)}
                style={{
                  padding: '1.15rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--accent-primary-glow)' : 'var(--bg-surface-elevated)',
                  border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-highlight)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                {/* Mini Visual Preview Mockup Box */}
                <div
                  style={{
                    height: '68px',
                    borderRadius: 'var(--radius-sm)',
                    background: item.bgSample,
                    border: `1px solid ${isSelected ? 'var(--border-highlight)' : 'var(--border-subtle)'}`,
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: item.mode === 'dark' ? 'inset 0 0 12px rgba(0,0,0,0.5)' : 'inset 0 0 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '100%',
                      background: item.cardSample,
                      borderRadius: '4px',
                      border: '1px solid rgba(128,128,128,0.2)',
                    }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ width: '70%', height: '8px', background: item.accentSample, borderRadius: '3px' }} />
                    <div style={{ width: '45%', height: '6px', background: item.palette[1] || item.accentSample, borderRadius: '3px', opacity: 0.8 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        color: item.accentSample,
                        background: `${item.accentSample}22`,
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        border: `1px solid ${item.accentSample}44`,
                      }}
                    >
                      {item.mode === 'dark' ? '🌙 深色' : '☀️ 淺色'}
                    </span>
                    {item.tag && (
                      <span
                        style={{
                          fontSize: '0.6rem',
                          color: 'var(--text-muted)',
                          padding: '1px 4px',
                        }}
                      >
                        {item.tag}
                      </span>
                    )}
                  </div>
                </div>

                {/* Color Swatch Dots */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {item.palette.map((color, idx) => (
                      <div
                        key={idx}
                        title={color}
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: color,
                          border: '1.5px solid rgba(255,255,255,0.4)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {item.categoryLabel}
                  </span>
                </div>

                {/* Theme Title & Meta */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {item.name}
                      <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                        {item.nameEn}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.35 }}>
                      {item.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }}>
                      <CheckCircle2 size={20} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Backend Status Card */}
      <Card>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={18} color="#EB7E83" /> 後端服務狀態
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>連線狀態</div>
            <div style={{ fontWeight: 600, color: systemHealth?.status === 'online' ? '#67a390' : '#EB7E83' }}>
              {systemHealth?.status === 'online' ? '🟢 正常連線中 (Online)' : '🔴 連線中斷 (Offline)'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>版本</div>
            <div style={{ fontWeight: 600 }}>v{systemHealth?.version || '1.0.0'}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Python 執行環境</div>
            <div style={{ fontWeight: 600 }}>Python {systemHealth?.python_version}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>作業系統平臺</div>
            <div style={{ fontWeight: 600 }}>{systemHealth?.platform}</div>
          </div>
        </div>
      </Card>

      {/* GPU Diagnostic Card */}
      <Card>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={18} color="#557B86" /> GPU 加速診斷
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CUDA 加速支援</div>
            <div style={{ fontWeight: 600, color: systemHealth?.gpu.available ? '#67a390' : '#E1998A' }}>
              {systemHealth?.gpu.available ? '🟢 支援 CUDA 加速' : '🟡 僅使用 CPU (未啟用 CUDA)'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>偵測到的運算裝置</div>
            <div style={{ fontWeight: 600 }}>{systemHealth?.gpu.device}</div>
          </div>
        </div>
      </Card>

      {/* Data Storage Card */}
      <Card>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} color="#67a390" /> 資料儲存設定
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)' }}>資料庫類型</span>
            <span style={{ fontWeight: 600 }}>SQLite 3 (本地獨立檔案)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)' }}>專案儲存路徑</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-accent)' }}>./data/projects/</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span style={{ color: 'var(--text-muted)' }}>標註格式相容性</span>
            <span style={{ fontWeight: 600 }}>COCO JSON, YOLO TXT</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
