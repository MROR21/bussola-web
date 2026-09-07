import type { Cargo } from '../nivelamento/types'

// Nome de exibição de cada Cargo — usado onde quer que o app mostre o cargo do supervisionado.
// A lista de acessos por cargo em si NÃO mora mais aqui: virou a entidade `Acesso` de verdade
// (CRUD em Admin > Acessos, ver AcessosAdmin.tsx), consultada via
// `getAcessosSupervisionado` (gestorService.ts) — antes era um rascunho ilustrativo hardcoded.
export const NOME_CARGO: Record<Cargo, string> = {
  Estagiario: 'Estagiário',
  Junior: 'Júnior',
  Pleno: 'Pleno',
}
