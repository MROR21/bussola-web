import { useEffect, useRef } from 'react'

// Duas variantes do mesmo problema: uma tela que buscou dado uma vez (no mount) fica desatualizada
// se OUTRA sessão (gestor/supervisionado, cada um no seu navegador) mudar aquele dado enquanto essa
// tela continua aberta — sem WebSocket, o único jeito de perceber é buscar de novo em algum
// momento. `callback` nunca deve mexer em loading/error de tela cheia (é sempre um refresh
// silencioso por trás do que já está na tela — falha aqui não deve interromper quem está usando).

// Busca de novo TODA VEZ que a aba volta a ficar visível (alt-tab de volta, trocar de janela) —
// sem intervalo automático. Uso: conteúdo que o próprio colaborador pode editar (fase/passo/fluxo/
// acesso via Admin), onde o gatilho mais realista é "saí e voltei", não ficar de olho o tempo todo.
export function useRefetchOnFocus(callback: () => void) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    function aoMudarVisibilidade() {
      if (!document.hidden) callbackRef.current()
    }
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    return () => document.removeEventListener('visibilitychange', aoMudarVisibilidade)
  }, [])
}

// Busca de novo a cada `intervaloMs`, pausando em segundo plano e atualizando na hora que a aba
// volta a ficar visível (mesmo padrão do sino de notificações). Uso: telas que alguém fica
// literalmente olhando esperando ver o progresso de outra pessoa mudar ao vivo (painel do gestor,
// detalhe de um supervisionado).
export function usePolling(callback: () => void, intervaloMs: number) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval> | undefined

    function iniciar() {
      if (!intervalo) intervalo = setInterval(() => callbackRef.current(), intervaloMs)
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
        callbackRef.current()
        iniciar()
      }
    }

    iniciar()
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    return () => {
      parar()
      document.removeEventListener('visibilitychange', aoMudarVisibilidade)
    }
  }, [intervaloMs])
}
