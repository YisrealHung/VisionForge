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
 * "What should I do next?" card plus the five-step pipeline (data → label → train → export → deploy)
 * for the active project. Colors come from the --next-step-* tokens, so every theme renders it;
 * Maker Studio gives it the lime highlight.
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
        // Don't pretend nothing is labeled when we simply couldn't ask (e.g. backend restarting).
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
    subtitle = isZh ? '後端連線恢復後會自動更新。' : 'This refreshes once the backend is reachable again.';
    cta = isZh ? '前往資料集' : 'Open dataset';
    target = 'dataset';
  } else if (progress === null && total > 0) {
    title = isZh ? '正在讀取標註進度…' : 'Loading labeling progress…';
    subtitle = isZh ? `專案共 ${total.toLocaleString()} 張影像。` : `${total.toLocaleString()} images in this project.`;
    cta = isZh ? '前往標註' : 'Open annotation';
    target = 'annotator';
  } else if (total === 0) {
    title = isZh ? '先上傳第一批影像吧！' : 'Start by uploading your first images!';
    subtitle = isZh ? '支援拖放、資料夾與攝影機擷取。' : 'Drag & drop, folders and camera capture are supported.';
    cta = isZh ? '上傳影像' : 'Upload images';
    target = 'dataset';
  } else if (unlabeled > 0) {
    title = isZh ? `再標註 ${unlabeled.toLocaleString()} 張，資料就完整了！` : `Label ${unlabeled.toLocaleString()} more images to complete the dataset!`;
    subtitle = isZh
      ? `已完成 ${labeled.toLocaleString()} / ${total.toLocaleString()} 張（${labelPct}%）。`
      : `${labeled.toLocaleString()} of ${total.toLocaleString()} done (${labelPct}%).`;
    cta = isZh ? '繼續標註' : 'Continue labeling';
    target = 'annotator';
  } else if (!trained) {
    title = isZh ? '資料已就緒，開始訓練模型！' : 'Your data is ready — train a model!';
    subtitle = isZh ? `${total.toLocaleString()} 張影像皆已標註。` : `All ${total.toLocaleString()} images are labeled.`;
    cta = isZh ? '開始訓練' : 'Start training';
    target = 'train';
  } else {
    title = isZh ? '模型已訓練完成，匯出或部署它！' : 'Model trained — export or deploy it!';
    subtitle = isZh ? '可匯出 ONNX / PTH，或到推論工作站即時測試。' : 'Export ONNX / PTH, or test it live in the inference station.';
    cta = isZh ? '前往匯出' : 'Go to export';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <section className="vf-next-step" aria-label={isZh ? '下一步' : 'Next step'}>
        <div className="vf-next-step-body">
          <span className="vf-next-step-pill">
            {isZh ? '下一步' : 'Next step'} · {project.name}
          </span>
          <h2 className="vf-next-step-title">{title}</h2>
          <p className="vf-next-step-sub">{subtitle}</p>
        </div>
        <button type="button" className="vf-next-step-cta" onClick={() => setCurrentView(target)}>
          {cta} <ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>

      <section className="glass-card" aria-label={isZh ? '流程進度' : 'Pipeline progress'}>
        <ol className="vf-steps" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {steps.map((s) => (
            <li key={s.key} className="vf-step" aria-current={s.state === 'current' ? 'step' : undefined}>
              <span className={`vf-step-dot ${s.state === 'todo' ? '' : s.state}`}>
                {s.state === 'done' ? <Check size={20} strokeWidth={3} aria-hidden="true" /> : s.dot}
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
