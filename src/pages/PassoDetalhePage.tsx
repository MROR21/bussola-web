import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EstadoErro } from '../components/EstadoErro'
import { Markdown } from '../components/Markdown'
import { useAuthStore } from '../features/auth/authStore'
import { getStep } from '../features/onboarding/onboardingService'
import {
  concluirPasso,
  desmarcarPasso,
  getComprovacao,
} from '../features/onboarding/progressService'
import type { OnboardingStep } from '../features/onboarding/types'

const inputCls =
  'rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-purple-400'

// Mostra a evidência: se for um link (http), vira âncora clicável; senão, texto puro.
function Comprovacao({ texto }: { texto: string }) {
  if (/^https?:\/\//i.test(texto.trim())) {
    return (
      <a
        href={texto}
        target="_blank"
        rel="noreferrer"
        className="break-all text-purple-300 underline hover:text-purple-200"
      >
        {texto}
      </a>
    )
  }
  return <span className="whitespace-pre-wrap break-words text-neutral-300">{texto}</span>
}

// Página de um passo (rota /passo/:id): conteúdo em Markdown + concluir com comprovação opcional.
export function PassoDetalhePage() {
  const { id = '' } = useParams()
  const usuario = useAuthStore((state) => state.usuario)

  const [step, setStep] = useState<OnboardingStep | null>(null)
  const [concluido, setConcluido] = useState(false)
  const [evidencia, setEvidencia] = useState('')
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    if (!usuario) return
    let cancelado = false
    setLoading(true)
    setError(null)
    Promise.all([getStep(id), getComprovacao(usuario.id, id)])
      .then(([passo, comp]) => {
        if (cancelado) return
        setStep(passo)
        setConcluido(comp.concluido)
        setEvidencia(comp.evidencia)
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
  }, [id, usuario, tentativa])

  async function concluir() {
    if (!usuario) return
    setSalvando(true)
    try {
      await concluirPasso(usuario.id, id, evidencia)
      setConcluido(true)
      setEditando(false)
    } catch {
      // mantém o estado atual — o banner de offline sinaliza a queda
    } finally {
      setSalvando(false)
    }
  }

  async function desmarcar() {
    if (!usuario) return
    setSalvando(true)
    try {
      await desmarcarPasso(usuario.id, id)
      setConcluido(false)
      setEditando(false)
    } catch {
      // idem
    } finally {
      setSalvando(false)
    }
  }

  if (loading) return <p className="text-neutral-400">Carregando o passo...</p>
  if (error) return <EstadoErro onRetry={() => setTentativa((t) => t + 1)} />
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

      {concluido ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-green-500/30 bg-neutral-900 p-5">
          <span className="self-start rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">
            ✓ Concluído
          </span>

          {editando ? (
            <>
              <textarea
                value={evidencia}
                onChange={(e) => setEvidencia(e.target.value)}
                rows={2}
                placeholder="Cole o link do PR, um print, ou uma nota (opcional)"
                className={inputCls}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={concluir}
                  disabled={salvando}
                  className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400 disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar comprovação'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  className="rounded-lg px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500">Comprovação</span>
                {evidencia ? (
                  <Comprovacao texto={evidencia} />
                ) : (
                  <span className="text-sm text-neutral-500">Sem comprovação anexada.</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
                >
                  {evidencia ? 'Editar comprovação' : 'Adicionar comprovação'}
                </button>
                <button
                  type="button"
                  onClick={desmarcar}
                  disabled={salvando}
                  className="rounded-lg px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800 disabled:opacity-50"
                >
                  Desmarcar
                </button>
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <span className="text-sm font-medium text-neutral-200">Comprovação (opcional)</span>
          <p className="text-xs text-neutral-500">
            Cole o link do PR, um print, ou uma nota do que você fez.
          </p>
          <textarea
            value={evidencia}
            onChange={(e) => setEvidencia(e.target.value)}
            rows={2}
            placeholder="https://bitbucket.org/... ou uma nota"
            className={inputCls}
          />
          <button
            type="button"
            onClick={concluir}
            disabled={salvando}
            className="self-start rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Marcar como concluído'}
          </button>
        </section>
      )}
    </article>
  )
}
