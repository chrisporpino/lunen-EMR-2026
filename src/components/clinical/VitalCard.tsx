interface Props {
  label: string
  value: string
  unit?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
  status?: 'normal' | 'warning' | 'danger'
  sub?: string
}

const statusColors = {
  normal: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}

export function VitalCard({ label, value, unit, icon, status = 'normal', sub }: Props) {
  return (
    <div className="bg-surface rounded-card p-4 shadow-card flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className={`text-xl font-bold ${statusColors[status]}`}>{value}</span>
          {unit && <span className="text-xs text-muted font-medium">{unit}</span>}
        </div>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
