import type { ReactNode } from 'react'

type PanelProps = {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export default function Panel({ title, subtitle, action, children, className }: PanelProps) {
  return (
    <article className={className ? `panel ${className}` : 'panel'}>
      {(title || subtitle || action) && (
        <header className="panel-header">
          <div>
            {title && <h2 className="panel-title">{title}</h2>}
            {subtitle && <p className="panel-subtitle">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </article>
  )
}
