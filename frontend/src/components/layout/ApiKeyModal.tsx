import { useState } from 'react';
import { useWorkbenchStore } from '../../store/workbenchStore';
import styles from './ApiKeyModal.module.css';

export default function ApiKeyModal() {
  const apiKeys = useWorkbenchStore((s) => s.apiKeys);
  const setApiKey = useWorkbenchStore((s) => s.setApiKey);
  const clearApiKeys = useWorkbenchStore((s) => s.clearApiKeys);
  const showToast = useWorkbenchStore((s) => s.showToast);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    setOpen(false);
    showToast('API Key 已保存');
  };

  const keyList: { id: keyof typeof apiKeys; name: string; color: string }[] = [
    { id: 'claude', name: 'Claude (Anthropic)', color: '#d97757' },
    { id: 'deepseek', name: 'DeepSeek', color: '#4d7cf7' },
    { id: 'gpt', name: 'GPT (OpenAI)', color: '#74aa9c' },
  ];

  return (
    <>
      <button
        className={styles.gearBtn}
        title="API Key 配置"
        onClick={() => setOpen(true)}
      >
        ⚙
      </button>

      {open && (
        <div className={styles.overlay}>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.modal}>
            <div className={styles.head}>
              <h2>API Key 配置</h2>
              <button className={styles.close} onClick={() => setOpen(false)}>✕</button>
            </div>

            <p className={styles.hint}>
              API Key 仅保存在浏览器本地，每次创建任务时发送到服务器调用 AI。
            </p>

            {keyList.map(({ id, name, color }) => (
              <div key={id} className={styles.field}>
                <label style={{ color }}>{name}</label>
                <input
                  type="password"
                  placeholder={apiKeys[id] ? '••••••••（已设置）' : `输入 ${name} API Key`}
                  value={apiKeys[id] ?? ''}
                  onChange={(e) => setApiKey(id, e.target.value)}
                />
              </div>
            ))}

            <div className={styles.actions}>
              <button className={styles.btnClear} onClick={clearApiKeys}>
                清除全部
              </button>
              <button className={styles.btnSave} onClick={handleSave}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
