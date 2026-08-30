import { apiGet } from '../../services/api'
import type { OnboardingStep } from './types'

// Todos os passos da Jornada, na ordem — usado pra montar a árvore de fases no menu lateral.
export function listarSteps(): Promise<OnboardingStep[]> {
  return apiGet<OnboardingStep[]>('/onboarding/steps')
}

// Busca um passo específico (com o conteúdo em Markdown) — usado na página de detalhe.
export function getStep(id: string): Promise<OnboardingStep> {
  return apiGet<OnboardingStep>(`/onboarding/steps/${id}`)
}
