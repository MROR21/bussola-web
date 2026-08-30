import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CompassRose } from '../components/CompassRose'
import { EstadoErro } from '../components/EstadoErro'
import { Icon } from '../components/Icon'
import { MapCorners } from '../components/MapCorners'
import { Carregando } from '../components/Spinner'
import { useTitulo } from '../hooks/useTitulo'
import {
  adicionarSupervisionado,
  getDisponiveis,
  getUsuariosProgresso,
  removerSupervisionado,
} from '../features/gestor/gestorService'
import type { UsuarioDisponivel, UsuarioProgresso } from '../features/gestor/types'

// Painel do gestor: progresso dos supervisionados + adicionar/remover supervisionados.
export function GestorPage() {
  useTitulo('Supervisionados')
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
    <div className="relative flex w-full max-w-2xl flex-col gap-6">
      <CompassRose className="pointer-events-none absolute -right-10 -top-4 -z-10 size-64 text-gold-500 opacity-[0.05]" />
      <header className="relative flex flex-col gap-1">
        <MapCorners tamanho={5} opacidade={25} />
        <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-100">
          <Icon name="dashboard" className="text-2xl text-gold-400" /> Painel do gestor
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
              className="flex cursor-pointer flex-col gap-2 rounded-xl border border-navy-700 bg-navy-800 p-4 transition-colors hover:border-gold-500/50"
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

              <div className="h-2 w-full overflow-hidden rounded-full bg-navy-700">
                <div
                  className="h-full rounded-full bg-gold-500 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-navy-700 px-2 py-0.5 text-neutral-400">
                  {u.cargo}
                </span>
                {!u.nivelamentoConcluido && (
                  <span className="rounded-full bg-navy-700 px-2 py-0.5 text-neutral-500">
                    Não nivelou
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-col gap-3 border-t border-navy-700 pt-4">
        <button
          type="button"
          onClick={() => setAdicionando((v) => !v)}
          className="flex items-center gap-1 self-start rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-400"
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
                className="flex items-center justify-between gap-3 rounded-xl border border-navy-700 bg-navy-800 p-3"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-neutral-100">{u.nome}</span>
                  <span className="truncate text-sm text-neutral-500">{u.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => adicionar(u.id)}
                  className="shrink-0 text-sm text-gold-400 hover:text-gold-300"
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
