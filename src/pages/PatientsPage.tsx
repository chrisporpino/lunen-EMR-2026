import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mockPatients } from '../data/mockPatients'
import { RiskBadge, Toast, useToast } from '../components/ui'
import { PatientFormDrawer } from '../components/forms'
import { gestationalAge, calculateEDD, formatEDD, pregnancyProgress } from '../lib/gestation'

const sortByEDD = (list: typeof mockPatients) =>
  [...list].sort((a, b) => new Date(a.eddCalc).getTime() - new Date(b.eddCalc).getTime())

type StatusFilter = 'ativa' | 'arquivada'

export function PatientsPage() {
  const [patients, setPatients] = useState(() => sortByEDD(mockPatients))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filter, setFilter] = useState<StatusFilter>('ativa')
  const [search, setSearch] = useState('')
  const { toastMessage, showToast } = useToast()

  const query = search.trim().toLowerCase()
  const displayed = patients.filter(
    (p) =>
      p.status === filter &&
      (query === '' || p.name.toLowerCase().includes(query)),
  )

  function handleSaved() {
    setPatients(sortByEDD([...mockPatients]))
    showToast('Gestante cadastrada com sucesso')
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Barra de navegação */}
      <header className="bg-surface border-b border-border sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-base">Lunen EMR</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted hidden sm:block">Módulo Obstétrico</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              D
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Cabeçalho da página */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Gestantes</h1>
            <p className="text-muted text-sm">
              {displayed.length}{' '}
              {query !== ''
                ? `resultado${displayed.length !== 1 ? 's' : ''}`
                : filter === 'ativa'
                  ? 'gestações ativas'
                  : 'arquivadas'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Filtro Ativas / Arquivadas */}
            <div className="flex gap-1 bg-bg border border-border rounded-xl p-1">
              {(['ativa', 'arquivada'] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all capitalize ${
                    filter === f
                      ? 'bg-surface shadow-card text-primary'
                      : 'text-muted hover:text-gray-700'
                  }`}
                >
                  {f === 'ativa' ? 'Ativas' : 'Arquivadas'}
                </button>
              ))}
            </div>
            {filter === 'ativa' && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-card"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Nova Gestante</span>
                <span className="sm:hidden">Nova</span>
              </button>
            )}
          </div>
        </div>

        {/* Campo de busca */}
        <div className="relative mb-6">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar gestante pelo nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-gray-900 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total" value={displayed.length.toString()} icon="👥" />
          <StatCard label="Alto Risco" value={displayed.filter(p => p.riskLevel === 'high').length.toString()} icon="⚠️" />
          <StatCard label="Risco Intermediário" value={displayed.filter(p => p.riskLevel === 'medium').length.toString()} icon="🟡" />
          <StatCard label="Baixo Risco" value={displayed.filter(p => p.riskLevel === 'low').length.toString()} icon="✅" />
        </div>

        {/* Lista de gestantes */}
        {displayed.length === 0 ? (
          <div className="text-center py-20 text-muted">
            <p className="text-sm">
              {query !== ''
                ? `Nenhuma gestante encontrada para "${search}".`
                : filter === 'ativa'
                  ? 'Nenhuma gestante ativa.'
                  : 'Nenhuma gestante arquivada.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((patient) => {
              const { weeks, days } = gestationalAge(patient.dum)
              const edd = calculateEDD(patient.dum)
              const progress = pregnancyProgress(weeks, days)

              return (
                <Link
                  key={patient.id}
                  to={`/patient/${patient.id}`}
                  className="block bg-surface rounded-card shadow-card hover:shadow-card-hover transition-all duration-200 p-5 group"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${patient.status === 'arquivada' ? 'bg-muted/40' : 'bg-gradient-to-br from-primary to-accent'}`}>
                      {patient.name.charAt(0)}
                    </div>

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className={`text-base font-semibold transition-colors ${patient.status === 'arquivada' ? 'text-muted' : 'text-gray-900 group-hover:text-primary'}`}>
                            {patient.name}
                          </h2>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            {patient.status === 'arquivada' ? (
                              <span className="text-xs font-medium text-muted bg-muted/10 border border-muted/20 px-2 py-0.5 rounded-pill">
                                Arquivada
                              </span>
                            ) : (
                              <RiskBadge level={patient.riskLevel} size="sm" />
                            )}
                            <span className="text-xs text-muted">
                              G{patient.gravidity}P{patient.parity} · {patient.bloodType}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-baseline gap-1 justify-end">
                            <span className={`text-xl font-bold ${patient.status === 'arquivada' ? 'text-muted' : 'text-primary'}`}>{weeks}</span>
                            <span className="text-xs text-muted font-medium">
                              sem {days > 0 ? `+ ${days}d` : ''}
                            </span>
                          </div>
                          <p className="text-xs text-muted">DPP {formatEDD(edd)}</p>
                        </div>
                      </div>

                      {/* Barra de evolução */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted mb-1">
                          <span>Evolução gestacional</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${patient.status === 'arquivada' ? 'bg-muted/40' : 'bg-gradient-to-r from-primary to-accent'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Seta */}
                    <div className="flex-shrink-0 self-center text-muted/30 group-hover:text-primary/50 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <PatientFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={handleSaved}
      />
      <Toast message={toastMessage} />
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-surface rounded-card shadow-card p-4 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  )
}
