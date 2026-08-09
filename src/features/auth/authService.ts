import { apiPost } from '../../services/api'
import type { UsuarioLogado } from './types'

interface LoginResponse {
  token: string
  expiraEm: string
  usuario: UsuarioLogado
}

// Login demo: manda nome + email; o back faz get-or-create e devolve token + usuário.
export function login(nome: string, email: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/login', { nome, email })
}
