import { useEffect, useState } from 'react'
import { getUsuariosProgresso } from '../features/gestor/gestorService'
import type { UsuarioProgresso } from '../features/gestor/types'

// Painel do gestor: progresso de cada pessoa na jornada. Endpoint protegido (policy "Gestor").
export function GestorPage() {
  const [usuarios, setUsuarios] = useState<UsuarioProgresso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    getUsuariosProgresso()
      .then((u) => {
        if (!cancelado) setUsuarios(u)
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'Erro ao carregar os usuários')
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  if (loading) return <p className="text-neutral-400">Carregando o painel...</p>
  if (error) return <p className="text-red-400">Erro: {error}</p>

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-100">📊 Painel do gestor</h1>
        <p className="text-sm text-neutral-400">
          Progresso de cada pessoa na jornada ({usuarios.length}{' '}
          {usuarios.length === 1 ? 'pessoa' : 'pessoas'}).
        </p>
      </header>

      <ul className="flex flex-col gap-2">
        {usuarios.map((u) => {
          const percent =
            u.totalPassos > 0 ? Math.round((u.passosConcluidos / u.totalPassos) * 100) : 0
          return (
            <li
              key={u.id}
              className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-neutral-100">{u.nome}</span>
                  <span className="truncate text-sm text-neutral-500">{u.email}</span>
                </div>
                <span className="shrink-0 text-sm text-neutral-400">
                  {u.passosConcluidos}/{u.totalPassos}
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-neutral-400">
                  {u.cargo}
                </span>
                {u.isGestor && (
                  <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-purple-300">
                    Gestor
                  </span>
                )}
                {!u.nivelamentoConcluido && (
                  <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-neutral-500">
                    Não nivelou
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
