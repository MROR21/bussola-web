import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UsuarioLogado } from './types'

// Estado de sessão (usuário logado + token JWT). O middleware `persist` salva no
// localStorage, então sobrevive ao F5 — mesmo padrão do useSessionStore da Agilean.
interface AuthState {
  usuario: UsuarioLogado | null
  token: string | null
  // Motivo de um logout FORÇADO (sessão expirada, acesso revogado) — a tela de login lê e mostra
  // uma vez, depois limpa. `undefined` = não mexe nele (usado no logout manual, por opção do
  // usuário, que não deve deixar nenhuma mensagem pra trás).
  motivoSaida: string | null
  // Só true na primeira vez, logo após um CADASTRO novo (não em todo login) — o modal de boas-
  // vindas lê 1x e fecha sozinho.
  boasVindasPendente: boolean
  login: (usuario: UsuarioLogado, token: string, novoCadastro?: boolean) => void
  atualizarUsuario: (patch: Partial<UsuarioLogado>) => void
  logout: (motivo?: string) => void
  limparMotivoSaida: () => void
  fecharBoasVindas: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      token: null,
      motivoSaida: null,
      boasVindasPendente: false,
      login: (usuario, token, novoCadastro) =>
        set({ usuario, token, motivoSaida: null, boasVindasPendente: Boolean(novoCadastro) }),
      // Atualiza campos do usuário na sessão sem relogar (ex.: squad ao refazer o nivelamento).
      atualizarUsuario: (patch) =>
        set((s) => (s.usuario ? { usuario: { ...s.usuario, ...patch } } : {})),
      logout: (motivo) => set({ usuario: null, token: null, motivoSaida: motivo ?? null }),
      limparMotivoSaida: () => set({ motivoSaida: null }),
      fecharBoasVindas: () => set({ boasVindasPendente: false }),
    }),
    { name: 'bussola-auth' },
  ),
)
