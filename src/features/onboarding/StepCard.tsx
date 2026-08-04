import type { OnboardingStep } from './types'

// Um cartão de um passo. Recebe o passo via props e só mostra — componente "burro" (de apresentação).
export function StepCard({ step }: { step: OnboardingStep }) {
  return (
    <li className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
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
    </li>
  )
}
