import { apiPost } from '../../services/api'
import type { UsuarioLogado } from './types'

interface LoginResponse {
  token: string
  expiraEm: string
  usuario: UsuarioLogado
}

// Cadastro não loga na hora — precisa confirmar o e-mail primeiro (código de 6 dígitos).
interface RegisterResponse {
  precisaConfirmarEmail: true
  email: string
}

// Login: e-mail + senha. Se o e-mail ainda não foi confirmado, o back responde 403 com
// `{ erro, precisaConfirmarEmail: true }` — ver `ApiError.corpo` em services/api.ts.
export function login(email: string, senha: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/login', { email, senha })
}

// Cadastro (auto-serviço): nome + e-mail + senha → cria a conta e manda o código de confirmação.
export function register(nome: string, email: string, senha: string): Promise<RegisterResponse> {
  return apiPost<RegisterResponse>('/auth/register', { nome, email, senha })
}

// Confirma o código recebido por e-mail — só depois disso a conta consegue logar por senha.
// Já devolve token (mesmo efeito de um login bem-sucedido), sem precisar de mais um passo.
export function confirmarEmail(email: string, codigo: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/confirmar-email', { email, codigo })
}

// Pede um código novo (substitui o anterior) — usado se o e-mail não chegou ou o código expirou.
export function reenviarCodigo(email: string): Promise<void> {
  return apiPost<{ ok: boolean }>('/auth/reenviar-codigo', { email }).then(() => undefined)
}

// Login via Microsoft: o front já autenticou com MSAL e manda o access token do Graph pro back
// validar (get-or-create da conta na primeira vez, sem senha).
export function loginComMicrosoft(accessToken: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/microsoft', { accessToken })
}
