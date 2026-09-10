import { apiGet, apiSend } from '../../services/api'
import type {
  AcessoProgresso,
  CardLinkResposta,
  FluxoProgresso,
  ProgressoSupervisionado,
  UsuarioDisponivel,
  UsuarioProgresso,
} from './types'

// Supervisionados do gestor logado, com progresso (endpoint protegido pela policy "Gestor").
export function getUsuariosProgresso(): Promise<UsuarioProgresso[]> {
  return apiGet<UsuarioProgresso[]>('/gestor/usuarios')
}

// Progresso passo-a-passo de um supervisionado (nome + passos).
export function getProgressoDetalhado(usuarioId: string): Promise<ProgressoSupervisionado> {
  return apiGet<ProgressoSupervisionado>(`/gestor/usuarios/${usuarioId}/progresso`)
}

// Fluxos visíveis do supervisionado com a flag de concluído.
export function getFluxosSupervisionado(usuarioId: string): Promise<FluxoProgresso[]> {
  return apiGet<FluxoProgresso[]>(`/gestor/usuarios/${usuarioId}/fluxos`)
}

// Colaboradores disponíveis pra adicionar como supervisionado.
export function getDisponiveis(): Promise<UsuarioDisponivel[]> {
  return apiGet<UsuarioDisponivel[]>('/gestor/disponiveis')
}

export function adicionarSupervisionado(usuarioId: string): Promise<void> {
  return apiSend('POST', `/gestor/supervisionados/${usuarioId}`)
}

export function removerSupervisionado(usuarioId: string): Promise<void> {
  return apiSend('DELETE', `/gestor/supervisionados/${usuarioId}`)
}

// Acessos a liberar pro supervisionado (já filtrados pelo Cargo dele) com a flag de concluído.
export function getAcessosSupervisionado(usuarioId: string): Promise<AcessoProgresso[]> {
  return apiGet<AcessoProgresso[]>(`/gestor/usuarios/${usuarioId}/acessos`)
}

// Marca (ou desmarca) um acesso como liberado pro supervisionado.
export function marcarAcessoConcluido(
  usuarioId: string,
  acessoId: string,
  concluido: boolean,
): Promise<void> {
  return apiSend('PUT', `/gestor/usuarios/${usuarioId}/acessos/${acessoId}`, { concluido })
}

// Link do card já enviado pro supervisionado (null = ainda não enviou).
export function getCardLinkSupervisionado(usuarioId: string): Promise<CardLinkResposta> {
  return apiGet<CardLinkResposta>(`/gestor/usuarios/${usuarioId}/card-link`)
}

// Envia (ou reenvia/sobrescreve) o link do card pro supervisionado.
export function enviarCardLink(usuarioId: string, url: string): Promise<void> {
  return apiSend('PUT', `/gestor/usuarios/${usuarioId}/card-link`, { url })
}

// Gestor pede correção no PR já enviado como comprovação (os comentários ficam no Bitbucket —
// isso só liga o aviso pro colaborador). Só desliga quando ELE marcar que corrigiu.
export function pedirCorrecaoPasso(usuarioId: string, stepId: string): Promise<void> {
  return apiSend('PUT', `/gestor/usuarios/${usuarioId}/passos/${stepId}/pedir-correcao`)
}

// Gestor confere a correção marcada pelo colaborador e confirma que está tudo certo — fecha o
// ciclo (aguardandoConfirmacao = false) e avisa o colaborador.
export function confirmarCorrecaoPasso(usuarioId: string, stepId: string): Promise<void> {
  return apiSend('PUT', `/gestor/usuarios/${usuarioId}/passos/${stepId}/confirmar`)
}
