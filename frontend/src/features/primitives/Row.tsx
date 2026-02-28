import type { ReactNode } from 'react'

type RowProps = {
  left: ReactNode
  right?: ReactNode
  className?: string
}

export default function Row({ left, right, className }: RowProps) {
  return (
    <div className={className ? `row ${className}` : 'row'}>
      <div className="row-left">{left}</div>
      {right && <div className="row-right">{right}</div>}
    </div>
  )
}
