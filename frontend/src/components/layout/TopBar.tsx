import { useWorkbenchStore } from '../../store/workbenchStore';
import ApiKeyModal from './ApiKeyModal';
import styles from './TopBar.module.css';

interface TopBarProps {
  onHistoryClick: () => void;
}

export default function TopBar({ onHistoryClick }: TopBarProps) {
  const showGuide = useWorkbenchStore((s) => s.showGuide);

  return (
    <header className={styles.topbar} data-topbar>
      <div className={styles.brand}>
        <h1>源流决策台</h1>
        <span className={styles.sep}>·</span>
        <span className={styles.sub}>MULTI-AI WORKBENCH</span>
      </div>

      <div className={styles.right}>
        <ApiKeyModal />
        <button className={styles.tbBtn} title="任务历史" onClick={onHistoryClick}>
          <span className={styles.dot} />
          ☰
        </button>
        <button className={styles.tbBtn} title="帮助" onClick={() => showGuide()}>
          ?
        </button>
        <div className={styles.avatar}>S</div>
      </div>
    </header>
  );
}
