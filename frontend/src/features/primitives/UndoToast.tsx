type UndoToastProps = {
  label: string
  onUndo: () => void
  onClose: () => void
}

export default function UndoToast({ label, onUndo, onClose }: UndoToastProps) {
  return (
    <div className="undo-toast" role="status" aria-live="polite">
      <p>{label}</p>
      <div className="undo-toast-actions">
        <button type="button" className="btn ghost" onClick={onUndo}>
          Undo
        </button>
        <button type="button" className="btn ghost" onClick={onClose} aria-label="Close toast">
          Close
        </button>
      </div>
    </div>
  )
}
