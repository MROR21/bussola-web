import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UsuarioLogado } from './types'

// Estado de sessão (usuário logado + token JWT). O middleware `persist` salva no
// localStorage, então sobrevive ao F5 — mesmo padrão do useSessionStore da Agilean.
interface AuthState {
  usuario: UsuarioLogado | null
  token: string | null
  login: (usuario: UsuarioLogado, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      token: null,
      login: (usuario, token) => set({ usuario, token }),
      logout: () => set({ usuario: null, token: null }),
    }),
    { name: 'bussola-auth' },
  ),
)
