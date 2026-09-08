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
  // Se o modal de boas-vindas (colaborador: Jornada / gestor: Supervisionados) já foi visto POR
  // ESSE usuário — chaveado por id (não uma flag solta) porque o `persist` salva no localStorage
  // do NAVEGADOR, não por conta: num computador compartilhado, uma flag solta faria a 2ª pessoa a
  // logar ali herdar o "já vi" da 1ª e nunca ver o dela. Cada tela também tem um botão pra reabrir
  // a qualquer momento, sem depender dessa flag.
  boasVindasVistas: Record<string, { jornada?: boolean; supervisor?: boolean }>
  login: (usuario: UsuarioLogado, token: string) => void
  atualizarUsuario: (patch: Partial<UsuarioLogado>) => void
  logout: (motivo?: string) => void
  limparMotivoSaida: () => void
  marcarBoasVindasVista: (usuarioId: string, tipo: 'jornada' | 'supervisor') => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      token: null,
      motivoSaida: null,
      boasVindasVistas: {},
      login: (usuario, token) => set({ usuario, token, motivoSaida: null }),
      // Atualiza campos do usuário na sessão sem relogar (ex.: squad ao refazer o nivelamento).
      atualizarUsuario: (patch) =>
        set((s) => (s.usuario ? { usuario: { ...s.usuario, ...patch } } : {})),
      logout: (motivo) => set({ usuario: null, token: null, motivoSaida: motivo ?? null }),
      limparMotivoSaida: () => set({ motivoSaida: null }),
      marcarBoasVindasVista: (usuarioId, tipo) =>
        set((s) => ({
          boasVindasVistas: {
            ...s.boasVindasVistas,
            [usuarioId]: { ...s.boasVindasVistas[usuarioId], [tipo]: true },
          },
        })),
    }),
    { name: 'bussola-auth' },
  ),
)
