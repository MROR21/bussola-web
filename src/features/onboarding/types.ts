// Área de conhecimento de um passo (espelha o enum SkillArea do back; vem como texto no JSON).
export type SkillArea = 'None' | 'Frontend' | 'Backend' | 'Git' | 'Sql' | 'Jira'

// O formato de um passo de onboarding (espelha a entidade do back, em camelCase).
export interface OnboardingStep {
  id: string
  order: number
  phase: string
  title: string
  description: string
  isCompanySpecific: boolean
  skillArea: SkillArea
  conteudo: string
}

// Profundidade recomendada de um passo, calculada pelo back a partir do Perfil.
export type StepDepth = 'Essencial' | 'Resumo'

// Um passo já com a profundidade recomendada (resposta do POST /onboarding/trail).
export interface TrailStep extends OnboardingStep {
  recommendedDepth: StepDepth
}
