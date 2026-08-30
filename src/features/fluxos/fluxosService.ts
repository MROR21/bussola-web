import { apiGet, apiSend } from '../../services/api'
import type { Fluxo } from './types'

// Todos os fluxos do Guia pelo sistema — aberto a qualquer colaborador logado (sem recorte por
// squad). Já traz o conteúdo em Markdown de cada um, então a página de detalhe (rota por título)
// também usa esta lista, sem precisar de busca por id.
export function listarFluxos(): Promise<Fluxo[]> {
  return apiGet<Fluxo[]>('/fluxos')
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
