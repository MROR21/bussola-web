import { apiGet, apiPost, apiSend } from '../../services/api'
import type { ApiToken, ApiTokenCriado } from './types'

// Ações de Perfil/Config do próprio usuário logado. O back identifica o usuário pelo token
// (claim "sub"), então nenhum id vai no corpo. Todas respondem 204.

export function trocarEmail(email: string): Promise<void> {
  return apiSend('PUT', '/perfil/email', { email })
}

export function trocarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
  return apiSend('PUT', '/perfil/senha', { senhaAtual, novaSenha })
}

// Envia a foto como data URI base64. String vazia remove a foto.
export function trocarFoto(foto: string): Promise<void> {
  return apiSend('PUT', '/perfil/foto', { foto })
}

// Tokens de API (chamar o Bússola de fora — curl/scripts — com o mesmo acesso do usuário).
export function listarApiTokens(): Promise<ApiToken[]> {
  return apiGet<ApiToken[]>('/perfil/api-tokens')
}

// O `token` em texto puro só vem nessa resposta — o back nunca guarda nem devolve de novo.
export function criarApiToken(nome: string): Promise<ApiTokenCriado> {
  return apiPost<ApiTokenCriado>('/perfil/api-tokens', { nome })
}

export function revogarApiToken(id: string): Promise<void> {
  return apiSend('DELETE', `/perfil/api-tokens/${id}`)
}
