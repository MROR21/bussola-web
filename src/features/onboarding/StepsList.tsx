import { useEffect, useState } from 'react'
import { getOnboardingSteps } from './onboardingService'
import type { OnboardingStep } from './types'

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

  return (
    <ul className="flex w-full max-w-lg flex-col gap-2">
      {steps.map((step) => (
        <li
          key={step.id}
          className="rounded-lg border border-neutral-800 bg-neutral-900 p-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">{step.order}.</span>
            <span className="font-medium">{step.title}</span>
            {step.isCompanySpecific && (
              <span className="ml-auto rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
                Agilean
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-400">{step.description}</p>
          <span className="mt-2 inline-block text-xs text-neutral-600">
            {step.phase}
          </span>
        </li>
      ))}
    </ul>
  )
}
