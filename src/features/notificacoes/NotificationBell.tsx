import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../perfil/Avatar'
import {
  apagarNotificacao,
  apagarTodasNotificacoes,
  getNotificacoes,
  marcarLidas,
} from './notificacoesService'
import type { Notificacao } from './types'

// De quanto em quanto tempo o sino busca novidades (só enquanto a aba está visível).
const POLL_MS = 20_000

// Sininho do header: bolinha com o nº de não-lidas, dropdown (fecha ao clicar fora) e um
// toast ao chegar notificação nova. Busca em tempo (quase) real via polling, pausando em
// segundo plano.
export function NotificationBell() {
  const [itens, setItens] = useState<Notificacao[]>([])
  const [aberto, setAberto] = useState(false)
  const [toast, setToast] = useState(false)
  const [confirmandoLimpar, setConfirmandoLimpar] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  // Ids que já dispararam toast — garante um aviso por notificação, sem repetir a cada poll.
  const jaAvisadasRef = useRef<Set<string>>(new Set())
  const navegar = useNavigate()

  function irPara(link: string) {
    setAberto(false)
    navegar(link)
  }

  useEffect(() => {
    let ativo = true
    let intervalo: ReturnType<typeof setInterval> | undefined

    async function carregar() {
      try {
        const n = await getNotificacoes()
        if (!ativo) return
        setItens(n)
        // Novidade = não-lida que ainda não avisamos. Toast só pra essas.
        const novas = n.filter((x) => !x.lida && !jaAvisadasRef.current.has(x.id))
        if (novas.length > 0) {
          novas.forEach((x) => jaAvisadasRef.current.add(x.id))
          setToast(true)
        }
      } catch {
        // silencioso — mantém a lista atual
      }
    }

    function iniciar() {
      if (!intervalo) intervalo = setInterval(carregar, POLL_MS)
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
        carregar() // ao voltar pra aba, atualiza na hora
        iniciar()
      }
    }

    carregar()
    iniciar()
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    return () => {
      ativo = false
      parar()
      document.removeEventListener('visibilitychange', aoMudarVisibilidade)
    }
  }, [])

  // Fechar o dropdown desarma a confirmação de "limpar tudo" pendente.
  useEffect(() => {
    if (!aberto) setConfirmandoLimpar(false)
  }, [aberto])

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

  async function apagarUma(id: string) {
    setItens((prev) => prev.filter((n) => n.id !== id))
    try {
      await apagarNotificacao(id)
    } catch {
      // se falhar, o próximo carregar() da lista traz de volta — não vale a pena complicar aqui
    }
  }

  async function confirmarLimparTudo() {
    setConfirmandoLimpar(false)
    setItens([])
    try {
      await apagarTodasNotificacoes()
    } catch {
      // idem
    }
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
        <div className="anim-pop absolute right-0 z-10 mt-2 w-72 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
            <p className="text-sm font-medium text-neutral-200">Notificações</p>
            {itens.length > 0 &&
              (confirmandoLimpar ? (
                <span className="flex items-center gap-2 text-xs">
                  <span className="text-neutral-400">Apagar tudo?</span>
                  <button
                    type="button"
                    onClick={confirmarLimparTudo}
                    className="font-medium text-red-400 hover:text-red-300"
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmandoLimpar(false)}
                    className="text-neutral-400 hover:text-neutral-200"
                  >
                    Não
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmandoLimpar(true)}
                  className="text-xs text-neutral-500 hover:text-red-400"
                >
                  Limpar tudo
                </button>
              ))}
          </div>
          {itens.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-neutral-500">
              Nenhuma notificação por aqui.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {itens.map((n) => (
                <li
                  key={n.id}
                  className="flex items-center gap-1 border-b border-neutral-800/60 last:border-0"
                >
                  {n.link ? (
                    <button
                      type="button"
                      onClick={() => irPara(n.link)}
                      className="flex flex-1 items-center gap-2 px-4 py-3 text-left text-sm text-neutral-300 hover:bg-neutral-800"
                    >
                      {n.autorNome && (
                        <Avatar
                          nome={n.autorNome}
                          foto={n.autorFoto ?? undefined}
                          className="size-7 text-[10px]"
                        />
                      )}
                      <span className="flex-1">{n.mensagem}</span>
                      <span className="shrink-0 text-purple-300">→</span>
                    </button>
                  ) : (
                    <div className="flex flex-1 items-center gap-2 px-4 py-3 text-sm text-neutral-300">
                      {n.autorNome && (
                        <Avatar
                          nome={n.autorNome}
                          foto={n.autorFoto ?? undefined}
                          className="size-7 text-[10px]"
                        />
                      )}
                      <span className="flex-1">{n.mensagem}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => apagarUma(n.id)}
                    aria-label="Apagar notificação"
                    className="mr-2 shrink-0 text-neutral-700 hover:text-red-400"
                  >
                    ✕
                  </button>
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
          className="anim-pop absolute right-full top-0 z-50 mr-3 flex w-max items-center gap-2 rounded-xl border border-purple-500/40 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 shadow-lg"
        >
          🔔 Você tem {naoLidas} {naoLidas === 1 ? 'nova notificação' : 'novas notificações'}
          <span className="absolute -right-1 top-1/2 size-2 -translate-y-1/2 rotate-45 border-r border-t border-purple-500/40 bg-neutral-900" />
        </button>
      )}
    </div>
  )
}
