import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { useSaida } from '../../hooks/useSaida'
import { cx } from '../../utils/cx'
import { useAuthStore } from '../auth/authStore'
import { getUsuariosProgresso } from '../gestor/gestorService'
import type { UsuarioProgresso } from '../gestor/types'
import { Avatar } from '../perfil/Avatar'
import { tempoRelativo } from '../../utils/tempoRelativo'
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
  const isGestor = useAuthStore((s) => s.usuario?.isGestor ?? false)
  const [itens, setItens] = useState<Notificacao[]>([])
  const [supervisionados, setSupervisionados] = useState<UsuarioProgresso[]>([])
  const [aberto, setAberto] = useState(false)
  const [toast, setToast] = useState(false)
  const [confirmandoLimpar, setConfirmandoLimpar] = useState(false)
  const [filtroAutorId, setFiltroAutorId] = useState<string | null>(null)
  const { montado: painelMontado, saindo: painelSaindo } = useSaida(aberto)
  const { montado: toastMontado, saindo: toastSaindo } = useSaida(toast)
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

  // Fechar o dropdown desarma a confirmação de "limpar tudo" pendente e reseta o filtro por
  // pessoa — reabrir sempre começa mostrando tudo de novo.
  useEffect(() => {
    if (!aberto) {
      setConfirmandoLimpar(false)
      setFiltroAutorId(null)
    }
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

  // Pra um gestor, a lista de opções de filtro é a dos PRÓPRIOS supervisionados (busca uma vez) —
  // assim o filtro já aparece mesmo que só um deles tenha notificado até agora (o outro simplesmente
  // mostra "nenhuma notificação dessa pessoa" se escolhido, o que é o esperado).
  useEffect(() => {
    if (!isGestor) return
    getUsuariosProgresso().then(setSupervisionados).catch(() => {})
  }, [isGestor])

  const naoLidas = itens.filter((n) => !n.lida).length

  // Um gestor com vários supervisionados recebe notificações misturadas de todo mundo — os
  // autores distintos (com id, pra filtrar sem depender de nome igual) viram chips de filtro. Só
  // aparece quando faz sentido: com 1 pessoa só (ou nenhuma), filtrar não ajudaria em nada. Fora
  // da sessão do gestor (sem lista de supervisionados), cai no fallback de olhar quem já apareceu
  // como autor nas próprias notificações carregadas.
  const autoresDistintos = useMemo(() => {
    if (isGestor && supervisionados.length > 0) {
      return supervisionados.map(
        (u) => [u.id, { nome: u.nome, foto: u.foto }] as [string, { nome: string; foto?: string | null }],
      )
    }
    const vistos = new Map<string, { nome: string; foto?: string | null }>()
    for (const n of itens) {
      if (n.autorId && n.autorNome && !vistos.has(n.autorId)) {
        vistos.set(n.autorId, { nome: n.autorNome, foto: n.autorFoto })
      }
    }
    return [...vistos.entries()]
  }, [itens, isGestor, supervisionados])
  const itensFiltrados = filtroAutorId ? itens.filter((n) => n.autorId === filtroAutorId) : itens

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
        className="relative text-neutral-300 transition-colors hover:text-neutral-100"
      >
        <Icon name="notifications" />
        {naoLidas > 0 && (
          <span
            key={naoLidas}
            className="anim-pop absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-gold-500 text-[10px] font-medium text-white"
          >
            {naoLidas}
          </span>
        )}
      </button>

      {painelMontado && (
        <div
          className={cx(
            'absolute right-0 z-10 mt-2 w-72 overflow-hidden rounded-xl border border-navy-700 bg-navy-800 shadow-lg',
            painelSaindo ? 'anim-pop-out' : 'anim-pop',
          )}
        >
          <div className="flex items-center justify-between border-b border-navy-700 px-4 py-2">
            <p className="text-sm font-medium text-neutral-200">Notificações</p>
            {itens.length > 0 &&
              (confirmandoLimpar ? (
                <span className="anim-fade flex items-center gap-2 text-xs">
                  <span className="text-neutral-400">Apagar tudo?</span>
                  <button
                    type="button"
                    onClick={confirmarLimparTudo}
                    className="font-medium text-red-400 transition-colors hover:text-red-300"
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmandoLimpar(false)}
                    className="text-neutral-400 transition-colors hover:text-neutral-200"
                  >
                    Não
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmandoLimpar(true)}
                  className="anim-fade text-xs text-neutral-500 transition-colors hover:text-red-400"
                >
                  Limpar tudo
                </button>
              ))}
          </div>
          {autoresDistintos.length > 1 && (
            <div className="anim-fade flex items-center gap-1.5 overflow-x-auto border-b border-navy-700 px-3 py-2">
              <button
                type="button"
                onClick={() => setFiltroAutorId(null)}
                className={cx(
                  'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  filtroAutorId === null
                    ? 'bg-gold-500/20 text-gold-300'
                    : 'text-neutral-500 hover:text-neutral-300',
                )}
              >
                Todos
              </button>
              {autoresDistintos.map(([id, autor]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFiltroAutorId(id)}
                  title={autor.nome}
                  className={cx(
                    'shrink-0 rounded-full transition-all',
                    filtroAutorId === id
                      ? 'opacity-100 ring-2 ring-gold-400'
                      : 'opacity-50 hover:opacity-90',
                  )}
                >
                  <Avatar nome={autor.nome} foto={autor.foto ?? undefined} className="size-6 text-[9px]" />
                </button>
              ))}
            </div>
          )}
          {itens.length === 0 ? (
            <p className="anim-fade px-4 py-6 text-center text-sm text-neutral-500">
              Nenhuma notificação por aqui.
            </p>
          ) : itensFiltrados.length === 0 ? (
            <p className="anim-fade px-4 py-6 text-center text-sm text-neutral-500">
              Nenhuma notificação dessa pessoa.
            </p>
          ) : (
            <ul key={filtroAutorId ?? 'todos'} className="anim-fade max-h-80 overflow-y-auto">
              {itensFiltrados.map((n) => (
                <li
                  key={n.id}
                  className="flex items-center gap-1 border-b border-navy-700/60 last:border-0"
                >
                  {n.link ? (
                    <button
                      type="button"
                      onClick={() => irPara(n.link)}
                      className="flex flex-1 items-center gap-2 px-4 py-3 text-left text-sm text-neutral-300 transition-colors hover:bg-navy-700"
                    >
                      {n.autorNome && (
                        <Avatar
                          nome={n.autorNome}
                          foto={n.autorFoto ?? undefined}
                          className="size-7 text-[10px]"
                        />
                      )}
                      <span className="flex flex-1 flex-col gap-0.5">
                        <span>{n.mensagem}</span>
                        <span className="text-xs text-neutral-500">{tempoRelativo(n.criadaEm)}</span>
                      </span>
                      <Icon name="arrow_forward" className="shrink-0 text-gold-400" />
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
                      <span className="flex flex-1 flex-col gap-0.5">
                        <span>{n.mensagem}</span>
                        <span className="text-xs text-neutral-500">{tempoRelativo(n.criadaEm)}</span>
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => apagarUma(n.id)}
                    aria-label="Apagar notificação"
                    className="mr-2 shrink-0 text-neutral-700 transition-colors hover:text-red-400"
                  >
                    <Icon name="close" className="text-base" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {toastMontado && (
        <button
          type="button"
          onClick={abrir}
          className={cx(
            'absolute right-full top-0 z-50 mr-3 flex w-max items-center gap-2 rounded-xl border border-gold-500/40 bg-navy-800 px-4 py-3 text-sm text-neutral-100 shadow-lg',
            toastSaindo ? 'anim-pop-out' : 'anim-pop',
          )}
        >
          <Icon name="notifications" className="text-base" /> Você tem {naoLidas}{' '}
          {naoLidas === 1 ? 'nova notificação' : 'novas notificações'}
          <span className="absolute -right-1 top-1/2 size-2 -translate-y-1/2 rotate-45 border-r border-t border-gold-500/40 bg-navy-800" />
        </button>
      )}
    </div>
  )
}
