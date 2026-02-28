type ChipProps = {
  label: string
  active?: boolean
  onClick?: () => void
  disabled?: boolean
}

export default function Chip({ label, active = false, onClick, disabled = false }: ChipProps) {
  return (
    <button
      type="button"
      className={active ? 'chip active' : 'chip'}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  )
}
