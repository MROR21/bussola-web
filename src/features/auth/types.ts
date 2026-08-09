import type { Cargo } from '../nivelamento/types'

// Usuário logado (o que o back devolve no /auth/login, dentro de "usuario").
export interface UsuarioLogado {
  id: string
  nome: string
  email: string
  cargo: Cargo
}
