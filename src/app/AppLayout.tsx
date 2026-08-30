import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useAuthStore } from '../features/auth/authStore'
import { listarFluxos } from '../features/fluxos/fluxosService'
import { NotificationBell } from '../features/notificacoes/NotificationBell'
import { listarSteps } from '../features/onboarding/onboardingService'
import { Avatar } from '../features/perfil/Avatar'
import { useApiStatus } from './useApiStatus'
import { cx } from '../utils/cx'

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
  const status = useApiStatus()
  const location = useLocation()

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
    <div className="flex h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      <aside className="flex w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-center gap-2 px-2 py-1">
          <Icon name="explore" className="text-2xl text-purple-400" />
          <span className="text-lg font-bold">Bússola</span>
        </div>
        <nav className="flex flex-col gap-1">
          {itensMenu.map((item) => {
            const galhos = item.arvore === 'fase' ? fases : item.arvore === 'modulo' ? modulos : []
            const aberto = expandido[item.to] ?? false

            return (
              <div key={item.to}>
                <div className="flex items-center gap-1">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={
                      galhos.length > 0
                        ? () => setExpandido((e) => ({ ...e, [item.to]: !aberto }))
                        : undefined
                    }
                    className={({ isActive }) =>
                      cx(
                        'flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-purple-500/10 text-purple-300'
                          : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200',
                      )
                    }
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </NavLink>
                  {galhos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpandido((e) => ({ ...e, [item.to]: !aberto }))}
                      aria-label={aberto ? 'Recolher' : 'Expandir'}
                      className="px-2 text-neutral-600 hover:text-neutral-300"
                    >
                      <Icon name={aberto ? 'expand_more' : 'chevron_right'} className="text-base" />
                    </button>
                  )}
                </div>

                {galhos.length > 0 && aberto && (
                  <ul className="ml-4 flex flex-col gap-0.5 border-l border-neutral-800 py-1 pl-3">
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
                                ? 'text-purple-300'
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

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 px-6">
          <span className="text-xs text-neutral-500">
            API:{' '}
            <strong
              className={cx(
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
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-neutral-800"
            >
              <Avatar nome={nome} foto={foto} className="size-8 text-xs" />
              <span className="text-sm text-neutral-200">{nome}</span>
            </NavLink>
            <button
              type="button"
              onClick={() => setConfirmandoSaida(true)}
              className="text-sm text-purple-300 hover:text-purple-200"
            >
              Sair
            </button>
          </div>
        </header>

        {status === 'offline' && (
          <div className="anim-fade flex items-center justify-center gap-2 bg-red-500/15 px-4 py-1.5 text-center text-xs text-red-300">
            <Icon name="warning" className="text-sm" />
            Sem conexão com o servidor. Tentando reconectar…
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6">
          <div key={location.pathname} className="anim-page flex w-full justify-center">
            <Outlet />
          </div>
        </main>
      </div>

      {confirmandoSaida && (
        <div
          className="anim-fade fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setConfirmandoSaida(false)}
        >
          <div
            className="anim-pop flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
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
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400"
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
