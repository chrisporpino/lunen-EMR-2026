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
    const d = payload[0].payload
    return (
      <div className="bg-surface shadow-card-hover rounded-xl px-3.5 py-2.5 border border-border">
        <p className="text-xs text-muted mb-1">{d.ga}</p>
        <p className="text-base font-bold text-gray-900">
          {payload[0].value} <span className="text-xs font-normal text-muted">kg</span>
        </p>
      </div>
    )
  }
  return null
}

export function WeightChart({ consultations }: Props) {
  const data = consultations
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((c) => ({
      ga: `${c.gestationalWeeks}s${c.gestationalDays > 0 ? `+${c.gestationalDays}` : ''}`,
      week: c.gestationalWeeks,
      weight: c.vitalSigns.weight,
    }))

  if (data.length < 2) {
    return (
      <div className="bg-surface rounded-card p-5 shadow-card">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Evolução do Peso</h3>
        <p className="text-muted text-sm text-center py-8">Dados insuficientes para o gráfico.</p>
      </div>
    )
  }

  const weights = data.map((d) => d.weight)
  const minW = Math.floor(Math.min(...weights) - 2)
  const maxW = Math.ceil(Math.max(...weights) + 2)

  return (
    <div className="bg-surface rounded-card p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Evolução do Peso</h3>
        <span className="text-xs text-muted bg-bg px-2.5 py-1 rounded-pill">
          {data[data.length - 1].weight} kg atual
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3A7D7C" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#3A7D7C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2EAEC" vertical={false} />
          <XAxis
            dataKey="ga"
            tick={{ fontSize: 11, fill: '#8A9BA8' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[minW, maxW]}
            tick={{ fontSize: 11, fill: '#8A9BA8' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#3A7D7C"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#3A7D7C', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: '#3A7D7C', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
