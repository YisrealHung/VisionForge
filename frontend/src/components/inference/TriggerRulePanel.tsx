import React, { useState } from 'react';
import { BellRing, Plus, Trash2, Clock } from 'lucide-react';
import { TriggerRule, TriggerEvent, ALL_CLASSES, isAllClasses } from '../../types';
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

  const ALL_LABEL = isZh ? '全部類別' : 'All classes';
  const displayClass = (name: string) => (isAllClasses(name) ? ALL_LABEL : name);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedClass, setSelectedClass] = useState(availableCategories[0] || ALL_CLASSES);
  const [threshold, setThreshold] = useState(40);
  const [conditionType, setConditionType] = useState<'present' | 'count_gte' | 'absent'>('present');
  const [minCount, setMinCount] = useState(1);
  const [actionType] = useState('alert');

  const categoryOptions = [ALL_CLASSES, ...availableCategories.filter((c) => !isAllClasses(c))];

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
    if (r.condition_type === 'count_gte') return isZh ? `數量 ≥ ${r.min_count || 1}` : `Count ≥ ${r.min_count || 1}`;
    if (r.condition_type === 'absent') return isZh ? '未偵測到（缺件）' : 'Not detected (absent)';
    return isZh ? '出現目標' : 'Detected';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BellRing size={16} strokeWidth={1.5} color="var(--text-secondary)" />
          <h3 style={{ fontSize: '16px', fontWeight: 500 }}>
            {isZh ? '條件觸發規則' : 'Trigger rules'}
          </h3>
        </div>
        <Button variant="secondary" size="sm" icon={<Plus size={14} strokeWidth={1.5} />} onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? (isZh ? '取消' : 'Cancel') : (isZh ? '新增規則' : 'Add rule')}
        </Button>
      </div>

      {isAdding && (
        <div
          style={{
            padding: '16px',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{isZh ? '監聽類別' : 'Target class'}</label>
              <select className="form-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                {categoryOptions.map((c, i) => (
                  <option key={i} value={c}>
                    {displayClass(c)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{isZh ? '觸發條件' : 'Condition'}</label>
              <select className="form-select" value={conditionType} onChange={(e) => setConditionType(e.target.value as any)}>
                <option value="present">{isZh ? '出現目標 (≥ 1)' : 'Detected (≥ 1)'}</option>
                <option value="count_gte">{isZh ? '數量達標 (≥ N)' : 'Count reached (≥ N)'}</option>
                <option value="absent">{isZh ? '未偵測到（缺件告警）' : 'Absent (missing alert)'}</option>
              </select>
            </div>

            {conditionType === 'count_gte' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{isZh ? '數量門檻' : 'Min count'}</label>
                <input
                  type="number"
                  className="form-input vf-num"
                  min={1}
                  max={100}
                  value={minCount}
                  onChange={(e) => setMinCount(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  {isZh ? '信心度門檻' : 'Confidence threshold'}
                </label>
                <span className="vf-num" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent-primary)' }}>
                  ≥ {threshold}%
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={99}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              {isZh ? '取消' : 'Cancel'}
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateRule}>
              {isZh ? '建立規則' : 'Create rule'}
            </Button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {rules.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '8px 0' }}>
            {isZh ? '尚未設定觸發規則，點擊右上角新增告警條件' : 'No trigger rules set. Click Add rule to configure alerts'}
          </div>
        ) : (
          rules.map((r) => (
            <div
              key={r.id}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: r.enabled ? 'var(--accent-primary-soft)' : 'var(--bg-surface-elevated)',
                border: `1px solid ${r.enabled ? 'var(--accent-primary-border)' : 'var(--border-subtle)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', minWidth: 0 }}>
                <input
                  type="checkbox"
                  checked={r.enabled}
                  onChange={() => onToggleRule(r.id)}
                  style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontWeight: 500, color: r.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {displayClass(r.class_name)} · {getConditionLabel(r)}
                  </span>
                  <span className="vf-num" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                    {isZh ? '信心度' : 'Conf'} ≥ {r.min_confidence}%
                  </span>
                </div>
              </label>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onDeleteRule(r.id)}
                style={{ width: '28px', height: '28px', padding: 0, color: 'var(--text-muted)' }}
                title={isZh ? '刪除規則' : 'Delete rule'}
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="vf-num" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
            <Clock size={14} strokeWidth={1.5} />
            <span>{isZh ? `觸發事件記錄 (${events.length})` : `Event log (${events.length})`}</span>
          </div>
          {events.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClearEvents} style={{ height: '28px', padding: '0 8px', fontSize: '12px' }}>
              {isZh ? '清除' : 'Clear'}
            </button>
          )}
        </div>

        <div
          className="vf-mono"
          style={{
            maxHeight: '160px',
            overflowY: 'auto',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: '12px',
          }}
        >
          {events.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>
              {isZh ? '暫無觸發事件，符合規則時將即時記錄於此…' : 'No events yet. Matching triggers appear here…'}
            </div>
          ) : (
            events.map((ev, idx) => (
              <div
                key={idx}
                style={{
                  color: 'var(--accent-rose)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--accent-rose-soft)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  gap: '8px',
                }}
              >
                <span>
                  [{ev.timestamp}] {ev.message}
                </span>
                {ev.confidence > 0 && <span style={{ fontWeight: 500, flexShrink: 0 }}>{ev.confidence.toFixed(1)}%</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
