// O formato de um passo de onboarding (espelha a entidade do back, em camelCase).
export interface OnboardingStep {
  id: string
  order: number
  phase: string
  title: string
  description: string
  isCompanySpecific: boolean
  skillTag: string | null
}
