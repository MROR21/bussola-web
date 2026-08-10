import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '../features/auth/authStore'
import { NotificationBell } from '../features/notificacoes/NotificationBell'
import { cx } from '../utils/cx'

type Papel = 'gestor' | 'colaborador'
const NAV: { to: string; label: string; icon: string; end: boolean; papel?: Papel }[] = [
  { to: '/gestor', label: 'Supervisionados', icon: '👥', end: false, papel: 'gestor' },
  { to: '/', label: 'Jornada', icon: '🧭', end: true, papel: 'colaborador' },
  { to: '/fluxos', label: 'Fluxos', icon: '📚', end: false },
  { to: '/chat', label: 'Assistente', icon: '💬', end: false },
]

// Casca do app (logado): menu lateral fixo + header + área de conteúdo que troca por rota.
export function AppLayout() {
  const nome = useAuthStore((state) => state.usuario?.nome ?? '')
  const isGestor = useAuthStore((state) => state.usuario?.isGestor ?? false)
  const logout = useAuthStore((state) => state.logout)
  const [status, setStatus] = useState('...')

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
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-sm text-neutral-400">
              Olá, <strong className="text-neutral-200">{nome}</strong>
              {' · '}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja sair do Bússola?')) {
                    logout()
                  }
                }}
                className="text-purple-300 hover:text-purple-200"
              >
                Sair
              </button>
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex w-full justify-center">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
