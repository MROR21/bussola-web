import type { Cargo } from '../nivelamento/types'

// Acessos que o gestor precisa liberar pra um supervisionado, de acordo com o Cargo dele.
// Cumulativo por design (cada cargo tem tudo do anterior + pelo menos 1 a mais) — é um RASCUNHO
// ilustrativo enquanto o Miguel não fecha a lista real com o gestor dele; ajustar aqui quando
// tiver a lista definitiva (sem precisar mexer em mais nada — é só esse arquivo).
const ACESSOS_ESTAGIARIO = [
  'E-mail Agilean',
  'Teams',
  'Agilean Flow',
  'VS Code / Visual Studio',
  'Atlassian (Jira + Bitbucket)',
  'Bússola',
]
const ACESSOS_JUNIOR = [...ACESSOS_ESTAGIARIO, 'Zendesk']
const ACESSOS_PLENO = [...ACESSOS_JUNIOR, 'Azure DevOps']

export const ACESSOS_POR_CARGO: Record<Cargo, string[]> = {
  Estagiario: ACESSOS_ESTAGIARIO,
  Junior: ACESSOS_JUNIOR,
  Pleno: ACESSOS_PLENO,
}

export const NOME_CARGO: Record<Cargo, string> = {
  Estagiario: 'Estagiário',
  Junior: 'Júnior',
  Pleno: 'Pleno',
}
