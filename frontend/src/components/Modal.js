import React, { useEffect } from 'react';

export default function Modal({ title, onClose, children, footer }) {
  useEffect(() => {

    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handler);

    // LOCK BACKGROUND SCROLL
    document.body.style.overflow = 'hidden';

    return () => {

      document.removeEventListener('keydown', handler);

      // RESTORE SCROLL
      document.body.style.overflow = '';

    };

  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: 18 }}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
