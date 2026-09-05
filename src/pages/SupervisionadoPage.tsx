import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CompassRose } from '../components/CompassRose'
import { EstadoErro } from '../components/EstadoErro'
import { Icon } from '../components/Icon'
import { MapCorners } from '../components/MapCorners'
import { MapIllustration } from '../components/MapIllustration'
import { Carregando } from '../components/Spinner'
import { useTitulo } from '../hooks/useTitulo'
import { cx } from '../utils/cx'
import { ACESSOS_POR_CARGO, NOME_CARGO } from '../features/gestor/acessosPorCargo'
import { getFluxosSupervisionado, getProgressoDetalhado } from '../features/gestor/gestorService'
import { GuiaModulosLeitura } from '../features/gestor/GuiaModulosLeitura'
import { TrilhaFasesLeitura } from '../features/gestor/TrilhaFasesLeitura'
import type { FluxoProgresso, ProgressoSupervisionado } from '../features/gestor/types'

// Tela de detalhe de um supervisionado, com abas: Passos (jornada) e Fluxos.
export function SupervisionadoPage() {
  const { id = '' } = useParams()
  const [dados, setDados] = useState<ProgressoSupervisionado | null>(null)
  useTitulo(dados?.nome)
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

  if (loading) return <Carregando texto="Carregando o progresso..." />
  if (error) return <EstadoErro onRetry={() => setTentativa((t) => t + 1)} />
  if (!dados) return null

  const passosFeitos = dados.passos.filter((p) => p.concluido).length
  const passosTotal = dados.passos.length
  const fluxosFeitos = fluxos.filter((f) => f.concluido).length
  const acessos = ACESSOS_POR_CARGO[dados.cargo]

  return (
    <div className="relative flex w-full max-w-2xl flex-col gap-5">
      <CompassRose className="pointer-events-none absolute -right-10 -top-4 size-64 text-gold-500 opacity-[0.06]" />
      <MapIllustration className="pointer-events-none absolute -bottom-10 -left-8 w-56 text-gold-500 opacity-[0.06]" />
      <Link to="/gestor" className="flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-neutral-200">
        <Icon name="arrow_back" className="text-base" /> Voltar pros supervisionados
      </Link>

      <div className="relative flex items-center gap-3 self-start p-5">
        <MapCorners tamanho={5} opacidade={25} />
        <h1 className="text-2xl font-bold text-neutral-100">{dados.nome}</h1>
        <span className="rounded-full bg-navy-700 px-2.5 py-1 text-xs font-medium text-neutral-400">
          {NOME_CARGO[dados.cargo]}
        </span>
      </div>

      <details className="group rounded-2xl border border-navy-700 bg-navy-800 p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-neutral-100">
          <span className="flex items-center gap-2">
            <Icon name="key" className="text-base text-gold-400" /> Acessos a liberar (
            {NOME_CARGO[dados.cargo]})
          </span>
          <Icon
            name="expand_more"
            className="text-neutral-500 transition-transform duration-200 group-open:rotate-180"
          />
        </summary>
        <ul className="mt-3 flex flex-wrap gap-2">
          {acessos.map((acesso) => (
            <li
              key={acesso}
              className="rounded-full border border-navy-600 bg-navy-900 px-3 py-1 text-xs text-neutral-300"
            >
              {acesso}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-neutral-500">
          Rascunho ilustrativo por cargo — lista definitiva a confirmar.
        </p>
      </details>

      <div className="flex gap-2">
        {(['passos', 'fluxos'] as const).map((chave) => (
          <button
            key={chave}
            type="button"
            onClick={() => setAba(chave)}
            className={cx(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              aba === chave
                ? 'bg-gold-500/20 text-gold-300'
                : 'text-neutral-400 hover:text-neutral-200',
            )}
          >
            {chave === 'passos' ? `Passos (${passosFeitos}/${passosTotal})` : `Guia (${fluxosFeitos}/${fluxos.length})`}
          </button>
        ))}
      </div>

      {aba === 'passos' ? (
        <div className="anim-fade flex flex-col gap-4">
          <p className="self-center text-xs font-medium uppercase tracking-wide text-neutral-500">
            Progresso de {dados.nome}
          </p>
          <TrilhaFasesLeitura passos={dados.passos} />
        </div>
      ) : (
        <div className="anim-fade flex flex-col gap-4">
          <p className="self-center text-xs font-medium uppercase tracking-wide text-neutral-500">
            Guia de {dados.nome}
          </p>
          <GuiaModulosLeitura fluxos={fluxos} />
        </div>
      )}
    </div>
  )
}
