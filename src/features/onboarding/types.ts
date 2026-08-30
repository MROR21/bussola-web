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

// Um item da trilha: um passo de onboarding OU um fluxo do squad (o back unifica os dois no mesmo
// formato). `tipo` diz pra onde navegar (/passo/:titulo ou /fluxo/:titulo) e onde marcar a conclusão.
export interface TrailStep extends OnboardingStep {
  recommendedDepth: StepDepth
  tipo: 'passo' | 'fluxo'
}
