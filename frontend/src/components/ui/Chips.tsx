import styles from './Chips.module.css';

export interface ChipItem {
  id: string;
  label: string;
}

interface ChipsProps {
  items: ChipItem[];
  selected: string[];
  onToggle: (id: string) => void;
  variant?: 'default' | 'gold';
}

export default function Chips({ items, selected, onToggle, variant = 'default' }: ChipsProps) {
  return (
    <div className={styles.chips}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`${styles.chip} ${variant === 'gold' ? styles.gold : ''}`}
        >
          <input
            type="checkbox"
            id={`chip-${item.id}`}
            checked={selected.includes(item.id)}
            onChange={() => onToggle(item.id)}
          />
          <label htmlFor={`chip-${item.id}`}>{item.label}</label>
        </div>
      ))}
    </div>
  );
}
