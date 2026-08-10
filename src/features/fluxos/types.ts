// Um fluxo da Referência viva (espelha a entidade Fluxo do back, em camelCase).
export interface Fluxo {
  id: string
  order: number
  modulo: string
  categoria: string
  titulo: string
  descricao: string
  conteudo: string
  videoUrl: string
}
