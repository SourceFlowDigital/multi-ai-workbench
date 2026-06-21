import styles from './SectionHeader.module.css';

interface SectionHeaderProps {
  icon: string;
  title: string;
  hint: string;
}

export default function SectionHeader({ icon, title, hint }: SectionHeaderProps) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.title}>{title}</span>
      <span className={styles.hint}>{hint}</span>
    </div>
  );
}
