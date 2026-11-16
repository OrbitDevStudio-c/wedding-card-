import { useEffect, useRef } from 'react';

// Native <dialog> modal: the browser handles the focus trap, Escape and the inert backdrop.
// Focus returns to whatever opened it when it closes.
export function Modal({ open, onClose, labelledBy, className = '', children }) {
  const ref = useRef(null);
  const opener = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    if (open && !dialog.open) {
      opener.current = document.activeElement;
      dialog.showModal();
      document.documentElement.classList.add('has-modal');
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    const handleClose = () => {
      document.documentElement.classList.remove('has-modal');
      opener.current?.focus?.();
      onClose();
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  useEffect(() => () => document.documentElement.classList.remove('has-modal'), []);

  // Clicking the dimmed backdrop (the dialog element itself, outside the panel) closes it.
  const onClick = (e) => {
    if (e.target === ref.current) ref.current.close();
  };

  return (
    <dialog ref={ref} className={`modal ${className}`} aria-labelledby={labelledBy} onClick={onClick}>
      {open && (
        <div className="modal__panel">
          <button type="button" className="modal__close" onClick={() => ref.current.close()} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          {children}
        </div>
      )}
    </dialog>
  );
}
