import { apiGet, apiSend } from '../../services/api'
import type { Atribuicao, Fluxo } from './types'

// Todos os fluxos (usado pelo gestor, que vê todos os squads).
export function listarFluxos(): Promise<Fluxo[]> {
  return apiGet<Fluxo[]>('/fluxos')
}

// Fluxos visíveis do usuário logado (squad + Básico + atribuídos) — usado pelo colaborador.
export function getMeusFluxos(): Promise<Fluxo[]> {
  return apiGet<Fluxo[]>('/fluxos/meus')
}

// Um fluxo específico (com o conteúdo em Markdown).
export function getFluxo(id: string): Promise<Fluxo> {
  return apiGet<Fluxo>(`/fluxos/${id}`)
}

// Atribuições dos supervisionados do gestor (quem tem qual fluxo).
export function getAtribuicoes(): Promise<Atribuicao[]> {
  return apiGet<Atribuicao[]>('/gestor/fluxos/atribuicoes')
}

// Atribui (libera) um fluxo a um supervisionado.
export function atribuirFluxo(fluxoId: string, usuarioId: string): Promise<void> {
  return apiSend('POST', `/gestor/fluxos/${fluxoId}/atribuir/${usuarioId}`)
}

// Ids dos fluxos que o usuário logado já concluiu.
export function getFluxosConcluidos(): Promise<string[]> {
  return apiGet<string[]>('/fluxos/concluidos')
}

export function concluirFluxo(fluxoId: string): Promise<void> {
  return apiSend('POST', `/fluxos/${fluxoId}/concluir`)
}

export function desmarcarFluxo(fluxoId: string): Promise<void> {
  return apiSend('DELETE', `/fluxos/${fluxoId}/concluir`)
}
