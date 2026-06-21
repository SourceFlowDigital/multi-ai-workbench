import { useWorkbenchStore } from '../../store/workbenchStore';
import styles from './Toast.module.css';

export default function Toast() {
  const message = useWorkbenchStore((s) => s.toastMessage);

  return (
    <div className={`${styles.toast} ${message ? styles.show : ''}`}>
      {message}
    </div>
  );
}
