import { apiGet } from '../../services/api'
import type { UsuarioProgresso } from './types'

// Lista os usuários com o progresso (endpoint protegido pela policy "Gestor").
export function getUsuariosProgresso(): Promise<UsuarioProgresso[]> {
  return apiGet<UsuarioProgresso[]>('/gestor/usuarios')
}
