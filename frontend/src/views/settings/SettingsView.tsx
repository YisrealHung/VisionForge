import React, { useState } from 'react';
import { 
  Settings, 
  Server, 
  Cpu, 
  Database, 
  Palette, 
  Languages,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Card } from '../../components/common/Card';
import { THEME_REGISTRY } from '../../types';

export const SettingsView: React.FC = () => {
  const { systemHealth, theme, setTheme, language, setLanguage, t } = useProject();
  const [themeFilter, setThemeFilter] = useState<'all' | 'light' | 'dark'>('all');

  const filteredThemes = THEME_REGISTRY.filter((t) => {
    if (themeFilter === 'dark') return t.mode === 'dark';
    if (themeFilter === 'light') return t.mode === 'light';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          {t.settingsTitle}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {t.settingsSubtitle}
        </p>
      </div>

      {/* Language Switcher Card */}
      <Card>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Languages size={20} color="var(--accent-primary)" /> {t.languageCardTitle}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {t.languageCardDesc}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {[
            {
              id: 'zh-TW' as const,
              name: '繁體中文 (Traditional Chinese)',
              sub: '繁體中文介面語系',
              icon: '🇹🇼',
            },
            {
              id: 'en-US' as const,
              name: 'English (US)',
              sub: 'English Interface',
              icon: '🇺🇸',
            },
          ].map((item) => {
            const isSelected = language === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setLanguage(item.id)}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--accent-primary-glow)' : 'var(--bg-surface-elevated)',
                  border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-highlight)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.6rem' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.sub}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>
                    <CheckCircle2 size={22} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </Card>

      {/* Theme & Appearance Switcher */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={20} color="var(--accent-primary)" /> {t.themeCardTitle}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t.themeCardDesc}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface-elevated)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            {[
              { key: 'all', label: `${t.filterAll} (${THEME_REGISTRY.length})` },
              { key: 'light', label: `${t.filterLight} (${THEME_REGISTRY.filter(t => t.mode === 'light').length})` },
              { key: 'dark', label: `${t.filterDark} (${THEME_REGISTRY.filter(t => t.mode === 'dark').length})` },
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
                    height: '72px',
                    borderRadius: 'var(--radius-sm)',
                    background: item.bgSample,
                    border: `1px solid ${isSelected ? 'var(--border-highlight)' : 'var(--border-subtle)'}`,
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: item.mode === 'dark' ? 'inset 0 0 14px rgba(0,0,0,0.5)' : 'inset 0 0 10px rgba(0,0,0,0.05)',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '100%',
                      background: item.cardSample,
                      borderRadius: '4px',
                      border: '1px solid rgba(128,128,128,0.25)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '10px',
                        borderRadius: '4px',
                        background: `linear-gradient(90deg, ${item.palette[0]} 0%, ${item.palette[1]} 50%, ${item.palette[2]} 100%)`,
                        border: '1px solid rgba(128,128,128,0.2)',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <div style={{ width: '40%', height: '6px', background: item.accentSample, borderRadius: '3px' }} />
                      <div style={{ width: '30%', height: '6px', background: item.palette[1], borderRadius: '3px', opacity: 0.8 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
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
                      {item.mode === 'dark' ? (language === 'zh-TW' ? '🌙 深色' : '🌙 Dark') : (language === 'zh-TW' ? '☀️ 淺色' : '☀️ Light')}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.palette.map((color, idx) => (
                      <div
                        key={idx}
                        title={`Color ${idx + 1}: ${color}`}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: color,
                          border: '1.5px solid rgba(128,128,128,0.3)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {language === 'zh-TW' ? item.categoryLabel : (item.mode === 'light' ? 'Light Theme' : 'Dark Theme')}
                  </span>
                </div>

                {/* Theme Title & Meta */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {language === 'zh-TW' ? item.name : item.nameEn}
                      <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                        {language === 'zh-TW' ? item.nameEn : item.name}
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
          <Server size={18} color="var(--accent-primary)" /> {t.backendStatusTitle}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.connectionStatus}</div>
            <div style={{ fontWeight: 600, color: systemHealth?.status === 'online' ? '#67a390' : 'var(--accent-peach)' }}>
              {systemHealth?.status === 'online' ? t.connOnline : t.connOffline}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.version}</div>
            <div style={{ fontWeight: 600 }}>v{systemHealth?.version || '1.0.0'}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.pythonEnv}</div>
            <div style={{ fontWeight: 600 }}>Python {systemHealth?.python_version}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.osPlatform}</div>
            <div style={{ fontWeight: 600 }}>{systemHealth?.platform}</div>
          </div>
        </div>
      </Card>

      {/* GPU Diagnostic Card */}
      <Card>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={18} color="var(--accent-primary)" /> {t.gpuDiagTitle}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.cudaSupport}</div>
            <div style={{ fontWeight: 600, color: systemHealth?.gpu.available ? '#67a390' : 'var(--accent-peach)' }}>
              {systemHealth?.gpu.available ? t.cudaAvailable : t.cudaCpuOnly}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.detectedComputeDevice}</div>
            <div style={{ fontWeight: 600 }}>{systemHealth?.gpu.device}</div>
          </div>
        </div>
      </Card>

      {/* Data Storage Card */}
      <Card>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} color="var(--accent-primary)" /> {t.dataStorageTitle}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t.dbType}</span>
            <span style={{ fontWeight: 600 }}>{t.dbTypeValue}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t.projectStoragePath}</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-accent)' }}>./data/projects/</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t.annotationCompatibility}</span>
            <span style={{ fontWeight: 600 }}>COCO JSON, YOLO TXT</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
