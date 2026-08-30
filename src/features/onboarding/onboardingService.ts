import { apiGet } from '../../services/api'
import type { OnboardingStep } from './types'

// Todos os passos da Jornada, na ordem — já traz o conteúdo em Markdown de cada um, então a
// página de detalhe (rota por título) também usa esta lista, sem precisar de busca por id.
export function listarSteps(): Promise<OnboardingStep[]> {
  return apiGet<OnboardingStep[]>('/onboarding/steps')
}
