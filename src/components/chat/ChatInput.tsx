import React, { useRef } from 'react';
import { Icon, mergeStyleSets } from '@fluentui/react';
import { useState } from 'react';
import { boroondaraPalette } from '../../theme/boroondaraTheme';

interface Props {
  disabled?: boolean;
  onSend: (message: string) => void;
  placeholder?: string;
}

const styles = mergeStyleSets({
  wrap: {
    maxWidth: 820,
    width: '100%',
    margin: '0 auto',
  },
  inputBox: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 12,
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid rgba(255,255,255,0.10)`,
    borderRadius: 16,
    padding: '12px 16px',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    ':focus-within': {
      borderColor: 'rgba(124,124,255,0.45)',
      boxShadow: '0 0 0 3px rgba(124,124,255,0.10)',
    },
  },
  textarea: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: boroondaraPalette.text,
    fontSize: 14,
    lineHeight: '1.55',
    resize: 'none',
    fontFamily: 'inherit',
    minHeight: 24,
    maxHeight: 160,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s ease',
    background: boroondaraPalette.primary,
    color: '#fff',
  },
  sendBtnDisabled: {
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.25)',
    cursor: 'not-allowed',
  },
  hint: {
    fontSize: 11,
    color: boroondaraPalette.text3,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default function ChatInput({ disabled, onSend, placeholder }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim().length > 0 && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    onSend(value);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.inputBox}>
        <textarea
          ref={textareaRef}
          className={styles.textarea as any}
          rows={1}
          value={value}
          disabled={disabled}
          placeholder={placeholder ?? 'Ask the agent a question...'}
          onChange={(e) => {
            setValue(e.target.value);
            autoResize();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          className={`${styles.sendBtn} ${!canSend ? styles.sendBtnDisabled : ''}`}
          onClick={handleSend}
          disabled={!canSend}
          title="Send message"
        >
          <Icon iconName="Send" style={{ fontSize: 16 }} />
        </button>
      </div>
      <div className={styles.hint}>
        <b>Enter</b> to send &nbsp;·&nbsp; <b>Shift + Enter</b> for new line
      </div>
    </div>
  );
}
