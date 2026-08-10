import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cx } from '../utils/cx'
import { getFluxosSupervisionado, getProgressoDetalhado } from '../features/gestor/gestorService'
import type { FluxoProgresso, ProgressoSupervisionado } from '../features/gestor/types'

// Tela de detalhe de um supervisionado, com abas: Passos (jornada) e Fluxos.
export function SupervisionadoPage() {
  const { id = '' } = useParams()
  const [dados, setDados] = useState<ProgressoSupervisionado | null>(null)
  const [fluxos, setFluxos] = useState<FluxoProgresso[]>([])
  const [aba, setAba] = useState<'passos' | 'fluxos'>('passos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    setError(null)
    Promise.all([getProgressoDetalhado(id), getFluxosSupervisionado(id)])
      .then(([d, fs]) => {
        if (cancelado) return
        setDados(d)
        setFluxos(fs)
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

  const fasesPassos = useMemo(() => {
    const grupos: Record<string, ProgressoSupervisionado['passos']> = {}
    for (const passo of dados?.passos ?? []) {
      const lista = grupos[passo.phase] ?? []
      lista.push(passo)
      grupos[passo.phase] = lista
    }
    return Object.entries(grupos)
  }, [dados])

  const modulosFluxos = useMemo(() => {
    const grupos = new Map<string, FluxoProgresso[]>()
    for (const fluxo of fluxos) {
      const lista = grupos.get(fluxo.modulo) ?? []
      lista.push(fluxo)
      grupos.set(fluxo.modulo, lista)
    }
    return [...grupos.entries()].sort(
      (a, b) => Number(a[0] === 'Básico do dev') - Number(b[0] === 'Básico do dev'),
    )
  }, [fluxos])

  if (loading) return <p className="text-neutral-400">Carregando o progresso...</p>
  if (error) return <p className="text-red-400">Erro: {error}</p>
  if (!dados) return null

  const passosFeitos = dados.passos.filter((p) => p.concluido).length
  const passosTotal = dados.passos.length
  const fluxosFeitos = fluxos.filter((f) => f.concluido).length

  return (
    <div className="flex w-full max-w-2xl flex-col gap-5">
      <Link to="/gestor" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← Voltar pros supervisionados
      </Link>

      <h1 className="text-2xl font-bold text-neutral-100">{dados.nome}</h1>

      <div className="flex gap-2">
        {(['passos', 'fluxos'] as const).map((chave) => (
          <button
            key={chave}
            type="button"
            onClick={() => setAba(chave)}
            className={cx(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              aba === chave
                ? 'bg-purple-500/20 text-purple-200'
                : 'text-neutral-400 hover:text-neutral-200',
            )}
          >
            {chave === 'passos' ? `Passos (${passosFeitos}/${passosTotal})` : `Fluxos (${fluxosFeitos}/${fluxos.length})`}
          </button>
        ))}
      </div>

      {aba === 'passos' ? (
        <div className="flex flex-col gap-4">
          {fasesPassos.map(([fase, itens]) => (
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
                    <span className={p.concluido ? 'text-neutral-300' : 'text-neutral-500'}>
                      {p.title}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {fluxos.length === 0 && <p className="text-neutral-500">Nenhum fluxo por aqui.</p>}
          {modulosFluxos.map(([modulo, itens]) => (
            <section key={modulo} className="flex flex-col gap-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {modulo}
              </h2>
              <ul className="flex flex-col gap-1">
                {itens.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 text-sm">
                    <span className={f.concluido ? 'text-purple-400' : 'text-neutral-600'}>
                      {f.concluido ? '✓' : '○'}
                    </span>
                    <span className={f.concluido ? 'text-neutral-300' : 'text-neutral-500'}>
                      {f.titulo}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
