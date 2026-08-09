import { apiGet } from '../../services/api'
import type { Fluxo } from './types'

// Lista todos os fluxos (a busca é feita no front).
export function listarFluxos(): Promise<Fluxo[]> {
  return apiGet<Fluxo[]>('/fluxos')
}

// Um fluxo específico (com o conteúdo em Markdown).
export function getFluxo(id: string): Promise<Fluxo> {
  return apiGet<Fluxo>(`/fluxos/${id}`)
}
