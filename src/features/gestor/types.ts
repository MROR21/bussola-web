import type { Cargo, Squad } from '../nivelamento/types'

// Um usuário com o resumo de progresso (resposta de GET /gestor/usuarios).
export interface UsuarioProgresso {
  id: string
  nome: string
  email: string
  cargo: Cargo
  squad: Squad
  isGestor: boolean
  nivelamentoConcluido: boolean
  passosConcluidos: number
  totalPassos: number
  foto?: string | null
}

// Colaborador disponível pra virar supervisionado (GET /gestor/disponiveis).
export interface UsuarioDisponivel {
  id: string
  nome: string
  email: string
  cargo: Cargo
}

// Um passo com a flag de concluído (detalhe do progresso de um supervisionado).
export interface PassoProgresso {
  id: string
  order: number
  phase: string
  title: string
  concluido: boolean
  // Comprovação anexada pelo supervisionado (link do PR, print ou nota). Vazio = sem comprovação.
  evidencia: string
  // O gestor pediu correção nesse PR (comentários ficam no Bitbucket, isso é só o status) — só o
  // gestor liga, só o colaborador desliga (depois de corrigir e atualizar a mesma branch/PR).
  precisaCorrecao: boolean
  // Quantos ciclos de correção já fecharam (incrementa toda vez que o colaborador marca
  // "corrigido"). "Pedir correção" continua disponível mesmo com QtdCorrecoes > 0 — é só histórico.
  qtdCorrecoes: number
  // O colaborador marcou como corrigido, mas o gestor ainda não confirmou/revisou — true até o
  // gestor conferir e confirmar (ou pedir correção de novo).
  aguardandoConfirmacao: boolean
}

// Progresso detalhado de um supervisionado (GET /gestor/usuarios/{id}/progresso).
export interface ProgressoSupervisionado {
  nome: string
  cargo: Cargo
  passos: PassoProgresso[]
}

// Um fluxo do guia com a flag de concluído do supervisionado (GET /gestor/usuarios/{id}/fluxos).
// doSquad marca os que fazem parte do onboarding dele (o squad do próprio supervisionado).
export interface FluxoProgresso {
  id: string
  titulo: string
  modulo: string
  concluido: boolean
  doSquad: boolean
}

// Um acesso a liberar (já filtrado pelo Cargo do supervisionado) com a flag de concluído
// (GET /gestor/usuarios/{id}/acessos).
export interface AcessoProgresso {
  id: string
  nome: string
  link: string
  concluido: boolean
}

// Resposta de GET .../card-link — url ausente/null = o gestor ainda não enviou o card.
export interface CardLinkResposta {
  url: string | null
}
