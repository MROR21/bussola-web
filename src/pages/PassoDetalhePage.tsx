import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Markdown } from '../components/Markdown'
import { useAuthStore } from '../features/auth/authStore'
import { cx } from '../utils/cx'
import { getStep } from '../features/onboarding/onboardingService'
import {
  concluirPasso,
  desmarcarPasso,
  getProgresso,
} from '../features/onboarding/progressService'
import type { OnboardingStep } from '../features/onboarding/types'

// Página de um passo (rota /passo/:id): mostra o conteúdo completo em Markdown e deixa concluir.
export function PassoDetalhePage() {
  const { id = '' } = useParams()
  const usuario = useAuthStore((state) => state.usuario)

  const [step, setStep] = useState<OnboardingStep | null>(null)
  const [concluido, setConcluido] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!usuario) return
    let cancelado = false
    setLoading(true)
    setError(null)
    Promise.all([getStep(id), getProgresso(usuario.id)])
      .then(([passo, concluidos]) => {
        if (cancelado) return
        setStep(passo)
        setConcluido(concluidos.includes(id))
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'Erro ao carregar o passo')
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [id, usuario])

  // Alterna concluído de forma otimista (desfaz se o back falhar).
  async function toggle() {
    if (!usuario) return
    const antes = concluido
    setConcluido(!antes)
    try {
      if (antes) await desmarcarPasso(usuario.id, id)
      else await concluirPasso(usuario.id, id)
    } catch {
      setConcluido(antes)
    }
  }

  if (loading) return <p className="text-neutral-400">Carregando o passo...</p>
  if (error) return <p className="text-red-400">Erro: {error}</p>
  if (!step) return null

  return (
    <article className="flex w-full max-w-2xl flex-col gap-5">
      <Link to="/" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← Voltar pra jornada
      </Link>

      <header className="flex flex-col gap-1">
        <span className="text-sm text-neutral-500">
          Passo {step.order} · {step.phase}
        </span>
        <h1 className="text-2xl font-bold text-neutral-100">{step.title}</h1>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 leading-relaxed">
        <Markdown>{step.conteudo}</Markdown>
      </div>

      <button
        type="button"
        onClick={toggle}
        className={cx(
          'self-start rounded-lg px-4 py-2 text-sm font-medium transition-colors',
          concluido
            ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            : 'bg-purple-500 text-white hover:bg-purple-400',
        )}
      >
        {concluido ? '✓ Concluído · desmarcar' : 'Marcar como concluído'}
      </button>
    </article>
  )
}
