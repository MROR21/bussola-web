// Uma notificação in-app (espelha a entidade Notificacao do back).
export interface Notificacao {
  id: string
  usuarioId: string
  mensagem: string
  link: string
  lida: boolean
  criadaEm: string
  // Autor da notificação (gestor ou supervisionado) — pra mostrar avatar + nome ao lado, e
  // (autorId) pra filtrar o sino por pessoa quando tem mais de uma envolvida.
  autorId?: string | null
  autorNome?: string | null
  autorFoto?: string | null
}
