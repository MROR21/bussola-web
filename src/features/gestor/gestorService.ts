import { apiGet, apiSend } from '../../services/api'
import type {
  FluxoProgresso,
  ProgressoSupervisionado,
  UsuarioDisponivel,
  UsuarioProgresso,
} from './types'

// Supervisionados do gestor logado, com progresso (endpoint protegido pela policy "Gestor").
export function getUsuariosProgresso(): Promise<UsuarioProgresso[]> {
  return apiGet<UsuarioProgresso[]>('/gestor/usuarios')
}

// Progresso passo-a-passo de um supervisionado (nome + passos).
export function getProgressoDetalhado(usuarioId: string): Promise<ProgressoSupervisionado> {
  return apiGet<ProgressoSupervisionado>(`/gestor/usuarios/${usuarioId}/progresso`)
}

// Fluxos visíveis do supervisionado com a flag de concluído.
export function getFluxosSupervisionado(usuarioId: string): Promise<FluxoProgresso[]> {
  return apiGet<FluxoProgresso[]>(`/gestor/usuarios/${usuarioId}/fluxos`)
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
