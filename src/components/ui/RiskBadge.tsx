import type { RiskLevel } from '../../types'

interface Props {
  level: RiskLevel
  size?: 'sm' | 'md'
}

const config: Record<RiskLevel, { label: string; className: string }> = {
  low: {
    label: 'Baixo risco',
    className: 'bg-success/10 text-success border border-success/20',
  },
  medium: {
    label: 'Risco intermediário',
    className: 'bg-warning/10 text-warning border border-warning/20',
  },
  high: {
    label: 'Alto risco',
    className: 'bg-danger/10 text-danger border border-danger/20',
  },
}

export function RiskBadge({ level, size = 'md' }: Props) {
  const { label, className } = config[level]
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-pill ${className} ${
        size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1'
      }`}
    >
      <span
        className={`inline-block rounded-full mr-1.5 flex-shrink-0 ${
          level === 'low'
            ? 'bg-success'
            : level === 'medium'
              ? 'bg-warning'
              : 'bg-danger'
        } ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}
      />
      {label}
    </span>
  )
}
