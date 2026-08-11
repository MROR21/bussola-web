import { useEffect, useState } from 'react'

// Estado da conexão com a API. 'checando' até a 1ª resposta; depois 'ok' ou 'offline'.
export type ApiStatus = 'checando' | 'ok' | 'offline'

const CHECK_MS = 15_000

// Faz ping no /health de tempos em tempos (pausando em segundo plano) pra detectar API caída
// (502 / rede fora). O AppLayout usa isso pro indicador e pro banner de offline.
export function useApiStatus(): ApiStatus {
  const [status, setStatus] = useState<ApiStatus>('checando')

  useEffect(() => {
    let ativo = true
    let intervalo: ReturnType<typeof setInterval> | undefined

    async function checar() {
      try {
        const r = await fetch('/api/health')
        const d = await r.json()
        if (ativo) setStatus(d.status === 'ok' ? 'ok' : 'offline')
      } catch {
        if (ativo) setStatus('offline')
      }
    }

    function iniciar() {
      if (!intervalo) intervalo = setInterval(checar, CHECK_MS)
    }
    function parar() {
      if (intervalo) {
        clearInterval(intervalo)
        intervalo = undefined
      }
    }
    function aoMudarVisibilidade() {
      if (document.hidden) {
        parar()
      } else {
        checar()
        iniciar()
      }
    }

    checar()
    iniciar()
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    return () => {
      ativo = false
      parar()
      document.removeEventListener('visibilitychange', aoMudarVisibilidade)
    }
  }, [])

  return status
}
