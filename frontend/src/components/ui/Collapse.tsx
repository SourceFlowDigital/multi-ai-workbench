import { useState, type ReactNode } from 'react';
import styles from './Collapse.module.css';

interface CollapseProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function Collapse({ title, children, defaultOpen = false }: CollapseProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <div
        className={styles.collapseHead}
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        <span className={`${styles.chev} ${open ? styles.chevOpen : ''}`}>▾</span>
      </div>
      <div className={`${styles.collapseBody} ${open ? styles.collapseBodyOpen : ''}`}>
        {children}
      </div>
    </div>
  );
}
