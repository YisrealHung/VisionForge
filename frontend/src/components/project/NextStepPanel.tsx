import React, { useEffect, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../services/api';
import { NavView, Project } from '../../types';

interface LabelProgress {
  total: number;
  labeled: number;
}

type StepState = 'done' | 'current' | 'todo';

/**
 * Guided next-step card plus the five-step pipeline (data -> label -> train -> export -> deploy)
 * for the active project.
 */
export const NextStepPanel: React.FC<{ project: Project }> = ({ project }) => {
  const { setCurrentView, language, systemHealth } = useProject();
  const backendOnline = systemHealth?.status === 'online';
  const isZh = language === 'zh-TW';
  const [progress, setProgress] = useState<LabelProgress | null>(null);
  const [progressError, setProgressError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setProgress(null);
    setProgressError(false);
    api
      .listImages(project.id)
      .then((imgs) => {
        if (!cancelled) {
          setProgress({ total: imgs.length, labeled: imgs.filter((i) => i.labeled).length });
        }
      })
      .catch(() => {
        if (!cancelled) setProgressError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [project.id, project.dataset_count, backendOnline]);

  const total = progress?.total ?? project.dataset_count;
  const labeled = progress?.labeled ?? 0;
  const unlabeled = Math.max(total - labeled, 0);
  const labelPct = total > 0 ? Math.round((labeled / total) * 100) : 0;
  const trained = project.model_count > 0;

  let title: string;
  let subtitle: string;
  let cta: string;
  let target: NavView;
  if (progressError) {
    title = isZh ? '暫時無法取得標註進度' : "Couldn't load labeling progress";
    subtitle = isZh ? '後端連線恢復後將自動更新' : 'Updates automatically once the backend is reachable';
    cta = isZh ? '前往資料集' : 'Open dataset';
    target = 'dataset';
  } else if (progress === null && total > 0) {
    title = isZh ? '正在讀取標註進度…' : 'Loading labeling progress…';
    subtitle = isZh ? `專案共 ${total.toLocaleString()} 張影像` : `${total.toLocaleString()} images in this project`;
    cta = isZh ? '前往標註' : 'Open annotation';
    target = 'annotator';
  } else if (total === 0) {
    title = isZh ? '先上傳第一批影像' : 'Upload your first images';
    subtitle = isZh ? '支援拖放上傳、COCO / YOLO 匯入與攝影機擷取' : 'Drag & drop upload, COCO / YOLO import, and camera capture supported';
    cta = isZh ? '前往資料集' : 'Upload images';
    target = 'dataset';
  } else if (unlabeled > 0) {
    title = isZh
      ? `還差 ${unlabeled.toLocaleString()} 張影像待標註`
      : `${unlabeled.toLocaleString()} images left to label`;
    subtitle = isZh
      ? `已完成 ${labeled.toLocaleString()} / ${total.toLocaleString()} 張（${labelPct}%）`
      : `${labeled.toLocaleString()} of ${total.toLocaleString()} labeled (${labelPct}%)`;
    cta = isZh ? '繼續標註' : 'Continue labeling';
    target = 'annotator';
  } else if (!trained) {
    title = isZh ? '資料已就緒，可開始訓練' : 'Dataset ready for training';
    subtitle = isZh ? `${total.toLocaleString()} 張影像皆已標註` : `All ${total.toLocaleString()} images labeled`;
    cta = isZh ? '配置與訓練' : 'Configure training';
    target = 'train';
  } else {
    title = isZh ? '模型已完成，可進行評估或匯出' : 'Model trained — ready to evaluate or export';
    subtitle = isZh ? '檢視混淆矩陣、匯出 ONNX / PTH 或啟動推論工作站' : 'Review confusion matrix, export ONNX / PTH, or test live inference';
    cta = isZh ? '評估與匯出' : 'Evaluate & export';
    target = 'export';
  }

  const labelState: StepState = total === 0 ? 'todo' : unlabeled === 0 ? 'done' : 'current';
  const steps: { key: string; label: string; sub: string; state: StepState; dot: string }[] = [
    {
      key: 'data',
      label: isZh ? '資料集' : 'Dataset',
      sub: isZh ? `${total.toLocaleString()} 張` : `${total.toLocaleString()} images`,
      state: total > 0 ? 'done' : 'current',
      dot: '1',
    },
    {
      key: 'label',
      label: isZh ? '標註' : 'Label',
      sub: labelState === 'done' ? (isZh ? '已完成' : 'Done') : labelState === 'current' ? (isZh ? '進行中' : 'In progress') : (isZh ? '待開始' : 'Pending'),
      state: labelState,
      dot: labelState === 'current' ? `${labelPct}%` : '2',
    },
    {
      key: 'train',
      label: isZh ? '訓練' : 'Train',
      sub: trained ? (isZh ? `${project.model_count} 個模型` : `${project.model_count} model(s)`) : (isZh ? '待開始' : 'Pending'),
      state: trained ? 'done' : labelState === 'done' ? 'current' : 'todo',
      dot: '3',
    },
    {
      key: 'export',
      label: isZh ? '匯出' : 'Export',
      sub: 'ONNX / PTH',
      state: trained ? 'current' : 'todo',
      dot: '4',
    },
    {
      key: 'deploy',
      label: isZh ? '部署' : 'Deploy',
      sub: isZh ? '推論服務' : 'Inference',
      state: 'todo',
      dot: '5',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <section className="vf-next-step vf-reticle" aria-label={isZh ? '下一步' : 'Next step'}>
        <div className="vf-next-step-body">
          <span className="vf-next-step-pill vf-num">
            {isZh ? '下一步' : 'Next step'} · {project.name}
          </span>
          <h2 className="vf-next-step-title">{title}</h2>
          <p className="vf-next-step-sub vf-num">{subtitle}</p>
        </div>
        <button type="button" className="vf-next-step-cta" onClick={() => setCurrentView(target)}>
          <span>{cta}</span>
          <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </section>

      <section className="glass-card" aria-label={isZh ? '流程進度' : 'Pipeline progress'}>
        <ol className="vf-steps" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {steps.map((s) => (
            <li key={s.key} className="vf-step" aria-current={s.state === 'current' ? 'step' : undefined}>
              <span className={`vf-step-dot ${s.state === 'todo' ? '' : s.state}`}>
                {s.state === 'done' ? <Check size={16} strokeWidth={2} aria-hidden="true" /> : s.dot}
              </span>
              <span className="vf-step-label">{s.label}</span>
              <span className="vf-step-sub">{s.sub}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
