import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2 } from 'lucide-react';

interface TerminalLoggerProps {
  logs: string[];
  onClear?: () => void;
  height?: number;
}

export const TerminalLogger: React.FC<TerminalLoggerProps> = ({ logs, onClear, height = 220 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      style={{
        background: '#070a10',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Terminal Title Bar */}
      <div
        style={{
          height: '32px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Terminal size={13} color="#818cf8" />
          <span>即時訓練終端輸出 (Terminal Log)</span>
        </div>

        {onClear && logs.length > 0 && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClear}
            style={{ fontSize: '0.7rem', padding: '2px 6px', color: 'var(--text-muted)' }}
            title="清除記錄"
          >
            <Trash2 size={12} /> 清除
          </button>
        )}
      </div>

      {/* Terminal Output Body */}
      <div
        ref={scrollRef}
        style={{
          height: `${height}px`,
          padding: '0.75rem 1rem',
          overflowY: 'auto',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.78rem',
          lineHeight: '1.6',
          color: '#cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#475569', fontStyle: 'italic' }}>
            尚未啟動訓練，即時訓練終端訊息將會在此顯示...
          </div>
        ) : (
          logs.map((line, idx) => {
            const isError = line.includes('❌') || line.includes('Error');
            const isSuccess = line.includes('🎉') || line.includes('完成');
            const isBest = line.includes('New Best');
            const isWarn = line.includes('⚠️');

            let color = '#e2e8f0';
            if (isError) color = '#fda4af';
            else if (isSuccess || isBest) color = '#6ee7b7';
            else if (isWarn) color = '#fcd34d';

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
