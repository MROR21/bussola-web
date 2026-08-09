import { apiGet, apiSend } from '../../services/api'

// Ids dos passos que o usuário já concluiu.
export function getProgresso(userId: string): Promise<string[]> {
  return apiGet<string[]>(`/users/${userId}/progress`)
}

// Marca um passo como concluído.
export function concluirPasso(userId: string, stepId: string): Promise<void> {
  return apiSend('POST', `/users/${userId}/progress/${stepId}`)
}

// Desmarca um passo.
export function desmarcarPasso(userId: string, stepId: string): Promise<void> {
  return apiSend('DELETE', `/users/${userId}/progress/${stepId}`)
}
