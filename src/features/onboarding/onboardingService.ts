import { apiGet } from '../../services/api'
import type { OnboardingStep } from './types'

// Busca um passo específico (com o conteúdo em Markdown) — usado na página de detalhe.
export function getStep(id: string): Promise<OnboardingStep> {
  return apiGet<OnboardingStep>(`/onboarding/steps/${id}`)
}
