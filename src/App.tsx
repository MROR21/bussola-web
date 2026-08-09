import { useEffect, useState } from 'react'
import { useAuthStore } from './features/auth/authStore'
import { LoginForm } from './features/auth/LoginForm'
import { NivelamentoForm } from './features/nivelamento/NivelamentoForm'
import { postTrail, salvarPerfil } from './features/nivelamento/nivelamentoService'
import { perfilPadrao } from './features/nivelamento/types'
import type { Perfil } from './features/nivelamento/types'
import { TrailView } from './features/onboarding/TrailView'
import type { TrailStep } from './features/onboarding/types'

function App() {
  const usuario = useAuthStore((state) => state.usuario)
  const logout = useAuthStore((state) => state.logout)

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
    if (!usuario) return
    setLoading(true)
    setError(null)
    try {
      await salvarPerfil(usuario.id, perfil)
      setTrail(await postTrail(perfil))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao montar a trilha')
    } finally {
      setLoading(false)
    }
  }

  function sair() {
    setTrail(null)
    logout()
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
        {usuario && (
          <span className="text-sm text-neutral-400">
            Olá, <strong className="text-neutral-200">{usuario.nome}</strong>
            {' · '}
            <button
              type="button"
              onClick={sair}
              className="text-purple-300 hover:text-purple-200"
            >
              Sair
            </button>
          </span>
        )}
      </header>

      {!usuario ? (
        <LoginForm />
      ) : (
        <>
          {loading && <p className="text-neutral-400">Montando sua trilha...</p>}
          {error && <p className="text-red-400">Erro: {error}</p>}
          {!loading &&
            (trail ? (
              <TrailView
                trail={trail}
                userId={usuario.id}
                onRestart={() => setTrail(null)}
              />
            ) : (
              <NivelamentoForm
                onSubmit={carregarTrilha}
                onSkip={() => carregarTrilha(perfilPadrao)}
              />
            ))}
        </>
      )}
    </main>
  )
}

export default App
