interface Props {
  week: number
  title: string
  description: string
  isReached: boolean
  isLast?: boolean
}

export function MilestoneEvent({ week, title, description, isReached, isLast = false }: Props) {
  return (
    <div className="flex gap-4">
      {/* Conector */}
      <div className="flex flex-col items-center">
        <div
          className={`w-4 h-4 rotate-45 rounded-sm flex-shrink-0 mt-2.5 z-10 border-2 ${
            isReached
              ? 'bg-border/60 border-muted/40'
              : 'bg-warning/20 border-warning/70'
          }`}
        />
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1.5" />}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 pb-4 pt-0.5">
        <div
          className={`rounded-2xl px-4 py-3 border flex items-start gap-3 ${
            isReached
              ? 'bg-bg border-border'
              : 'bg-warning/5 border-warning/30'
          }`}
        >
          {/* Ícone */}
          <div className={`mt-0.5 flex-shrink-0 ${isReached ? 'text-muted' : 'text-warning'}`}>
            {isReached ? <CheckIcon /> : <CalendarIcon />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span
                className={`text-xs font-semibold uppercase tracking-wide ${
                  isReached ? 'text-muted' : 'text-warning'
                }`}
              >
                {isReached ? 'Marco clínico' : 'Próximo marco'}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-pill ${
                  isReached
                    ? 'bg-border/60 text-muted'
                    : 'bg-warning/15 text-warning'
                }`}
              >
                {week} semanas
              </span>
            </div>
            <p
              className={`text-sm font-semibold mt-0.5 ${
                isReached ? 'text-gray-400' : 'text-gray-800'
              }`}
            >
              {title}
            </p>
            <p
              className={`text-xs mt-0.5 leading-relaxed ${
                isReached ? 'text-muted/70' : 'text-muted'
              }`}
            >
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}
