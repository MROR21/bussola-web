import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EstadoErro } from '../components/EstadoErro'
import { Icon } from '../components/Icon'
import { Carregando } from '../components/Spinner'
import {
  adicionarSupervisionado,
  getDisponiveis,
  getUsuariosProgresso,
  removerSupervisionado,
} from '../features/gestor/gestorService'
import type { UsuarioDisponivel, UsuarioProgresso } from '../features/gestor/types'

// Painel do gestor: progresso dos supervisionados + adicionar/remover supervisionados.
export function GestorPage() {
  const [usuarios, setUsuarios] = useState<UsuarioProgresso[]>([])
  const [disponiveis, setDisponiveis] = useState<UsuarioDisponivel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adicionando, setAdicionando] = useState(false)
  const navegar = useNavigate()

  async function carregar() {
    setError(null)
    try {
      const [supervisionados, livres] = await Promise.all([
        getUsuariosProgresso(),
        getDisponiveis(),
      ])
      setUsuarios(supervisionados)
      setDisponiveis(livres)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar o painel')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function adicionar(id: string) {
    await adicionarSupervisionado(id)
    await carregar()
  }

  async function remover(id: string) {
    await removerSupervisionado(id)
    await carregar()
  }

  if (loading) return <Carregando texto="Carregando o painel..." />
  if (error) return <EstadoErro onRetry={carregar} />

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-100">
          <Icon name="dashboard" className="text-2xl text-purple-300" /> Painel do gestor
        </h1>
        <p className="text-sm text-neutral-400">
          Progresso dos seus supervisionados ({usuarios.length}{' '}
          {usuarios.length === 1 ? 'pessoa' : 'pessoas'}).
        </p>
      </header>

      {usuarios.length === 0 && (
        <p className="text-neutral-500">
          Você ainda não tem supervisionados. Adicione alguém abaixo.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {usuarios.map((u) => {
          const percent =
            u.totalPassos > 0 ? Math.round((u.passosConcluidos / u.totalPassos) * 100) : 0
          return (
            <li
              key={u.id}
              onClick={() => navegar(`/supervisionado/${u.id}`)}
              className="flex cursor-pointer flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-purple-500/50"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-neutral-100">{u.nome}</span>
                  <span className="truncate text-sm text-neutral-500">{u.email}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm text-neutral-400">
                    {u.passosConcluidos}/{u.totalPassos}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      remover(u.id)
                    }}
                    className="text-sm text-neutral-500 hover:text-red-400"
                  >
                    Remover
                  </button>
                </div>
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

      <div className="flex flex-col gap-3 border-t border-neutral-800 pt-4">
        <button
          type="button"
          onClick={() => setAdicionando((v) => !v)}
          className="flex items-center gap-1 self-start rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400"
        >
          {adicionando ? (
            'Fechar'
          ) : (
            <>
              <Icon name="add" className="text-base" /> Adicionar supervisionado
            </>
          )}
        </button>

        {adicionando && (
          <ul className="flex flex-col gap-2">
            {disponiveis.length === 0 && (
              <li className="text-sm text-neutral-500">Nenhum colaborador disponível.</li>
            )}
            {disponiveis.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-neutral-100">{u.nome}</span>
                  <span className="truncate text-sm text-neutral-500">{u.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => adicionar(u.id)}
                  className="shrink-0 text-sm text-purple-300 hover:text-purple-200"
                >
                  Adicionar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
