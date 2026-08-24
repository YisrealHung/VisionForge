import React, { useState } from 'react';
import { BellRing, Plus, Trash2, Clock } from 'lucide-react';
import { TriggerRule, TriggerEvent } from '../../types';
import { Button } from '../common/Button';
import { useProject } from '../../context/ProjectContext';

interface TriggerRulePanelProps {
  rules: TriggerRule[];
  events: TriggerEvent[];
  availableCategories: string[];
  onAddRule: (rule: TriggerRule) => void;
  onToggleRule: (ruleId: string) => void;
  onDeleteRule: (ruleId: string) => void;
  onClearEvents: () => void;
}

export const TriggerRulePanel: React.FC<TriggerRulePanelProps> = ({
  rules,
  events,
  availableCategories,
  onAddRule,
  onToggleRule,
  onDeleteRule,
  onClearEvents,
}) => {
  const { language } = useProject();
  const isZh = language === 'zh-TW';

  const ALL_LABEL = isZh ? '全部類別' : 'All Classes';
  const [isAdding, setIsAdding] = useState(false);
  const [selectedClass, setSelectedClass] = useState(availableCategories[0] || ALL_LABEL);
  const [threshold, setThreshold] = useState(40);
  const [conditionType, setConditionType] = useState<'present' | 'count_gte' | 'absent'>('present');
  const [minCount, setMinCount] = useState(1);
  const [actionType] = useState('alert');

  const categoryOptions = [ALL_LABEL, ...availableCategories.filter((c) => c !== ALL_LABEL && c !== '全部類別')];

  const handleCreateRule = () => {
    const newRule: TriggerRule = {
      id: `rule_${Date.now()}`,
      class_name: selectedClass,
      min_confidence: threshold,
      enabled: true,
      action_type: actionType,
      condition_type: conditionType,
      min_count: minCount,
    };
    onAddRule(newRule);
    setIsAdding(false);
  };

  const getConditionLabel = (r: TriggerRule) => {
    if (r.condition_type === 'count_gte') return isZh ? `數量 ≥ ${r.min_count || 1} 個` : `Count ≥ ${r.min_count || 1}`;
    if (r.condition_type === 'absent') return isZh ? '未偵測到 (缺失)' : 'Not detected (absent)';
    return isZh ? '出現目標' : 'Target detected';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BellRing size={16} color="#f59e0b" />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
            {isZh ? '條件觸發規則 (Trigger Rules)' : 'Trigger Rules'}
          </h4>
        </div>
        <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? (isZh ? '取消' : 'Cancel') : (isZh ? '新增規則' : 'Add Rule')}
        </Button>
      </div>

      {isAdding && (
        <div style={{ padding: '1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">{isZh ? '監聽類別 (Target Class)' : 'Target Class'}</label>
              <select className="form-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                {categoryOptions.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{isZh ? '觸發條件 (Condition)' : 'Condition'}</label>
              <select className="form-select" value={conditionType} onChange={(e) => setConditionType(e.target.value as any)}>
                <option value="present">{isZh ? '🎯 只要偵測到 (出現 ≥ 1)' : '🎯 Detected (≥ 1 occurrence)'}</option>
                <option value="count_gte">{isZh ? '📦 數量達標 (數量 ≥ N)' : '📦 Count reached (≥ N)'}</option>
                <option value="absent">{isZh ? '🚨 缺失警報 (未偵測到 / 缺件)' : '🚨 Absence alert (not detected)'}</option>
              </select>
            </div>

            {conditionType === 'count_gte' && (
              <div className="form-group">
                <label className="form-label">{isZh ? '目標數量門檻 (Min Count)' : 'Min Count'}</label>
                <input type="number" className="form-input" min={1} max={100} value={minCount} onChange={(e) => setMinCount(Math.max(1, parseInt(e.target.value) || 1))} />
              </div>
            )}

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="form-label">{isZh ? '信心度門檻 (Confidence)' : 'Confidence Threshold'}</label>
                <strong style={{ color: '#f59e0b' }}>≥ {threshold}%</strong>
              </div>
              <input type="range" min={1} max={99} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} style={{ width: '100%', accentColor: '#f59e0b' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              {isZh ? '取消' : 'Cancel'}
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateRule}>
              {isZh ? '確認建立規則' : 'Create Rule'}
            </Button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {rules.length === 0 ? (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
            {isZh ? '尚未設定觸發規則，可點擊上方按鈕自訂類別與數量告警條件。' : 'No trigger rules set. Click the button above to add custom alert conditions.'}
          </div>
        ) : (
          rules.map((r) => (
            <div key={r.id} style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: r.enabled ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-base)', border: `1px solid ${r.enabled ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={r.enabled} onChange={() => onToggleRule(r.id)} style={{ cursor: 'pointer' }} />
                <div>
                  <span style={{ fontWeight: 600, color: r.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {isZh ? `類別「${r.class_name}」· ${getConditionLabel(r)}` : `Class "${r.class_name}" · ${getConditionLabel(r)}`}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                    ({isZh ? '信心度' : 'Conf'} ≥ {r.min_confidence}%)
                  </span>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => onDeleteRule(r.id)} style={{ color: 'var(--text-muted)', padding: '2px 6px' }} title={isZh ? '刪除規則' : 'Delete rule'}>
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            <Clock size={13} /> {isZh ? `觸發事件記錄 (${events.length})` : `Trigger Event Log (${events.length})`}
          </div>
          {events.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={onClearEvents} style={{ fontSize: '0.7rem', padding: '2px 6px', color: 'var(--text-muted)' }}>
              {isZh ? '清除紀錄' : 'Clear'}
            </button>
          )}
        </div>

        <div style={{ maxHeight: '160px', overflowY: 'auto', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace" }}>
          {events.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {isZh ? '暫無觸發事件，符合規則時將在此即時推播...' : 'No events yet. Matching events will appear here in real time...'}
            </div>
          ) : (
            events.map((ev, idx) => (
              <div key={idx} style={{ color: '#fda4af', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(244, 63, 94, 0.08)', padding: '3px 6px', borderRadius: '3px' }}>
                <span>[{ev.timestamp}] {ev.message}</span>
                {ev.confidence > 0 && <span style={{ fontWeight: 700, marginLeft: '6px' }}>{ev.confidence.toFixed(1)}%</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
