import type { ReactNode } from 'react';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  left: ReactNode;
  canvas: ReactNode;
}

export default function MainLayout({ left, canvas }: MainLayoutProps) {
  return (
    <div className={styles.main}>
      <div className={styles.left} data-left-panel>
        {left}
      </div>
      <div className={styles.canvas}>
        {canvas}
      </div>
    </div>
  );
}
