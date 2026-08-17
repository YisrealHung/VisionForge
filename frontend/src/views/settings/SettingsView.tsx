import React from 'react';
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

export const SettingsView: React.FC = () => {
  const { systemHealth, theme, setTheme } = useProject();

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={18} color="#EB7E83" /> 介面外觀風格 (Theme & Aesthetics)
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            即時切換 · 自動保存至本機偏好
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {/* Dark Mode Card */}
          <div
            onClick={() => setTheme('dark')}
            style={{
              padding: '1.15rem',
              borderRadius: 'var(--radius-md)',
              background: theme === 'dark' ? 'rgba(235, 126, 131, 0.12)' : 'var(--bg-surface-elevated)',
              border: `1.5px solid ${theme === 'dark' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              boxShadow: theme === 'dark' ? '0 0 16px rgba(235, 126, 131, 0.22)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              position: 'relative',
            }}
          >
            {/* Mini Visual Preview Mockup */}
            <div
              style={{
                height: '60px',
                borderRadius: 'var(--radius-sm)',
                background: '#141217',
                border: '1px solid rgba(184, 143, 137, 0.25)',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ width: '28px', height: '100%', background: '#1c1921', borderRadius: '4px', border: '1px solid rgba(184,143,137,0.2)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ width: '65%', height: '8px', background: '#EB7E83', borderRadius: '3px' }} />
                <div style={{ width: '40%', height: '6px', background: '#557B86', borderRadius: '3px' }} />
              </div>
              <span style={{ fontSize: '0.65rem', color: '#EB7E83', background: 'rgba(235,126,131,0.2)', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>深色</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(235, 126, 131, 0.18)', color: '#EB7E83', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Moon size={15} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    🌙 煙燻暖岩暗色 (Dark)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    沉穩岩灰底蘊 · 護眼溫潤低刺激
                  </div>
                </div>
              </div>
              {theme === 'dark' && <CheckCircle2 size={18} color="#EB7E83" />}
            </div>
          </div>

          {/* Light Mode Card */}
          <div
            onClick={() => setTheme('light')}
            style={{
              padding: '1.15rem',
              borderRadius: 'var(--radius-md)',
              background: theme === 'light' ? 'rgba(219, 102, 108, 0.1)' : 'var(--bg-surface-elevated)',
              border: `1.5px solid ${theme === 'light' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              boxShadow: theme === 'light' ? '0 0 16px rgba(219, 102, 108, 0.2)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              position: 'relative',
            }}
          >
            {/* Mini Visual Preview Mockup */}
            <div
              style={{
                height: '60px',
                borderRadius: 'var(--radius-sm)',
                background: '#f9f6f4',
                border: '1px solid rgba(161, 120, 114, 0.25)',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ width: '28px', height: '100%', background: '#ffffff', borderRadius: '4px', border: '1px solid rgba(161,120,114,0.2)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ width: '65%', height: '8px', background: '#db666c', borderRadius: '3px' }} />
                <div style={{ width: '40%', height: '6px', background: '#436a75', borderRadius: '3px' }} />
              </div>
              <span style={{ fontSize: '0.65rem', color: '#db666c', background: 'rgba(219,102,108,0.15)', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>預設</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(225, 153, 138, 0.22)', color: '#cf7c6a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sun size={15} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    ☀️ 溫潤燕麥亮色 (Light)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    自然亞麻白底 · 清爽通透雜誌感
                  </div>
                </div>
              </div>
              {theme === 'light' && <CheckCircle2 size={18} color="#db666c" />}
            </div>
          </div>
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
