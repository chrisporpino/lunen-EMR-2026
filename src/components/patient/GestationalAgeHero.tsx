import { gestationalAge, pregnancyProgress, getTrimesterLabel } from '../../lib/gestation'

interface Props {
  dum: string
  referenceDate?: string
}

export function GestationalAgeHero({ dum, referenceDate }: Props) {
  const { weeks, days } = gestationalAge(dum, referenceDate)
  const progress = pregnancyProgress(weeks, days)
  const trimester = getTrimesterLabel(weeks)

  return (
    <div className="bg-gradient-to-br from-primary to-primary-light rounded-card p-6 text-white shadow-card">
      <p className="text-white/70 text-sm font-medium tracking-wide uppercase mb-3">
        Idade Gestacional
      </p>

      <div className="flex items-end gap-2 mb-1">
        <span className="text-7xl font-bold leading-none tracking-tight">{weeks}</span>
        <div className="mb-2">
          <div className="text-xl font-semibold leading-tight">semanas</div>
          {days > 0 && (
            <div className="text-white/80 text-base font-medium">
              + {days} {days === 1 ? 'dia' : 'dias'}
            </div>
          )}
        </div>
      </div>

      <p className="text-white/70 text-sm mt-3 mb-4">{trimester}</p>

      {/* Barra de progresso */}
      <div className="mt-2">
        <div className="flex justify-between text-xs text-white/60 mb-1.5">
          <span>Sem. 1</span>
          <span>{progress}% da gestação</span>
          <span>Sem. 40</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Marcadores de trimestre */}
      <div className="flex mt-2 gap-1">
        {[1, 2, 3].map((t) => (
          <div
            key={t}
            className={`flex-1 h-1 rounded-full ${
              (t === 1 && weeks < 14) ||
              (t === 2 && weeks >= 14 && weeks < 28) ||
              (t === 3 && weeks >= 28)
                ? 'bg-white'
                : 'bg-white/25'
            }`}
          />
        ))}
      </div>
      <div className="flex mt-1 text-xs text-white/50">
        <span className="flex-1">T1</span>
        <span className="flex-1 text-center">T2</span>
        <span className="flex-1 text-right">T3</span>
      </div>
    </div>
  )
}
