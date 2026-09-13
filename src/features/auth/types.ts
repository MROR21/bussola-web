import type { Cargo, Perfil } from '../nivelamento/types'

// Usuário logado (o que o back devolve no /auth/login, dentro de "usuario"). `squadId` só vem
// como id aqui (payload de autenticação, não tela de exibição) — quem precisa do nome busca a
// lista via listarSquads().
export interface UsuarioLogado {
  id: string
  nome: string
  email: string
  cargo: Cargo
  squadId: string
  isGestor: boolean
  // Foto de perfil (data URI base64). Ausente/vazio = sem foto (mostra as iniciais).
  foto?: string
}

// Dados completos do usuário (GET /users/{id}): inclui o perfil salvo e se já nivelou. `squad`
// aqui já vem com o nome pronto (denormalizado pelo back), diferente do `squadId` puro herdado.
export interface UsuarioDetalhe extends UsuarioLogado {
  squad: string
  nivelamentoConcluido: boolean
  gestorNome: string | null
  perfil: Perfil
}
