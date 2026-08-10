import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotificacoes, marcarLidas } from './notificacoesService'
import type { Notificacao } from './types'

// Sininho do header: bolinha com o nº de não-lidas, dropdown (fecha ao clicar fora) e um
// toast temporário ao entrar quando há notificação nova.
export function NotificationBell() {
  const [itens, setItens] = useState<Notificacao[]>([])
  const [aberto, setAberto] = useState(false)
  const [toast, setToast] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navegar = useNavigate()

  function irPara(link: string) {
    setAberto(false)
    navegar(link)
  }

  useEffect(() => {
    getNotificacoes()
      .then((n) => {
        setItens(n)
        if (n.some((x) => !x.lida)) setToast(true)
      })
      .catch(() => {})
  }, [])

  // O toast some sozinho depois de alguns segundos.
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(false), 5000)
    return () => clearTimeout(t)
  }, [toast])

  // Fecha o dropdown ao clicar fora dele.
  useEffect(() => {
    if (!aberto) return
    function aoClicarFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [aberto])

  const naoLidas = itens.filter((n) => !n.lida).length

  async function marcarTudo() {
    if (naoLidas === 0) return
    try {
      await marcarLidas()
      setItens((prev) => prev.map((n) => ({ ...n, lida: true })))
    } catch {
      // silencioso — a lista continua como está
    }
  }

  function abrir() {
    setToast(false)
    setAberto(true)
    marcarTudo()
  }

  function alternar() {
    if (aberto) setAberto(false)
    else abrir()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={alternar}
        aria-label="Notificações"
        className="relative text-lg text-neutral-300 hover:text-neutral-100"
      >
        🔔
        {naoLidas > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-purple-500 text-[10px] font-medium text-white">
            {naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 z-10 mt-2 w-72 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-lg">
          <p className="border-b border-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200">
            Notificações
          </p>
          {itens.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-neutral-500">
              Nenhuma notificação por aqui.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {itens.map((n) => (
                <li key={n.id} className="border-b border-neutral-800/60 last:border-0">
                  {n.link ? (
                    <button
                      type="button"
                      onClick={() => irPara(n.link)}
                      className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm text-neutral-300 hover:bg-neutral-800"
                    >
                      <span>{n.mensagem}</span>
                      <span className="shrink-0 text-purple-300">→</span>
                    </button>
                  ) : (
                    <span className="block px-4 py-3 text-sm text-neutral-300">{n.mensagem}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {toast && (
        <button
          type="button"
          onClick={abrir}
          className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl border border-purple-500/40 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 shadow-lg"
        >
          🔔 Você tem {naoLidas} {naoLidas === 1 ? 'nova notificação' : 'novas notificações'}
        </button>
      )}
    </div>
  )
}
