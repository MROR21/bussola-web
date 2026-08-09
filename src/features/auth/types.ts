import type { Cargo, Perfil } from '../nivelamento/types'

// Usuário logado (o que o back devolve no /auth/login, dentro de "usuario").
export interface UsuarioLogado {
  id: string
  nome: string
  email: string
  cargo: Cargo
}

// Dados completos do usuário (GET /users/{id}): inclui o perfil salvo e se já nivelou.
export interface UsuarioDetalhe extends UsuarioLogado {
  nivelamentoConcluido: boolean
  perfil: Perfil
}
