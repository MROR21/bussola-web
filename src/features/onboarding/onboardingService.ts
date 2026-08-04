import { apiGet } from '../../services/api'
import type { OnboardingStep } from './types'

// Busca os passos de onboarding no back (GET /onboarding/steps).
export function getOnboardingSteps(): Promise<OnboardingStep[]> {
  return apiGet<OnboardingStep[]>('/onboarding/steps')
}
