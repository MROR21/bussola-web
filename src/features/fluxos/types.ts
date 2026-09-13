// Fluxo (passo a passo) ou Documentação (referência) — duas abas do mesmo módulo/squad, mesma
// entidade no back (campo Tipo).
export type TipoConteudo = 'Fluxo' | 'Documentacao'

// Módulo público (GET /modulos) — usado só pra saber QUAIS módulos existem e sua categoria
// (squadId), independente de já terem algum fluxo dentro ou não. Sem isso, GuiasPage.tsx só
// conseguia "descobrir" um módulo através dos próprios fluxos, então um módulo recém-criado
// (ainda vazio) nunca aparecia na tela até alguém colocar o primeiro fluxo dentro dele.
export interface ModuloPublico {
  id: string
  nome: string
  order: number
  squadId: string | null
}

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
