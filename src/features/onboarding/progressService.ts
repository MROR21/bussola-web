import { apiGet, apiSend } from '../../services/api'

// Ids dos passos que o usuário já concluiu.
export function getProgresso(userId: string): Promise<string[]> {
  return apiGet<string[]>(`/users/${userId}/progress`)
}

// Comprovação de um passo (pra pré-preencher a tela do passo).
export function getComprovacao(
  userId: string,
  stepId: string,
): Promise<{ concluido: boolean; evidencia: string }> {
  return apiGet(`/users/${userId}/progress/${stepId}`)
}

// Marca um passo como concluído, com comprovação opcional (link do PR, print ou nota).
// Enviar de novo num passo já concluído só atualiza a comprovação.
export function concluirPasso(userId: string, stepId: string, evidencia = ''): Promise<void> {
  return apiSend('POST', `/users/${userId}/progress/${stepId}`, { evidencia })
}

// Desmarca um passo.
export function desmarcarPasso(userId: string, stepId: string): Promise<void> {
  return apiSend('DELETE', `/users/${userId}/progress/${stepId}`)
}
