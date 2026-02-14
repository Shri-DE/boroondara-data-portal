import React from 'react';
import { Icon, mergeStyleSets } from '@fluentui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType } from '../../types/chat';
import { boroondaraPalette } from '../../theme/boroondaraTheme';

interface Props {
  message: ChatMessageType;
}

const styles = mergeStyleSets({
  row: {
    display: 'flex',
    gap: 16,
    marginBottom: 32,
    alignItems: 'flex-start',
  },
  rowUser: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarAssistant: {
    background: `linear-gradient(135deg, ${boroondaraPalette.primary}, #5856D6)`,
    color: '#fff',
  },
  avatarUser: {
    background: 'rgba(255,255,255,0.12)',
    color: boroondaraPalette.text2,
  },
  content: {
    flex: 1,
    minWidth: 0,
    maxWidth: 720,
  },
  userBubble: {
    background: 'rgba(255,255,255,0.08)',
    padding: '12px 18px',
    borderRadius: '18px 18px 4px 18px',
    color: boroondaraPalette.text,
    fontSize: 14,
    lineHeight: '1.65',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    width: 'fit-content',
    maxWidth: '100%',
    marginLeft: 'auto',
  },
  assistantProse: {
    color: boroondaraPalette.text,
    fontSize: 14,
    lineHeight: '1.75',
  },
});

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : ''}`}>
      <div className={`${styles.avatar} ${isUser ? styles.avatarUser : styles.avatarAssistant}`}>
        <Icon iconName={isUser ? 'Contact' : 'ChatBot'} style={{ fontSize: 15 }} />
      </div>
      <div className={styles.content}>
        {isUser ? (
          <div className={styles.userBubble}>{message.content}</div>
        ) : (
          <div className={styles.assistantProse}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
