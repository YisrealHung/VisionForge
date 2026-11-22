import React, { useState } from 'react';
import {
  Settings,
  Server,
  Cpu,
  Database,
  Palette,
  Languages,
  CheckCircle2,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Card } from '../../components/common/Card';
import { THEME_REGISTRY } from '../../types';

export const SettingsView: React.FC = () => {
  const { systemHealth, theme, setTheme, language, setLanguage, t } = useProject();
  const [themeFilter, setThemeFilter] = useState<'all' | 'light' | 'dark'>('all');
  const isZh = language === 'zh-TW';

  const filteredThemes = THEME_REGISTRY.filter((item) => {
    if (themeFilter === 'dark') return item.mode === 'dark';
    if (themeFilter === 'light') return item.mode === 'light';
    return true;
  });

  const isOnline = systemHealth?.status === 'online';
  const gpuAvailable = Boolean(systemHealth?.gpu.available);

  return (
    <div className="vf-container">
      <div className="vf-page-header">
        <div className="vf-page-heading">
          <div className="vf-page-eyebrow">
            <Settings size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>{t.navSettings}</span>
          </div>
          <div className="vf-page-title-row">
            <h1 className="vf-page-title">{t.settingsTitle}</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            {t.settingsSubtitle}
          </p>
        </div>
      </div>

      {/* Language Switcher Card */}
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Languages size={16} strokeWidth={1.5} color="var(--text-secondary)" />
            <span>{t.languageCardTitle}</span>
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t.languageCardDesc}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {[
            {
              id: 'zh-TW' as const,
              name: '繁體中文',
              sub: 'Traditional Chinese',
              code: 'ZH-TW',
            },
            {
              id: 'en-US' as const,
              name: 'English (US)',
              sub: 'English Interface',
              code: 'EN-US',
            },
          ].map((item) => {
            const isSelected = language === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setLanguage(item.id)}
                style={{
                  textAlign: 'left',
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--accent-primary-soft)' : 'var(--bg-surface-elevated)',
                  border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'background-color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    className="vf-mono"
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '4px 8px',
                    }}
                  >
                    {item.code}
                  </span>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item.sub}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <CheckCircle2 size={18} strokeWidth={1.5} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Theme & Appearance Switcher */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={16} strokeWidth={1.5} color="var(--text-secondary)" />
              <span>{t.themeCardTitle}</span>
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t.themeCardDesc}
            </p>
          </div>

          <div className="vf-tabs" role="tablist" aria-label={t.themeCardTitle}>
            {[
              { key: 'all', label: `${t.filterAll} (${THEME_REGISTRY.length})` },
              { key: 'light', label: `${t.filterLight} (${THEME_REGISTRY.filter((i) => i.mode === 'light').length})` },
              { key: 'dark', label: `${t.filterDark} (${THEME_REGISTRY.filter((i) => i.mode === 'dark').length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={themeFilter === tab.key}
                className={`vf-tab ${themeFilter === tab.key ? 'active' : ''}`}
                onClick={() => setThemeFilter(tab.key as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {filteredThemes.map((item) => {
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTheme(item.id)}
                style={{
                  textAlign: 'left',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--accent-primary-soft)' : 'var(--bg-surface-elevated)',
                  border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'background-color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Miniature App Wireframe */}
                <div
                  style={{
                    height: '76px',
                    width: '100%',
                    borderRadius: 'var(--radius-sm)',
                    background: item.bgSample,
                    border: '1px solid var(--border-subtle)',
                    overflow: 'hidden',
                    display: 'flex',
                  }}
                >
                  {/* Sidebar rail */}
                  <div
                    style={{
                      width: '44px',
                      height: '100%',
                      background: item.sidebarSample,
                      padding: '8px 6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: item.accentSample }} />
                    <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.22)' }} />
                    <div style={{ width: '75%', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.12)' }} />
                    <div style={{ width: '85%', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.12)' }} />
                  </div>

                  {/* Surface preview */}
                  <div style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ width: '56px', height: '6px', borderRadius: '3px', background: item.mode === 'dark' ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.18)' }} />
                      <div style={{ width: '28px', height: '10px', borderRadius: '4px', background: item.accentSample }} />
                    </div>
                    <div
                      style={{
                        flex: 1,
                        marginTop: '8px',
                        borderRadius: '6px',
                        background: item.cardSample,
                        border: `1px solid ${item.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ width: '48%', height: '6px', borderRadius: '3px', background: item.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)' }} />
                      <div style={{ width: '24%', height: '6px', borderRadius: '3px', background: item.accentSample, opacity: 0.8 }} />
                    </div>
                  </div>
                </div>

                {/* Swatches + Meta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.palette.map((color, idx) => (
                      <span
                        key={idx}
                        title={color}
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: color,
                          border: '1px solid var(--border-strong)',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.tag && <span className="badge badge-neutral">{item.tag}</span>}
                    <span className="badge badge-neutral">
                      {item.mode === 'dark' ? (isZh ? '深色' : 'Dark') : (isZh ? '淺色' : 'Light')}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{isZh ? item.name : item.nameEn}</span>
                      <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>
                        {isZh ? item.nameEn : item.name}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                      {item.description}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={18} strokeWidth={1.5} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Diagnostics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={16} strokeWidth={1.5} color="var(--text-secondary)" />
            <span>{t.backendStatusTitle}</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.connectionStatus}</div>
              <div style={{ fontWeight: 500, fontSize: '14px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', color: isOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                <span className={`vf-status-dot ${isOnline ? 'online' : 'offline'}`} aria-hidden="true" />
                <span>{isOnline ? t.connOnline : t.connOffline}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.version}</div>
              <div className="vf-mono" style={{ fontWeight: 500, fontSize: '14px', marginTop: '4px' }}>
                v{systemHealth?.version || '1.0.0'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.pythonEnv}</div>
              <div className="vf-mono" style={{ fontWeight: 500, fontSize: '14px', marginTop: '4px' }}>
                Python {systemHealth?.python_version || '--'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.osPlatform}</div>
              <div className="vf-mono" style={{ fontWeight: 500, fontSize: '14px', marginTop: '4px' }}>
                {systemHealth?.platform || '--'}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} strokeWidth={1.5} color="var(--text-secondary)" />
            <span>{t.gpuDiagTitle}</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.cudaSupport}</div>
              <div style={{ fontWeight: 500, fontSize: '14px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', color: gpuAvailable ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                <span className={`vf-status-dot ${gpuAvailable ? 'online' : 'warning'}`} aria-hidden="true" />
                <span>{gpuAvailable ? t.cudaAvailable : t.cudaCpuOnly}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.detectedComputeDevice}</div>
              <div className="vf-mono" style={{ fontWeight: 500, fontSize: '14px', marginTop: '4px' }}>
                {systemHealth?.gpu.device || '--'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={16} strokeWidth={1.5} color="var(--text-secondary)" />
          <span>{t.dataStorageTitle}</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t.dbType}</span>
            <span style={{ fontWeight: 500 }}>{t.dbTypeValue}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t.projectStoragePath}</span>
            <code className="vf-mono" style={{ color: 'var(--accent-primary)' }}>./data/projects/</code>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t.annotationCompatibility}</span>
            <span className="vf-mono" style={{ fontWeight: 500 }}>COCO JSON, YOLO TXT</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
