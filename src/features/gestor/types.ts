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
