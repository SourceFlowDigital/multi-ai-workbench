import { useState } from 'react';
import { useWorkbenchStore } from '../../store/workbenchStore';
import { api } from '../../api/client';
import Collapse from '../ui/Collapse';
import styles from './CustomRoleSection.module.css';

export default function CustomRoleSection() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [saving, setSaving] = useState(false);

  const showToast = useWorkbenchStore((s) => s.showToast);
  const fetchRoles = useWorkbenchStore((s) => s.fetchRoles);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('请输入角色名称');
      return;
    }

    setSaving(true);
    try {
      await api.createRole({
        name: name.trim(),
        description: description.trim(),
        system_prompt: systemPrompt.trim() || undefined,
        sort_order: 99,
      });
      setName('');
      setDescription('');
      setSystemPrompt('');
      showToast('角色创建成功');
      fetchRoles();
    } catch (e) {
      console.error('Failed to create role:', e);
      showToast('角色创建失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.section}>
      <Collapse title="+ 创建自定义角色">
        <div className={styles.field}>
          <label>角色名称</label>
          <input
            type="text"
            placeholder="例：新能源政策分析师"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>角色描述</label>
          <input
            type="text"
            placeholder="简述角色职责"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>系统提示词</label>
          <textarea
            placeholder="定义角色的行为方式与知识边界…"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
        </div>
        <button
          className={styles.btnSave}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中…' : '保存角色'}
        </button>
      </Collapse>
    </div>
  );
}
