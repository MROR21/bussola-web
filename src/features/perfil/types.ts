// Token de API já existente — nunca carrega o valor em si, só o que dá pra listar/revogar.
export interface ApiToken {
  id: string
  nome: string
  criadoEm: string
  ultimoUsoEm: string | null
}

// Resposta da criação — o único momento em que o valor em texto puro existe do lado de cá.
export interface ApiTokenCriado {
  id: string
  nome: string
  criadoEm: string
  token: string
}
