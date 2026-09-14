import { create } from 'zustand'

// Estado da conexão com a API. 'checando' até a 1ª resposta; depois 'ok' ou 'offline'.
export type ApiStatus = 'checando' | 'ok' | 'offline'

interface ApiStatusStore {
  status: ApiStatus
}

// Store em vez de hook próprio (era `useApiStatus`) — assim o polling roda UMA vez só pro app
// inteiro (o indicador do header e qualquer `EstadoErro` na tela leem o mesmo valor), e o
// `EstadoErro` consegue reagir sozinho quando a API volta (ver ali), sem precisar que cada tela
// rode seu próprio ping.
export const useApiStatusStore = create<ApiStatusStore>(() => ({ status: 'checando' }))

const CHECK_MS = 15_000

async function checar() {
  try {
    const r = await fetch('/api/health')
    const d = await r.json()
    useApiStatusStore.setState({ status: d.status === 'ok' ? 'ok' : 'offline' })
  } catch {
    useApiStatusStore.setState({ status: 'offline' })
  }
}

let intervalo: ReturnType<typeof setInterval> | undefined
function iniciarPolling() {
  if (!intervalo) intervalo = setInterval(checar, CHECK_MS)
}
function pararPolling() {
  if (intervalo) {
    clearInterval(intervalo)
    intervalo = undefined
  }
}
function aoMudarVisibilidade() {
  if (document.hidden) {
    pararPolling()
  } else {
    checar()
    iniciarPolling()
  }
}

// Efeito de módulo (roda uma vez só, na primeira importação) — mesmo padrão de temaStore.ts.
checar()
iniciarPolling()
document.addEventListener('visibilitychange', aoMudarVisibilidade)
