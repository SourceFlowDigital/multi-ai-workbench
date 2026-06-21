import { useWorkbenchStore } from '../../store/workbenchStore';
import styles from './ZoomControls.module.css';

export default function ZoomControls() {
  const zoom = useWorkbenchStore((s) => s.canvasZoom);
  const setZoom = useWorkbenchStore((s) => s.setZoom);

  const pct = Math.round(zoom * 100);

  return (
    <div className={styles.zoomCtrls}>
      <button onClick={() => setZoom(zoom + 0.1)}>+</button>
      <span className={styles.pct}>{pct}%</span>
      <button onClick={() => setZoom(zoom - 0.1)}>−</button>
      <button onClick={() => setZoom(1)}>↺</button>
    </div>
  );
}
