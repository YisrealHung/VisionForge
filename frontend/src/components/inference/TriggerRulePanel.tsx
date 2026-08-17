import React, { useState } from 'react';
import { BellRing, Plus, Trash2, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Radio, Layers, Hash } from 'lucide-react';
import { TriggerRule, TriggerEvent } from '../../types';
import { Button } from '../common/Button';

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
  const [isAdding, setIsAdding] = useState(false);
  const [selectedClass, setSelectedClass] = useState(availableCategories[0] || '全部類別');
  const [threshold, setThreshold] = useState(40);
  const [conditionType, setConditionType] = useState<'present' | 'count_gte' | 'absent'>('present');
  const [minCount, setMinCount] = useState(1);
  const [actionType, setActionType] = useState('alert');

  const categoryOptions = ['全部類別', ...availableCategories.filter((c) => c !== '全部類別')];

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Rules Configuration Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BellRing size={16} color="#f59e0b" />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>條件觸發規則 (Trigger Rules)</h4>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<Plus size={13} />}
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? '取消' : '新增規則'}
        </Button>
      </div>

      {/* Add Rule Form */}
      {isAdding && (
        <div
          style={{
            padding: '1rem',
            background: 'var(--bg-base)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
            {/* Target Class */}
            <div className="form-group">
              <label className="form-label">監聽類別 (Target Class)</label>
              <select
                className="form-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                {categoryOptions.map((c, i) => (
                  <option key={i} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition Type */}
            <div className="form-group">
              <label className="form-label">觸發條件 (Condition)</label>
              <select
                className="form-select"
                value={conditionType}
                onChange={(e) => setConditionType(e.target.value as any)}
              >
                <option value="present">🎯 只要偵測到 (出現 ≥ 1)</option>
                <option value="count_gte">📦 數量達標 (數量 ≥ N)</option>
                <option value="absent">🚨 缺失警報 (未偵測到 / 缺件)</option>
              </select>
            </div>

            {/* Count Input when condition is count_gte */}
            {conditionType === 'count_gte' && (
              <div className="form-group">
                <label className="form-label">目標數量門檻 (Min Count)</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={100}
                  value={minCount}
                  onChange={(e) => setMinCount(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            )}

            {/* Confidence Threshold */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="form-label">信心度門檻 (Confidence)</label>
                <strong style={{ color: '#f59e0b' }}>≥ {threshold}%</strong>
              </div>
              <input
                type="range"
                min={1}
                max={99}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              取消
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateRule}>
              確認建立規則
            </Button>
          </div>
        </div>
      )}

      {/* Active Rules List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {rules.length === 0 ? (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
            尚未設定觸發規則，可點擊上方按鈕自訂類別與數量告警條件。
          </div>
        ) : (
          rules.map((r) => {
            const conditionLabel = 
              r.condition_type === 'count_gte' 
                ? `數量 ≥ ${r.min_count || 1} 個` 
                : (r.condition_type === 'absent' ? '未偵測到 (缺失)' : '出現目標');

            return (
              <div
                key={r.id}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: r.enabled ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-base)',
                  border: `1px solid ${r.enabled ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={() => onToggleRule(r.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, color: r.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      類別「{r.class_name}」· {conditionLabel}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                      (信心度 ≥ {r.min_confidence}%)
                    </span>
                  </div>
                </div>

                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => onDeleteRule(r.id)}
                  style={{ color: 'var(--text-muted)', padding: '2px 6px' }}
                  title="刪除規則"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Trigger Event Log Feed */}
      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            <Clock size={13} /> 觸發事件記錄 ({events.length})
          </div>
          {events.length > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onClearEvents}
              style={{ fontSize: '0.7rem', padding: '2px 6px', color: 'var(--text-muted)' }}
            >
              清除紀錄
            </button>
          )}
        </div>

        <div
          style={{
            maxHeight: '160px',
            overflowY: 'auto',
            background: 'var(--bg-base)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            padding: '0.6rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: '0.75rem',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {events.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
              暫無觸發事件，符合規則時將在此即時推播...
            </div>
          ) : (
            events.map((ev, idx) => (
              <div
                key={idx}
                style={{
                  color: '#fda4af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(244, 63, 94, 0.08)',
                  padding: '3px 6px',
                  borderRadius: '3px',
                }}
              >
                <span>[{ev.timestamp}] {ev.message}</span>
                {ev.confidence > 0 && (
                  <span style={{ fontWeight: 700, marginLeft: '6px' }}>{ev.confidence.toFixed(1)}%</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
