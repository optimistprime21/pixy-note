import { useEffect, useState } from 'react';
import { useUI } from '../ui';

export function Dialog() {
  const dialog = useUI((s) => s.dialog);
  const [value, setValue] = useState('');

  useEffect(() => {
    if (dialog?.kind === 'text') setValue(dialog.value);
  }, [dialog]);

  if (!dialog) return null;

  const close = (ok: boolean) => {
    useUI.setState({ dialog: null });
    if (dialog.kind === 'text') dialog.resolve(ok ? value : null);
    else dialog.resolve(ok);
  };

  return (
    <div className="dialog-backdrop" onMouseDown={() => close(false)}>
      <div
        className="dialog px-panel"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close(false);
          if (e.key === 'Enter') close(true);
        }}
      >
        <div className="dialog-title">{dialog.title}</div>
        {dialog.kind === 'confirm' && dialog.message && <p>{dialog.message}</p>}
        {dialog.kind === 'text' && <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} />}
        <div className="dialog-actions">
          <button className="px-btn" onClick={() => close(false)}>
            Vazgeç
          </button>
          <button className="px-btn primary" autoFocus={dialog.kind === 'confirm'} onClick={() => close(true)}>
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}
