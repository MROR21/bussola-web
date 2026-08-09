import { apiGet } from '../../services/api'
import type { UsuarioDetalhe } from './types'

// Busca o usuário completo (perfil salvo + flag de nivelamento).
export function getUser(id: string): Promise<UsuarioDetalhe> {
  return apiGet<UsuarioDetalhe>(`/users/${id}`)
}
