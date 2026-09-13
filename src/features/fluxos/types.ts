// Fluxo (passo a passo) ou Documentação (referência) — duas abas do mesmo módulo/squad, mesma
// entidade no back (campo Tipo).
export type TipoConteudo = 'Fluxo' | 'Documentacao'

// Um fluxo do Guia pelo sistema (espelha a entidade Fluxo do back, em camelCase). `squad`/`modulo`
// já vêm com o NOME pronto pra exibir (denormalizado pelo back) — não é mais um id pra resolver.
export interface Fluxo {
  id: string
  order: number
  modulo: string
  moduloSquadId: string | null
  squadId: string | null
  squad: string | null
  tipo: TipoConteudo
  categoria: string
  titulo: string
  descricao: string
  conteudo: string
  videoUrl: string
}
