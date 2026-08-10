import { apiGet, apiSend } from '../../services/api'
import type { Notificacao } from './types'

// Notificações do usuário logado (o back lê o id do token).
export function getNotificacoes(): Promise<Notificacao[]> {
  return apiGet<Notificacao[]>('/notificacoes')
}

// Marca todas as não-lidas como lidas.
export function marcarLidas(): Promise<void> {
  return apiSend('POST', '/notificacoes/ler')
}
