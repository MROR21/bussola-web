import { apiGet, apiSend } from '../../services/api'
import type { UsuarioDisponivel, UsuarioProgresso } from './types'

// Supervisionados do gestor logado, com progresso (endpoint protegido pela policy "Gestor").
export function getUsuariosProgresso(): Promise<UsuarioProgresso[]> {
  return apiGet<UsuarioProgresso[]>('/gestor/usuarios')
}

// Colaboradores disponíveis pra adicionar como supervisionado.
export function getDisponiveis(): Promise<UsuarioDisponivel[]> {
  return apiGet<UsuarioDisponivel[]>('/gestor/disponiveis')
}

export function adicionarSupervisionado(usuarioId: string): Promise<void> {
  return apiSend('POST', `/gestor/supervisionados/${usuarioId}`)
}

export function removerSupervisionado(usuarioId: string): Promise<void> {
  return apiSend('DELETE', `/gestor/supervisionados/${usuarioId}`)
}
