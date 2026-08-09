import { useState } from 'react'
import type { TrailStep } from './types'

// Card de um passo da trilha. Essencial = descrição aberta; Resumo = recolhido (abre no clique).
function TrailStepCard({ step }: { step: TrailStep }) {
  const isResumo = step.recommendedDepth === 'Resumo'
  const [expanded, setExpanded] = useState(!isResumo)

  return (
    <li className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-500">{step.order}.</span>
        <span className="font-medium">{step.title}</span>
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
        <p className="mt-1 text-sm text-neutral-400">{step.description}</p>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 text-sm text-purple-300 hover:text-purple-200"
        >
          Ver detalhes
        </button>
      )}
    </li>
  )
}

// Renderiza a trilha personalizada: agrupa por fase e mostra cada passo pela profundidade recomendada.
export function TrailView({
  trail,
  onRestart,
}: {
  trail: TrailStep[]
  onRestart: () => void
}) {
  const stepsByPhase = trail.reduce<Record<string, TrailStep[]>>((groups, step) => {
    const phaseGroup = groups[step.phase] ?? []
    phaseGroup.push(step)
    groups[step.phase] = phaseGroup
    return groups
  }, {})

  const resumoCount = trail.filter((step) => step.recommendedDepth === 'Resumo').length

  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">
          Sua trilha • {trail.length} passos
          {resumoCount > 0 ? ` • ${resumoCount} em resumo` : ''}
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="text-sm text-neutral-400 hover:text-neutral-200"
        >
          Refazer nivelamento
        </button>
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
              <TrailStepCard key={step.id} step={step} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
