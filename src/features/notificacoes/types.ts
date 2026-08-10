// Uma notificação in-app (espelha a entidade Notificacao do back).
export interface Notificacao {
  id: string
  usuarioId: string
  mensagem: string
  lida: boolean
  criadaEm: string
}
