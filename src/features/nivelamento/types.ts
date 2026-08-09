// Espelham os enums do back (vêm/vão como texto no JSON).
export type Cargo = 'Estagiario' | 'Junior' | 'Pleno'
export type SkillLevel = 'Nenhum' | 'Basico' | 'Confortavel'

// Respostas do questionário: cargo + nível por área. Mesmo shape do record Perfil do back.
export interface Perfil {
  cargo: Cargo
  frontend: SkillLevel
  backend: SkillLevel
  git: SkillLevel
  sql: SkillLevel
  jira: SkillLevel
}

// Default = trilha completa essencial (usado quando o usuário PULA o questionário).
export const perfilPadrao: Perfil = {
  cargo: 'Estagiario',
  frontend: 'Nenhum',
  backend: 'Nenhum',
  git: 'Nenhum',
  sql: 'Nenhum',
  jira: 'Nenhum',
}
