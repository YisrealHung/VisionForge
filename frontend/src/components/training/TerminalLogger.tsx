import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface TerminalLoggerProps {
  logs: string[];
  onClear?: () => void;
  height?: number;
}

export const TerminalLogger: React.FC<TerminalLoggerProps> = ({ logs, onClear, height = 220 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { language } = useProject();
  const isZh = language === 'zh-TW';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      style={{
        background: 'var(--canvas-bg)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--canvas-border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: '36px',
          background: 'var(--canvas-surface)',
          borderBottom: '1px solid var(--canvas-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--canvas-muted)', fontWeight: 500 }}>
          <Terminal size={14} strokeWidth={1.5} color="var(--canvas-muted)" />
          <span>{isZh ? '訓練終端輸出' : 'Training terminal log'}</span>
        </div>

        {onClear && logs.length > 0 && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClear}
            style={{ height: '24px', fontSize: '12px', padding: '0 8px', color: 'var(--canvas-muted)' }}
            title={isZh ? '清除記錄' : 'Clear logs'}
          >
            <Trash2 size={12} strokeWidth={1.5} /> {isZh ? '清除' : 'Clear'}
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="vf-mono"
        style={{
          height: `${height}px`,
          padding: '12px 16px',
          overflowY: 'auto',
          fontSize: '12px',
          lineHeight: 1.6,
          color: 'var(--canvas-text)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: 'var(--canvas-muted)' }}>
            {isZh ? '尚未啟動訓練，即時訓練輸出將顯示於此…' : 'Training has not started yet. Real-time logs will appear here…'}
          </div>
        ) : (
          logs.map((line, idx) => {
            const isError = line.includes('❌') || line.includes('Error');
            const isSuccess = line.includes('🎉') || line.includes('完成') || line.includes('Done');
            const isBest = line.includes('New Best');
            const isWarn = line.includes('⚠️');

            let color = 'var(--canvas-text)';
            if (isError) color = '#f87171';
            else if (isSuccess || isBest) color = '#4cc38a';
            else if (isWarn) color = '#e5a93c';

            return (
              <div key={idx} style={{ color }}>
                {line}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
