import type { Squad } from '../nivelamento/types'

// Um fluxo da Referência viva (espelha a entidade Fluxo do back, em camelCase).
export interface Fluxo {
  id: string
  order: number
  modulo: string
  squad: Squad | null
  categoria: string
  titulo: string
  descricao: string
  conteudo: string
  videoUrl: string
}

// Atribuição de um fluxo a um supervisionado (quem tem qual fluxo), pro painel do gestor.
export interface Atribuicao {
  fluxoId: string
  usuarioId: string
  nome: string
}
