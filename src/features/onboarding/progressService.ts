import { apiGet, apiSend } from '../../services/api'
import type { AcessoProgresso } from '../gestor/types'

// Ids dos passos que o usuário já concluiu.
export function getProgresso(userId: string): Promise<string[]> {
  return apiGet<string[]>(`/users/${userId}/progress`)
}

// Os PRÓPRIOS acessos do colaborador — leitura só, quem marca é o gestor (ver
// SupervisionadoPage.tsx). Mesmo formato de GET /gestor/usuarios/{id}/acessos, só que
// auto-escopado pelo token (o back confere `sub === id`).
export function getMeusAcessos(userId: string): Promise<AcessoProgresso[]> {
  return apiGet<AcessoProgresso[]>(`/users/${userId}/acessos`)
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
