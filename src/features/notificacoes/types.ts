// Uma notificação in-app (espelha a entidade Notificacao do back).
export interface Notificacao {
  id: string
  usuarioId: string
  mensagem: string
  link: string
  lida: boolean
  criadaEm: string
  // Autor da notificação (gestor ou supervisionado) — pra mostrar avatar + nome ao lado.
  autorNome?: string | null
  autorFoto?: string | null
}
