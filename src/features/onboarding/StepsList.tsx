import { useEffect, useState } from 'react'
import { getOnboardingSteps } from './onboardingService'
import type { OnboardingStep } from './types'
import { StepCard } from './StepCard'

export function StepsList() {
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // useEffect com [] roda 1x quando o componente monta: busca os dados da API.
  useEffect(() => {
    getOnboardingSteps()
      .then(setSteps)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-neutral-400">Carregando passos...</p>
  if (error) return <p className="text-red-400">Erro: {error}</p>

  // Agrupa os passos por fase. O reduce "acumula" cada passo no grupo da sua fase.
  // Como a API já manda ordenado, as fases aparecem na ordem de primeira aparição.
  const stepsByPhase = steps.reduce<Record<string, OnboardingStep[]>>((groups, step) => {
    const phaseGroup = groups[step.phase] ?? []
    phaseGroup.push(step)
    groups[step.phase] = phaseGroup
    return groups
  }, {})

  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      {/* Object.entries transforma o objeto {fase: passos[]} em pares [fase, passos[]] pra mapear */}
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
              <StepCard key={step.id} step={step} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
