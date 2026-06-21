import styles from './ReportBlock.module.css';

interface ReportBlockProps {
  type: 'conclusion' | 'evidence' | 'advice';
  title?: string;
  content?: string;
  items?: string[];
}

const defaultTitles: Record<string, string> = {
  conclusion: '结论',
  evidence: '依据',
  advice: '建议',
};

export default function ReportBlock({ type, title, content, items }: ReportBlockProps) {
  return (
    <div className={`${styles.reportBlock} ${styles[type]}`}>
      <h4>{title ?? defaultTitles[type]}</h4>
      {content && <p>{content}</p>}
      {items && items.length > 0 && (
        <ul>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
