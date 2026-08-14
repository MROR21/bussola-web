import { apiGet, apiPost, apiSend } from '../../services/api'
import type {
  EntidadeSimples,
  Fase,
  Modulo,
  FluxoAdmin,
  FluxoAdminInput,
  PassoAdmin,
  PassoAdminInput,
} from './types'

// Fases
export const listarFases = () => apiGet<Fase[]>('/admin/fases')
export const criarFase = (nome: string, order: number) =>
  apiPost<EntidadeSimples>('/admin/fases', { nome, order })
export const editarFase = (id: string, nome: string, order: number) =>
  apiSend('PUT', `/admin/fases/${id}`, { nome, order })
export const apagarFase = (id: string) => apiSend('DELETE', `/admin/fases/${id}`)

// Módulos
export const listarModulos = () => apiGet<Modulo[]>('/admin/modulos')
export const criarModulo = (nome: string, order: number) =>
  apiPost<EntidadeSimples>('/admin/modulos', { nome, order })
export const editarModulo = (id: string, nome: string, order: number) =>
  apiSend('PUT', `/admin/modulos/${id}`, { nome, order })
export const apagarModulo = (id: string) => apiSend('DELETE', `/admin/modulos/${id}`)

// Passos
export const listarPassosAdmin = () => apiGet<PassoAdmin[]>('/admin/passos')
export const criarPasso = (req: PassoAdminInput) => apiPost<PassoAdmin>('/admin/passos', req)
export const editarPasso = (id: string, req: PassoAdminInput) =>
  apiSend('PUT', `/admin/passos/${id}`, req)
export const apagarPasso = (id: string) => apiSend('DELETE', `/admin/passos/${id}`)

// Fluxos
export const listarFluxosAdmin = () => apiGet<FluxoAdmin[]>('/admin/fluxos')
export const criarFluxo = (req: FluxoAdminInput) => apiPost<FluxoAdmin>('/admin/fluxos', req)
export const editarFluxo = (id: string, req: FluxoAdminInput) =>
  apiSend('PUT', `/admin/fluxos/${id}`, req)
export const apagarFluxo = (id: string) => apiSend('DELETE', `/admin/fluxos/${id}`)
