import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Tema = 'dark' | 'light'

interface TemaState {
  tema: Tema
  alternar: () => void
  definir: (tema: Tema) => void
}

// Sem preferência salva ainda: parte do que o sistema operacional já diz pro usuário.
const preferenciaDoSistema = (): Tema =>
  window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'

export const useTemaStore = create<TemaState>()(
  persist(
    (set) => ({
      tema: preferenciaDoSistema(),
      alternar: () => set((s) => ({ tema: s.tema === 'light' ? 'dark' : 'light' })),
      definir: (tema) => set({ tema }),
    }),
    { name: 'bussola-tema' },
  ),
)

// Aplica o tema no <html> (o CSS reage a `data-theme` — ver index.css) fora do ciclo de render do
// React, direto na criação do store e a cada mudança, pra não ter flash de tema errado.
function aplicarTema(tema: Tema) {
  document.documentElement.dataset.theme = tema
}
aplicarTema(useTemaStore.getState().tema)
useTemaStore.subscribe((estado) => aplicarTema(estado.tema))
