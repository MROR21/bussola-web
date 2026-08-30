import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EstadoErro } from '../components/EstadoErro'
import { Icon } from '../components/Icon'
import { Carregando } from '../components/Spinner'
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
  const [tentativa, setTentativa] = useState(0)

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
  }, [id, tentativa])

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

  if (loading) return <Carregando texto="Carregando o progresso..." />
  if (error) return <EstadoErro onRetry={() => setTentativa((t) => t + 1)} />
  if (!dados) return null

  const passosFeitos = dados.passos.filter((p) => p.concluido).length
  const passosTotal = dados.passos.length
  const fluxosFeitos = fluxos.filter((f) => f.concluido).length

  return (
    <div className="flex w-full max-w-2xl flex-col gap-5">
      <Link to="/gestor" className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-200">
        <Icon name="arrow_back" className="text-base" /> Voltar pros supervisionados
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
            {chave === 'passos' ? `Passos (${passosFeitos}/${passosTotal})` : `Guia (${fluxosFeitos}/${fluxos.length})`}
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
                  <li key={p.id} className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Icon
                        name={p.concluido ? 'check_circle' : 'radio_button_unchecked'}
                        className={cx('text-base', p.concluido ? 'text-purple-400' : 'text-neutral-600')}
                        fill={p.concluido}
                      />
                      <span className={p.concluido ? 'text-neutral-300' : 'text-neutral-500'}>
                        {p.title}
                      </span>
                    </div>
                    {p.concluido && p.evidencia && (
                      <div className="ml-6 flex items-start gap-1.5 text-xs">
                        <Icon name="attach_file" className="text-sm text-neutral-600" />
                        {/^https?:\/\//i.test(p.evidencia.trim()) ? (
                          <a
                            href={p.evidencia}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all text-purple-300 underline hover:text-purple-200"
                          >
                            {p.evidencia}
                          </a>
                        ) : (
                          <span className="whitespace-pre-wrap break-words text-neutral-400">
                            {p.evidencia}
                          </span>
                        )}
                      </div>
                    )}
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
                    <Icon
                      name={f.concluido ? 'check_circle' : 'radio_button_unchecked'}
                      className={cx('text-base', f.concluido ? 'text-purple-400' : 'text-neutral-600')}
                      fill={f.concluido}
                    />
                    <span className={f.concluido ? 'text-neutral-300' : 'text-neutral-500'}>
                      {f.titulo}
                    </span>
                    {f.doSquad && (
                      <span
                        title="Faz parte da jornada dele"
                        className="rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-300"
                      >
                        do squad
                      </span>
                    )}
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
