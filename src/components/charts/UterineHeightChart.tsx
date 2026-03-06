import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { Consultation } from '../../types'

interface Props {
  consultations: Consultation[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0]?.payload
    return (
      <div className="bg-surface shadow-card-hover rounded-xl px-3.5 py-2.5 border border-border">
        <p className="text-xs text-muted mb-1">Semana {d?.week}</p>
        <p className="text-base font-bold text-gray-900">
          {d?.uh} <span className="text-xs font-normal text-muted">cm</span>
        </p>
        <p className="text-xs text-muted">Esperado ≈ {d?.week} cm</p>
      </div>
    )
  }
  return null
}

export function UterineHeightChart({ consultations }: Props) {
  const measured = consultations
    .filter((c) => c.uterineHeight > 0)
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((c) => ({
      week: c.gestationalWeeks,
      uh: c.uterineHeight,
      ga: `${c.gestationalWeeks}s`,
    }))

  if (measured.length < 1) {
    return (
      <div className="bg-surface rounded-card p-5 shadow-card">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Altura Uterina</h3>
        <p className="text-muted text-sm text-center py-8">Nenhuma medição registrada.</p>
      </div>
    )
  }

  const merged = measured.map((m) => ({
    ...m,
    expected: m.week,
  }))

  return (
    <div className="bg-surface rounded-card p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Altura Uterina</h3>
        <span className="text-xs text-muted bg-bg px-2.5 py-1 rounded-pill">
          {measured[measured.length - 1].uh} cm atual
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={merged} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2EAEC" vertical={false} />
          <XAxis
            dataKey="ga"
            tick={{ fontSize: 11, fill: '#8A9BA8' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#8A9BA8' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="expected"
            stroke="#5BC0BE"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            name="Esperado"
          />
          <Line
            type="monotone"
            dataKey="uh"
            stroke="#3A7D7C"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#3A7D7C', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: '#3A7D7C', stroke: '#fff', strokeWidth: 2 }}
            name="Medido"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-primary rounded" />
          <span className="text-xs text-muted">Medido</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-accent rounded border-dashed" style={{ borderTop: '2px dashed #5BC0BE', background: 'none' }} />
          <span className="text-xs text-muted">Esperado</span>
        </div>
      </div>
    </div>
  )
}
