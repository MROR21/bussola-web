import type { Cargo } from '../nivelamento/types'

// Um usuário com o resumo de progresso (resposta de GET /gestor/usuarios).
export interface UsuarioProgresso {
  id: string
  nome: string
  email: string
  cargo: Cargo
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
