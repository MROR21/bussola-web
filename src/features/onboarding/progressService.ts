import { apiGet, apiSend } from '../../services/api'
import type { AcessoProgresso, CardLinkResposta } from '../gestor/types'

// Ids dos passos que o usuário já concluiu (`completos`, tem registro — é o que faz a barra de
// progresso sentir o envio/cancelamento da comprovação como avanço/retrocesso) e, dentro desses,
// quais ainda estão pendentes de avaliação do gestor (`pendentes`, correção pedida OU aguardando
// aprovação) — usado pra saber se a fase/Jornada fechou de VERDADE (só quando não sobra pendente).
export function getProgresso(userId: string): Promise<{ completos: string[]; pendentes: string[] }> {
  return apiGet(`/users/${userId}/progress`)
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
): Promise<{
  concluido: boolean
  evidencia: string
  precisaCorrecao: boolean
  qtdCorrecoes: number
  aguardandoConfirmacao: boolean
}> {
  return apiGet(`/users/${userId}/progress/${stepId}`)
}

// Marca que já corrigiu o PR (push feito na mesma branch) — avisa o gestor que pode conferir de
// novo. Desliga o aviso "precisa de correção" que o gestor tinha ligado.
export function marcarCorrigido(userId: string, stepId: string): Promise<void> {
  return apiSend('PUT', `/users/${userId}/progress/${stepId}/corrigido`)
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

// Link do card que o gestor enviou (null = ainda não enviou — é o que trava os passos da fase
// "Primeiro Card" pro colaborador, ver JornadaView.tsx).
export function getMeuCardLink(userId: string): Promise<CardLinkResposta> {
  return apiGet<CardLinkResposta>(`/users/${userId}/card-link`)
}
