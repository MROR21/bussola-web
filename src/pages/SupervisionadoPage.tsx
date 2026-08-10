import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cx } from '../utils/cx'
import { getProgressoDetalhado } from '../features/gestor/gestorService'
import type { ProgressoSupervisionado } from '../features/gestor/types'

// Tela de detalhe de um supervisionado: progresso passo-a-passo (agrupado por fase).
export function SupervisionadoPage() {
  const { id = '' } = useParams()
  const [dados, setDados] = useState<ProgressoSupervisionado | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    setError(null)
    getProgressoDetalhado(id)
      .then((d) => {
        if (!cancelado) setDados(d)
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'Erro ao carregar o progresso')
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [id])

  if (loading) return <p className="text-neutral-400">Carregando o progresso...</p>
  if (error) return <p className="text-red-400">Erro: {error}</p>
  if (!dados) return null

  const feitos = dados.passos.filter((p) => p.concluido).length
  const total = dados.passos.length
  const percent = total > 0 ? Math.round((feitos / total) * 100) : 0

  const fases = dados.passos.reduce<Record<string, typeof dados.passos>>((grupos, passo) => {
    const lista = grupos[passo.phase] ?? []
    lista.push(passo)
    grupos[passo.phase] = lista
    return grupos
  }, {})

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <Link to="/gestor" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← Voltar pros supervisionados
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-100">{dados.nome}</h1>
        <p className="text-sm text-neutral-400">
          {feitos} de {total} passos concluídos
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-purple-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {Object.entries(fases).map(([fase, itens]) => (
          <section key={fase} className="flex flex-col gap-1">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {fase}
            </h2>
            <ul className="flex flex-col gap-1">
              {itens.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <span className={p.concluido ? 'text-purple-400' : 'text-neutral-600'}>
                    {p.concluido ? '✓' : '○'}
                  </span>
                  <span className={cx(p.concluido ? 'text-neutral-300' : 'text-neutral-500')}>
                    {p.title}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
