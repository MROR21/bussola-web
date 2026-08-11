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
}

// Progresso detalhado de um supervisionado (GET /gestor/usuarios/{id}/progresso).
export interface ProgressoSupervisionado {
  nome: string
  passos: PassoProgresso[]
}

// Um fluxo visível do supervisionado com a flag de concluído (GET /gestor/usuarios/{id}/fluxos).
export interface FluxoProgresso {
  id: string
  titulo: string
  modulo: string
  concluido: boolean
}
