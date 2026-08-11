import { useEffect, useMemo, useState } from 'react'
import { cx } from '../../utils/cx'
import { PassoCard } from './PassoCard'
import { ProgressRing } from './ProgressRing'
import { concluirPasso, desmarcarPasso, getProgresso } from './progressService'
import type { TrailStep } from './types'

// Emoji por fase (fallback genérico se aparecer uma fase nova).
const FASE_EMOJI: Record<string, string> = {
  Ambientação: '👋',
  'Ambiente técnico': '💻',
  Padrões: '📐',
  'Primeiro Card': '🏆',
}
const emojiDaFase = (fase: string) => FASE_EMOJI[fase] ?? '📍'

// Home "Sua Jornada": progresso geral + próximo passo + fases em CARDS (clica e entra na fase).
export function JornadaView({
  trail,
  userId,
  nome,
  gestorNome,
  onRestart,
}: {
  trail: TrailStep[]
  userId: string
  nome: string
  gestorNome?: string | null
  onRestart: () => void
}) {
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [faseSelecionada, setFaseSelecionada] = useState<string | null>(null)

  useEffect(() => {
    getProgresso(userId)
      .then((ids) => setConcluidos(new Set(ids)))
      .catch(() => {})
  }, [userId])

  // Marca/desmarca de forma otimista (atualiza a UI na hora, desfaz se o back falhar).
  async function toggle(stepId: string) {
    const jaConcluido = concluidos.has(stepId)
    setConcluidos((prev) => {
      const next = new Set(prev)
      if (jaConcluido) next.delete(stepId)
      else next.add(stepId)
      return next
    })
    try {
      if (jaConcluido) await desmarcarPasso(userId, stepId)
      else await concluirPasso(userId, stepId)
    } catch {
      setConcluidos((prev) => {
        const next = new Set(prev)
        if (jaConcluido) next.add(stepId)
        else next.delete(stepId)
        return next
      })
    }
  }

  // Agrupa por fase preservando a ordem dos passos (o back já manda ordenado por Order).
  const fases = useMemo(() => {
    const grupos = new Map<string, TrailStep[]>()
    for (const step of trail) {
      const lista = grupos.get(step.phase) ?? []
      lista.push(step)
      grupos.set(step.phase, lista)
    }
    return [...grupos.entries()]
  }, [trail])

  const total = trail.length
  const feitos = trail.filter((step) => concluidos.has(step.id)).length
  const percent = total > 0 ? Math.round((feitos / total) * 100) : 0
  const completa = total > 0 && feitos === total

  const proximo = trail.find((step) => !concluidos.has(step.id))
  const faseAtualIndex = proximo ? fases.findIndex(([fase]) => fase === proximo.phase) : fases.length - 1

  // ---- Vista de UMA fase (entrou no card) ----
  if (faseSelecionada) {
    const passos = fases.find(([f]) => f === faseSelecionada)?.[1] ?? []
    const feitosFase = passos.filter((s) => concluidos.has(s.id)).length
    return (
      <div className="flex w-full max-w-2xl flex-col gap-5">
        <button
          type="button"
          onClick={() => setFaseSelecionada(null)}
          className="self-start text-sm text-neutral-400 hover:text-neutral-200"
        >
          ← Voltar pra jornada
        </button>
        <header className="flex items-center gap-3">
          <span className="text-3xl">{emojiDaFase(faseSelecionada)}</span>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-neutral-100">{faseSelecionada}</h2>
            <span className="text-sm text-neutral-500">
              {feitosFase} de {passos.length} passos concluídos
            </span>
          </div>
        </header>
        <ul className="flex flex-col gap-2">
          {passos.map((step) => (
            <PassoCard
              key={step.id}
              step={step}
              concluido={concluidos.has(step.id)}
              destaque={step.id === proximo?.id}
              onToggle={() => toggle(step.id)}
            />
          ))}
        </ul>
      </div>
    )
  }

  // ---- Home: hero + próximo passo + cards das fases ----
  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <header className="flex items-center gap-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <ProgressRing percent={percent}>
          <span className="text-xl font-bold text-neutral-100">{percent}%</span>
        </ProgressRing>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-neutral-400">Sua jornada</p>
          <h2 className="text-2xl font-bold text-neutral-100">Olá, {nome} 👋</h2>
          <p className="text-sm text-neutral-400">
            {feitos} de {total} passos · Fase {Math.min(faseAtualIndex + 1, fases.length)} de{' '}
            {fases.length}
          </p>
          {gestorNome && (
            <p className="text-xs text-neutral-500">
              Seu gestor: <span className="text-neutral-400">{gestorNome}</span>
            </p>
          )}
        </div>
      </header>

      {completa ? (
        <section className="flex flex-col items-center gap-2 rounded-2xl border border-purple-500/40 bg-purple-500/10 p-6 text-center">
          <span className="text-4xl">🏆</span>
          <h3 className="text-lg font-semibold text-neutral-100">Jornada completa!</h3>
          <p className="text-sm text-neutral-400">
            Você foi do clone ao primeiro card. Bem-vindo(a) de verdade à Agilean.
          </p>
        </section>
      ) : (
        proximo && (
          <section className="flex flex-col gap-3 rounded-2xl border border-purple-500/40 bg-purple-500/10 p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-purple-300">
                ▶ Próximo passo · {proximo.phase}
              </span>
              <h3 className="text-lg font-semibold text-neutral-100">{proximo.title}</h3>
              <p className="text-sm text-neutral-400">{proximo.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setFaseSelecionada(proximo.phase)}
              className="self-start rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400"
            >
              Ir para o passo
            </button>
          </section>
        )
      )}

      {/* Fases em cards — clica e entra na fase */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Fases da jornada
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fases.map(([fase, passos], i) => {
            const feitosFase = passos.filter((step) => concluidos.has(step.id)).length
            const pct = passos.length > 0 ? Math.round((feitosFase / passos.length) * 100) : 0
            const faseCompleta = feitosFase === passos.length
            const atual = proximo?.phase === fase
            return (
              <button
                key={fase}
                type="button"
                onClick={() => setFaseSelecionada(fase)}
                className={cx(
                  'flex flex-col gap-2 rounded-2xl border bg-neutral-900 p-5 text-left transition-all duration-200 hover:-translate-y-0.5',
                  atual
                    ? 'border-purple-500/60 hover:border-purple-500'
                    : 'border-neutral-800 hover:border-purple-500/50',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{emojiDaFase(fase)}</span>
                  {faseCompleta ? (
                    <span title="Fase concluída">🎖️</span>
                  ) : atual ? (
                    <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-medium text-purple-200">
                      Você está aqui
                    </span>
                  ) : (
                    <span className="text-neutral-600">›</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Fase {i + 1}
                  </span>
                  <h3 className="font-semibold text-neutral-100">{fase}</h3>
                </div>
                <span className="text-sm text-neutral-500">
                  {feitosFase} de {passos.length} passos
                </span>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={onRestart}
        className="self-center text-sm text-neutral-500 hover:text-neutral-300"
      >
        Refazer nivelamento
      </button>
    </div>
  )
}
