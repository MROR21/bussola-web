import { apiSend } from '../../services/api'

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
