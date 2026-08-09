import { useEffect, useState } from 'react'
import { useAuthStore } from './features/auth/authStore'
import { getUser } from './features/auth/userService'
import { LoginForm } from './features/auth/LoginForm'
import { NivelamentoForm } from './features/nivelamento/NivelamentoForm'
import { postTrail, salvarPerfil } from './features/nivelamento/nivelamentoService'
import { perfilPadrao } from './features/nivelamento/types'
import type { Perfil } from './features/nivelamento/types'
import { JornadaView } from './features/onboarding/JornadaView'
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

  // Ao logar: busca o usuário. Se já nivelou, monta a trilha do perfil salvo (pula o questionário);
  // senão, deixa a trilha nula pra mostrar o nivelamento.
  useEffect(() => {
    if (!usuario) return
    let cancelado = false
    setLoading(true)
    setError(null)
    getUser(usuario.id)
      .then(async (detalhe) => {
        if (cancelado) return
        setTrail(detalhe.nivelamentoConcluido ? await postTrail(detalhe.perfil) : null)
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'Erro ao carregar sua jornada')
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [usuario])

  // Fim do questionário: salva o perfil no usuário e monta a trilha. "Pular" usa o perfil padrão.
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
    <main className="flex min-h-screen flex-col items-center gap-6 bg-neutral-950 px-4 py-12 text-neutral-100">
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
          {loading && <p className="text-neutral-400">Carregando sua jornada...</p>}
          {error && <p className="text-red-400">Erro: {error}</p>}
          {!loading &&
            !error &&
            (trail ? (
              <JornadaView
                trail={trail}
                userId={usuario.id}
                nome={usuario.nome}
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
