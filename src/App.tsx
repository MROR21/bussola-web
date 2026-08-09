import { useEffect, useState } from 'react'
import { NivelamentoForm } from './features/nivelamento/NivelamentoForm'
import { postTrail } from './features/nivelamento/nivelamentoService'
import { perfilPadrao } from './features/nivelamento/types'
import type { Perfil } from './features/nivelamento/types'
import { TrailView } from './features/onboarding/TrailView'
import type { TrailStep } from './features/onboarding/types'

function App() {
  const [status, setStatus] = useState('...')
  const [trail, setTrail] = useState<TrailStep[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setStatus(d.status ?? 'desconhecido'))
      .catch(() => setStatus('offline'))
  }, [])

  // Envia o perfil pro back e guarda a trilha personalizada. "Pular" chama com o perfil padrão.
  async function carregarTrilha(perfil: Perfil) {
    setLoading(true)
    setError(null)
    try {
      setTrail(await postTrail(perfil))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao montar a trilha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-neutral-950 py-12 text-neutral-100">
      <header className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold tracking-tight">🧭 Bússola</h1>
        <p className="text-neutral-400">Onboarding técnico</p>
        <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs">
          API:{' '}
          <strong className={status === 'ok' ? 'text-green-400' : 'text-red-400'}>
            {status}
          </strong>
        </span>
      </header>

      {loading && <p className="text-neutral-400">Montando sua trilha...</p>}
      {error && <p className="text-red-400">Erro: {error}</p>}

      {!loading &&
        (trail ? (
          <TrailView trail={trail} onRestart={() => setTrail(null)} />
        ) : (
          <NivelamentoForm
            onSubmit={carregarTrilha}
            onSkip={() => carregarTrilha(perfilPadrao)}
          />
        ))}
    </main>
  )
}

export default App
