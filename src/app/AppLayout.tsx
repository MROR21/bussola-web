import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { CompassRose } from '../components/CompassRose'
import { Icon } from '../components/Icon'
import { useAuthStore } from '../features/auth/authStore'
import { listarFluxos } from '../features/fluxos/fluxosService'
import { NotificationBell } from '../features/notificacoes/NotificationBell'
import { listarSteps } from '../features/onboarding/onboardingService'
import { Avatar } from '../features/perfil/Avatar'
import { useApiStatus } from './useApiStatus'
import { useSaida } from '../hooks/useSaida'
import { cx } from '../utils/cx'

const CHAVE_MENU_COLAPSADO = 'bussola-menu-colapsado'

// Nomes distintos, na ordem de aparição (Set preserva ordem de inserção) — usado pra montar os
// "galhos" da árvore (fases da Jornada, módulos do Guia) a partir do que o back já devolve
// ordenado, sem precisar de endpoint novo só pra listar nomes.
function distintosEmOrdem<T>(itens: T[], chaveDe: (item: T) => string): string[] {
  const vistos = new Set<string>()
  for (const item of itens) vistos.add(chaveDe(item))
  return [...vistos]
}

// Ícone de trilha: uma linha ligando 4 pontos (etapas), herda a cor do link (currentColor).
function TrilhaIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 18 L10 11 L15 14 L19 6" />
      <circle cx="5" cy="18" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="10" cy="11" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="6" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

type Papel = 'gestor' | 'colaborador'
// `arvore` diz que tipo de galho essa seção tem (fase ou módulo) — usado só pra escolher a lista
// certa (`fases`/`modulos`) e a base do path (/fase ou /fluxos) na hora de montar o link.
const NAV: { to: string; label: string; icon: ReactNode; end: boolean; papel?: Papel; arvore?: 'fase' | 'modulo' }[] = [
  { to: '/gestor', label: 'Supervisionados', icon: <Icon name="group" className="text-[18px]" />, end: false, papel: 'gestor' },
  { to: '/', label: 'Jornada', icon: <TrilhaIcon />, end: true, papel: 'colaborador', arvore: 'fase' },
  { to: '/fluxos', label: 'Guias', icon: <Icon name="menu_book" className="text-[18px]" />, end: false, arvore: 'modulo' },
  { to: '/chat', label: 'Assistente', icon: <Icon name="chat" className="text-[18px]" />, end: false },
  { to: '/admin', label: 'Admin', icon: <Icon name="build" className="text-[18px]" />, end: false, papel: 'gestor' },
  { to: '/perfil', label: 'Perfil', icon: <Icon name="settings" className="text-[18px]" />, end: false },
]

// Casca do app (logado): menu lateral fixo + header + área de conteúdo que troca por rota.
export function AppLayout() {
  const nome = useAuthStore((state) => state.usuario?.nome ?? '')
  const foto = useAuthStore((state) => state.usuario?.foto)
  const isGestor = useAuthStore((state) => state.usuario?.isGestor ?? false)
  const logout = useAuthStore((state) => state.logout)
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)
  const { montado: modalSaidaMontado, saindo: modalSaidaSaindo } = useSaida(confirmandoSaida)
  const status = useApiStatus()
  const location = useLocation()

  // Menu lateral ocultável — lembrado entre sessões (localStorage), não é estado de navegação.
  const [colapsado, setColapsado] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_MENU_COLAPSADO) === 'true'
    } catch {
      return false
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_MENU_COLAPSADO, String(colapsado))
    } catch {
      // sem storage disponível (ex.: aba privada) — só não persiste, sem quebrar a tela
    }
  }, [colapsado])

  const itensMenu = NAV.filter(
    (item) => !item.papel || (item.papel === 'gestor' ? isGestor : !isGestor),
  )

  // Galhos da árvore: nomes de fase/módulo, na ordem que o back já devolve — carregados uma vez,
  // sem depender da página atual ter buscado isso (o menu é sempre visível).
  const [fases, setFases] = useState<string[]>([])
  const [modulos, setModulos] = useState<string[]>([])

  useEffect(() => {
    listarSteps()
      .then((steps) => setFases(distintosEmOrdem(steps, (s) => s.phase)))
      .catch(() => {})
    listarFluxos()
      .then((fluxos) => setModulos(distintosEmOrdem(fluxos, (f) => f.modulo)))
      .catch(() => {})
  }, [])

  const [expandido, setExpandido] = useState<Record<string, boolean>>({})

  // A que seção da árvore uma rota pertence (ou nenhuma). Usado só pra saber quando o usuário
  // ENTROU numa seção vindo de fora — não a cada navegação dentro dela.
  const regiaoDe = (pathname: string): string | null => {
    if (pathname === '/' || pathname.startsWith('/fase')) return '/'
    if (pathname.startsWith('/fluxo')) return '/fluxos'
    return null
  }
  const regiaoAnterior = useRef<string | null>(null)

  // Expande sozinha a seção da rota atual, mas só na TROCA de seção (deep link, ou veio de outra
  // aba) — enquanto o usuário navega dentro da mesma seção, não briga com um toggle manual (senão
  // fechar a árvore e clicar de novo na aba nunca "pegava", ficava sempre reaberta sozinha).
  useEffect(() => {
    const atual = regiaoDe(location.pathname)
    if (atual && atual !== regiaoAnterior.current) {
      setExpandido((e) => ({ ...e, [atual]: true }))
    }
    regiaoAnterior.current = atual
  }, [location.pathname])

  return (
    <div className="relative flex h-screen overflow-hidden bg-navy-900 text-neutral-100">
      <aside
        className={cx(
          'relative flex shrink-0 flex-col gap-4 overflow-hidden border-r border-navy-700 bg-navy-800 p-4 transition-[width] duration-200',
          colapsado ? 'w-[72px] items-center' : 'w-60',
        )}
      >
        <CompassRose
          className="pointer-events-none absolute bottom-0 left-0 size-56 text-gold-500 opacity-[0.05]"
        />

        <div
          className={cx(
            'flex items-center border-b border-navy-700 px-2 pb-4 pt-1',
            colapsado ? 'px-0' : 'gap-2',
          )}
        >
          <CompassRose className="size-6 shrink-0 text-gold-400" />
          <span
            className={cx(
              'overflow-hidden whitespace-nowrap text-lg font-bold transition-all duration-200',
              colapsado ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100',
            )}
          >
            Bússola
          </span>
        </div>

        {/* Só a lista de navegação rola (min-h-0 é o que deixa o flex-1 respeitar o espaço
            disponível em vez de crescer) — o `<aside>` em si não tem overflow-y, senão a marca
            d'água decorativa (que sangra além da borda de propósito) contava como conteúdo
            "fora da área visível" e fazia o navegador desenhar uma barra de rolagem à toa. */}
        <nav className="flex w-full min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
          {itensMenu.map((item) => {
            const galhos = item.arvore === 'fase' ? fases : item.arvore === 'modulo' ? modulos : []
            const aberto = expandido[item.to] ?? false

            return (
              <div key={item.to}>
                <div className="flex items-center gap-1">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    title={colapsado ? item.label : undefined}
                    onClick={
                      galhos.length > 0 && !colapsado
                        ? () => setExpandido((e) => ({ ...e, [item.to]: !aberto }))
                        : undefined
                    }
                    onDoubleClick={
                      colapsado
                        ? () => {
                            setColapsado(false)
                            if (galhos.length > 0) setExpandido((e) => ({ ...e, [item.to]: true }))
                          }
                        : undefined
                    }
                    className={({ isActive }) =>
                      cx(
                        'flex items-center rounded-lg text-sm transition-colors',
                        colapsado ? 'size-10 shrink-0 justify-center' : 'flex-1 gap-3 px-3 py-2',
                        isActive
                          ? 'bg-gold-500/10 text-gold-400'
                          : 'text-neutral-400 hover:bg-navy-700 hover:text-neutral-200',
                      )
                    }
                  >
                    <span>{item.icon}</span>
                    <span
                      className={cx(
                        'overflow-hidden whitespace-nowrap transition-all duration-200',
                        colapsado ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100',
                      )}
                    >
                      {item.label}
                    </span>
                  </NavLink>
                  {!colapsado && galhos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpandido((e) => ({ ...e, [item.to]: !aberto }))}
                      aria-label={aberto ? 'Recolher' : 'Expandir'}
                      className="px-2 text-neutral-600 transition-colors hover:text-neutral-300"
                    >
                      <Icon
                        name="chevron_right"
                        className={cx('text-base transition-transform duration-200', aberto && 'rotate-90')}
                      />
                    </button>
                  )}
                </div>

                {!colapsado && galhos.length > 0 && aberto && (
                  <ul className="ml-4 flex flex-col gap-0.5 border-l border-navy-700 py-1 pl-3">
                    {galhos.map((nome) => {
                      // Fase e Módulo têm bases de path diferentes (fase vive fora da Jornada,
                      // módulo é sub-rota do próprio Guia) — não dá pra derivar só de `item.to`.
                      const base = item.arvore === 'fase' ? '/fase' : '/fluxos'
                      const linkTo = `${base}/${encodeURIComponent(nome)}`
                      const ativo = location.pathname === linkTo
                      return (
                        <li key={nome}>
                          <Link
                            to={linkTo}
                            className={cx(
                              'block truncate rounded-lg px-2 py-1 text-xs transition-colors',
                              ativo
                                ? 'text-gold-400'
                                : 'text-neutral-500 hover:text-neutral-200',
                            )}
                          >
                            {nome}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>

      </aside>

      {/* Botão de recolher na própria borda entre o menu e o conteúdo — meio da tela, discreto,
          igual o do Explorer do VSCode — em vez de um botão de texto ocupando linha lá embaixo. */}
      <button
        type="button"
        onClick={() => setColapsado((v) => !v)}
        title={colapsado ? 'Expandir menu' : 'Recolher menu'}
        className={cx(
          'absolute top-1/2 z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-navy-600 bg-navy-800 text-neutral-400 shadow-md transition-[left,color,border-color] duration-200 hover:border-gold-500/50 hover:text-gold-400',
          colapsado ? 'left-[72px]' : 'left-60',
        )}
      >
        <Icon
          name="chevron_left"
          className={cx('text-sm transition-transform duration-200', colapsado && 'rotate-180')}
        />
      </button>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-navy-700 bg-gradient-to-r from-navy-800 via-navy-800/70 to-navy-900 px-6">
          {/* overflow-hidden fica só aqui, contendo a marca d'água que sangra pra fora — não no
              header inteiro, senão corta o dropdown de notificação, que precisa abrir PRA FORA
              da faixa de 64px do header. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <CompassRose className="absolute -right-6 -top-10 size-32 text-gold-500 opacity-[0.07]" />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"
            aria-hidden="true"
          />
          <span className="flex items-center gap-1.5 rounded-full border border-navy-700 bg-navy-800 px-3 py-1 text-xs text-neutral-500">
            <span
              className={cx(
                'size-1.5 rounded-full',
                status === 'ok' && 'bg-green-400',
                status === 'offline' && 'bg-red-400',
                status === 'checando' && 'bg-neutral-500',
              )}
            />
            API{' '}
            <strong
              className={cx(
                'font-medium',
                status === 'ok' && 'text-green-400',
                status === 'offline' && 'text-red-400',
                status === 'checando' && 'text-neutral-400',
              )}
            >
              {status === 'checando' ? '...' : status}
            </strong>
          </span>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <NavLink
              to="/perfil"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-navy-700"
            >
              <Avatar nome={nome} foto={foto} className="size-8 text-xs" />
              <span className="text-sm text-neutral-200">{nome}</span>
            </NavLink>
            <span className="h-6 w-px bg-navy-700" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setConfirmandoSaida(true)}
              className="flex items-center gap-1 text-sm text-gold-400 hover:text-gold-300"
            >
              <Icon name="logout" className="text-base" /> Sair
            </button>
          </div>
        </header>

        {status === 'offline' && (
          <div className="anim-fade flex items-center justify-center gap-2 bg-red-500/15 px-4 py-1.5 text-center text-xs text-red-300">
            <Icon name="warning" className="text-sm" />
            Sem conexão com o servidor. Tentando reconectar…
          </div>
        )}

        {/* overflow-x-hidden explícito: só `overflow-y-auto` faz o navegador computar o eixo X
            como auto sozinho (regra da especificação do CSS) — qualquer marca d'água decorativa
            que sangre um pouco pra fora da coluna central acabaria desenhando uma barra de
            rolagem horizontal à toa (mesma causa do bug das setinhas no menu lateral). */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <div key={location.pathname} className="anim-page flex w-full justify-center">
            <Outlet />
          </div>
        </main>
      </div>

      {modalSaidaMontado && (
        <div
          className={cx(
            'fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4',
            modalSaidaSaindo ? 'anim-fade-out' : 'anim-fade',
          )}
          onClick={() => setConfirmandoSaida(false)}
        >
          <div
            className={cx(
              'flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6',
              modalSaidaSaindo ? 'anim-pop-out' : 'anim-pop',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-neutral-100">Sair do Bússola?</h2>
              <p className="text-sm text-neutral-400">
                Tem certeza que deseja sair do Bússola?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoSaida(false)}
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-400"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
