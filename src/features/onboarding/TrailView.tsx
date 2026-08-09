import { useEffect, useState } from 'react'
import type { TrailStep } from './types'
import { concluirPasso, desmarcarPasso, getProgresso } from './progressService'

// Card de um passo. Checkbox = concluído (persiste no back). Essencial = descrição aberta;
// Resumo = recolhido (abre no clique).
function TrailStepCard({
  step,
  concluido,
  onToggle,
}: {
  step: TrailStep
  concluido: boolean
  onToggle: () => void
}) {
  const isResumo = step.recommendedDepth === 'Resumo'
  const [expanded, setExpanded] = useState(!isResumo)

  return (
    <li className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={concluido}
          onChange={onToggle}
          className="size-4 accent-purple-500"
        />
        <span className="text-sm text-neutral-500">{step.order}.</span>
        <span className={'font-medium ' + (concluido ? 'text-neutral-500 line-through' : '')}>
          {step.title}
        </span>
        {step.isCompanySpecific && (
          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
            Agilean
          </span>
        )}
        {isResumo && (
          <span className="ml-auto rounded-full bg-neutral-700/50 px-2 py-0.5 text-xs text-neutral-300">
            Resumo
          </span>
        )}
      </div>

      {expanded ? (
        <p className="mt-1 pl-6 text-sm text-neutral-400">{step.description}</p>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 pl-6 text-sm text-purple-300 hover:text-purple-200"
        >
          Ver detalhes
        </button>
      )}
    </li>
  )
}

// Trilha personalizada + progresso. Carrega os passos concluídos do usuário e deixa marcar/desmarcar.
export function TrailView({
  trail,
  userId,
  onRestart,
}: {
  trail: TrailStep[]
  userId: string
  onRestart: () => void
}) {
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())

  // Carrega o progresso salvo do usuário quando a trilha aparece.
  useEffect(() => {
    getProgresso(userId)
      .then((ids) => setConcluidos(new Set(ids)))
      .catch(() => {})
  }, [userId])

  // Marca/desmarca (otimista: atualiza a UI na hora e chama o back; desfaz se falhar).
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

  const stepsByPhase = trail.reduce<Record<string, TrailStep[]>>((groups, step) => {
    const phaseGroup = groups[step.phase] ?? []
    phaseGroup.push(step)
    groups[step.phase] = phaseGroup
    return groups
  }, {})

  const feitos = trail.filter((step) => concluidos.has(step.id)).length
  const total = trail.length
  const percent = total > 0 ? Math.round((feitos / total) * 100) : 0

  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-400">
            Sua jornada • {feitos}/{total} concluídos
          </p>
          <button
            type="button"
            onClick={onRestart}
            className="text-sm text-neutral-400 hover:text-neutral-200"
          >
            Refazer nivelamento
          </button>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-purple-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {Object.entries(stepsByPhase).map(([phase, phaseSteps]) => (
        <section key={phase} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {phase}
            <span className="ml-2 font-normal normal-case text-neutral-600">
              ({phaseSteps.length})
            </span>
          </h2>
          <ul className="flex flex-col gap-2">
            {phaseSteps.map((step) => (
              <TrailStepCard
                key={step.id}
                step={step}
                concluido={concluidos.has(step.id)}
                onToggle={() => toggle(step.id)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
