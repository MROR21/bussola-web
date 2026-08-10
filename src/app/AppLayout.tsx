import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '../features/auth/authStore'
import { NotificationBell } from '../features/notificacoes/NotificationBell'
import { Avatar } from '../features/perfil/Avatar'
import { cx } from '../utils/cx'

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
const NAV: { to: string; label: string; icon: ReactNode; end: boolean; papel?: Papel }[] = [
  { to: '/gestor', label: 'Supervisionados', icon: '👥', end: false, papel: 'gestor' },
  { to: '/', label: 'Jornada', icon: <TrilhaIcon />, end: true, papel: 'colaborador' },
  { to: '/fluxos', label: 'Fluxos', icon: '📚', end: false },
  { to: '/chat', label: 'Assistente', icon: '💬', end: false },
  { to: '/perfil', label: 'Perfil', icon: '⚙️', end: false },
]

// Casca do app (logado): menu lateral fixo + header + área de conteúdo que troca por rota.
export function AppLayout() {
  const nome = useAuthStore((state) => state.usuario?.nome ?? '')
  const foto = useAuthStore((state) => state.usuario?.foto)
  const isGestor = useAuthStore((state) => state.usuario?.isGestor ?? false)
  const logout = useAuthStore((state) => state.logout)
  const [status, setStatus] = useState('...')
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)

  const itensMenu = NAV.filter(
    (item) => !item.papel || (item.papel === 'gestor' ? isGestor : !isGestor),
  )

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setStatus(d.status ?? 'desconhecido'))
      .catch(() => setStatus('offline'))
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      <aside className="flex w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="text-2xl">🧭</span>
          <span className="text-lg font-bold">Bússola</span>
        </div>
        <nav className="flex flex-col gap-1">
          {itensMenu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-purple-500/10 text-purple-300'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200',
                )
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 px-6">
          <span className="text-xs text-neutral-500">
            API:{' '}
            <strong className={status === 'ok' ? 'text-green-400' : 'text-red-400'}>
              {status}
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

        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex w-full justify-center">
            <Outlet />
          </div>
        </main>
      </div>

      {confirmandoSaida && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setConfirmandoSaida(false)}
        >
          <div
            className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
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
