import { useState } from 'react';
import { useWorkbenchStore } from '../../store/workbenchStore';
import type { ChatMessage } from '../../types';
import styles from './ChatSection.module.css';

export default function ChatSection() {
  const activeResultRoleId = useWorkbenchStore((s) => s.activeResultRoleId);
  const chatMessages = useWorkbenchStore((s) => s.chatMessages);
  const sendChat = useWorkbenchStore((s) => s.sendChat);
  const [input, setInput] = useState('');

  const messages: ChatMessage[] = activeResultRoleId
    ? (chatMessages[activeResultRoleId] ?? [])
    : [];

  const handleSend = () => {
    if (!input.trim() || !activeResultRoleId) return;
    sendChat(activeResultRoleId, input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className={styles.chatSection}>
      <div className={styles.clabel}>追问交流</div>

      <div className={styles.chatMsgs}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.chatMsg} ${msg.role === 'ai' ? styles.ai : styles.user}`}
          >
            <span className={styles.aSm}>{msg.role === 'ai' ? '🤖' : '👤'}</span>
            <div className={styles.bubble}>{msg.content}</div>
          </div>
        ))}
      </div>

      <div className={styles.chatInputRow}>
        <input
          type="text"
          placeholder="追问更多细节…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleSend}>发送</button>
      </div>
    </div>
  );
}
