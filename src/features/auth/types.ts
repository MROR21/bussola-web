import type { Cargo, Perfil, Squad } from '../nivelamento/types'

// Usuário logado (o que o back devolve no /auth/login, dentro de "usuario").
export interface UsuarioLogado {
  id: string
  nome: string
  email: string
  cargo: Cargo
  squad: Squad
  isGestor: boolean
  // Foto de perfil (data URI base64). Ausente/vazio = sem foto (mostra as iniciais).
  foto?: string
}

// Dados completos do usuário (GET /users/{id}): inclui o perfil salvo e se já nivelou.
export interface UsuarioDetalhe extends UsuarioLogado {
  nivelamentoConcluido: boolean
  gestorNome: string | null
  perfil: Perfil
}
