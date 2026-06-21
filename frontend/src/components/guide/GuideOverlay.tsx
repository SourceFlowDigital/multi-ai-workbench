import { useState } from 'react';
import { useWorkbenchStore } from '../../store/workbenchStore';
import styles from './GuideOverlay.module.css';

interface Step {
  title: string;
  desc: string;
  feats: { icon: string; text: string }[];
}

const steps: Step[] = [
  {
    title: '多AI协同决策',
    desc: '像指挥一支AI团队。你作为总裁下达任务，执行总裁自动拆解并分派给各个AI角色并行分析，最终整合为一份结构化决策报告。',
    feats: [
      { icon: '📋', text: '输入决策问题' },
      { icon: '⚡', text: 'AI自动拆解分派' },
      { icon: '📊', text: '获得结构化报告' },
    ],
  },
  {
    title: '自定义AI角色',
    desc: '内置研究员、策略师、分析师、规划师等多种角色。你也可以创建自己的专属角色，定义它的知识和行为方式。',
    feats: [
      { icon: '🔬', text: '多领域角色' },
      { icon: '🛠️', text: '自定义提示词' },
      { icon: '🔄', text: '灵活组合' },
    ],
  },
  {
    title: '开始你的第一次协同',
    desc: '在左侧输入你的决策问题，选择想要参与的AI角色和模型，点击"执行任务"。各角色将在画布上并行工作，点击节点查看分析报告。',
    feats: [
      { icon: '✍️', text: '输入任务' },
      { icon: '▶️', text: '一键执行' },
      { icon: '💡', text: '追问深入' },
    ],
  },
];

export default function GuideOverlay() {
  const guideOpen = useWorkbenchStore((s) => s.guideOpen);
  const dismissGuide = useWorkbenchStore((s) => s.dismissGuide);
  const [step, setStep] = useState(0);

  const s = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      dismissGuide();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    dismissGuide();
  };

  return (
    <div className={`${styles.guideOverlay} ${!guideOpen ? styles.off : ''}`}>
      <div className={styles.guideCard} data-guide-card>
        {/* Steps indicator */}
        <div className={styles.guideSteps}>
          {steps.map((_, i) => (
            <span key={i} className={i === step ? styles.on : ''} />
          ))}
        </div>

        <h2>{s.title}</h2>
        <p className={styles.gd}>{s.desc}</p>

        <div className={styles.guideFeats}>
          {s.feats.map((f) => (
            <div key={f.icon} className={styles.gf}>
              <div className={styles.gfIcon}>{f.icon}</div>
              <div className={styles.gfT}>{f.text}</div>
            </div>
          ))}
        </div>

        <div className={styles.guideBtns}>
          <button className={styles.btnS} onClick={handleSkip}>
            跳过
          </button>
          <button className={styles.btnP} onClick={handleNext}>
            {isLast ? '开始使用' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  );
}
