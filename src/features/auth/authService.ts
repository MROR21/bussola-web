import { apiPost } from '../../services/api'
import type { UsuarioLogado } from './types'

interface LoginResponse {
  token: string
  expiraEm: string
  usuario: UsuarioLogado
}

// Login: e-mail + senha.
export function login(email: string, senha: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/login', { email, senha })
}

// Cadastro (auto-serviço): nome + e-mail + senha → cria a conta e já loga.
export function register(nome: string, email: string, senha: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/register', { nome, email, senha })
}

// Login via Microsoft: o front já autenticou com MSAL e manda o access token do Graph pro back
// validar (get-or-create da conta na primeira vez, sem senha).
export function loginComMicrosoft(accessToken: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/microsoft', { accessToken })
}
