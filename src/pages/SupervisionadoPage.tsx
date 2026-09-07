import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Acordeao } from '../components/Acordeao'
import { CompassRose } from '../components/CompassRose'
import { EstadoErro } from '../components/EstadoErro'
import { Icon } from '../components/Icon'
import { MapCorners } from '../components/MapCorners'
import { MapIllustration } from '../components/MapIllustration'
import { Carregando } from '../components/Spinner'
import { usePolling } from '../hooks/useAtualizarEmSegundoPlano'
import { useSaidaValor } from '../hooks/useSaida'
import { useTitulo } from '../hooks/useTitulo'
import { cx } from '../utils/cx'
import { NOME_CARGO } from '../features/gestor/acessosPorCargo'
import {
  getAcessosSupervisionado,
  getFluxosSupervisionado,
  getProgressoDetalhado,
  marcarAcessoConcluido,
} from '../features/gestor/gestorService'
import { GuiaModulosLeitura } from '../features/gestor/GuiaModulosLeitura'
import { TrilhaFasesLeitura } from '../features/gestor/TrilhaFasesLeitura'
import type { AcessoProgresso, FluxoProgresso, ProgressoSupervisionado } from '../features/gestor/types'

// Tela de detalhe de um supervisionado, com abas: Passos (jornada) e Fluxos.
export function SupervisionadoPage() {
  const { id = '' } = useParams()
  const [dados, setDados] = useState<ProgressoSupervisionado | null>(null)
  useTitulo(dados?.nome)
  const [fluxos, setFluxos] = useState<FluxoProgresso[]>([])
  const [acessos, setAcessos] = useState<AcessoProgresso[]>([])
  const [aba, setAba] = useState<'passos' | 'fluxos'>('passos')
  const [acessosAbertos, setAcessosAbertos] = useState(false)
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)
  const toastFeedback = useSaidaValor(feedback)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    setError(null)
    Promise.all([
      getProgressoDetalhado(id),
      getFluxosSupervisionado(id),
      getAcessosSupervisionado(id),
    ])
      .then(([d, fs, as_]) => {
        if (cancelado) return
        setDados(d)
        setFluxos(fs)
        setAcessos(as_)
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

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(t)
  }, [feedback])

  // O supervisionado marca passo/fluxo concluído (ou anexa evidência) numa sessão separada — sem
  // isso, essa tela (a que o gestor mais fica olhando esperando ver progresso) ficava parada até
  // sair e voltar. Silencioso, igual GestorPage.tsx. `acessos` fica DE FORA de propósito: quem
  // marca acesso é o PRÓPRIO gestor nessa mesma tela (`alternarAcesso`, otimista) — um poll
  // pisando em cima do estado otimista podia fazer o chip "piscar" de volta pra cinza por um
  // instante antes do PUT terminar.
  usePolling(async () => {
    try {
      const [d, fs] = await Promise.all([getProgressoDetalhado(id), getFluxosSupervisionado(id)])
      setDados(d)
      setFluxos(fs)
    } catch {
      // silencioso
    }
  }, 15_000)

  // Marca (ou desmarca) na hora do clique — não tem como saber quando a pessoa "volta" de um link
  // externo aberto numa aba nova, então o clique já é o próprio ato de liberar. Otimista: desfaz se
  // o back falhar.
  async function alternarAcesso(acesso: AcessoProgresso) {
    const novoValor = !acesso.concluido
    setAcessos((prev) => prev.map((a) => (a.id === acesso.id ? { ...a, concluido: novoValor } : a)))
    try {
      await marcarAcessoConcluido(id, acesso.id, novoValor)
    } catch (e) {
      setAcessos((prev) =>
        prev.map((a) => (a.id === acesso.id ? { ...a, concluido: acesso.concluido } : a)),
      )
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao salvar', ok: false })
    }
  }

  if (loading) return <Carregando texto="Carregando o progresso..." />
  if (error) return <EstadoErro onRetry={() => setTentativa((t) => t + 1)} />
  if (!dados) return null

  const passosFeitos = dados.passos.filter((p) => p.concluido).length
  const passosTotal = dados.passos.length
  const fluxosFeitos = fluxos.filter((f) => f.concluido).length
  const acessosFeitos = acessos.filter((a) => a.concluido).length

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

      <Acordeao
        titulo={
          <span className="flex items-center gap-2 normal-case">
            <Icon name="key" className="text-base text-gold-400" /> Acessos a liberar (
            {NOME_CARGO[dados.cargo]})
          </span>
        }
        aberto={acessosAbertos}
        onToggle={() => setAcessosAbertos((a) => !a)}
      >
        {acessos.length === 0 ? (
          <p className="text-xs text-neutral-500">Nenhum acesso cadastrado pra esse cargo ainda.</p>
        ) : (
          <>
            <ul className="flex flex-wrap gap-2">
              {acessos.map((acesso) => {
                const classeBase =
                  'flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors'
                const classeEstado = acesso.concluido
                  ? 'border-green-500/40 bg-green-500/10 text-green-300 hover:border-green-500/60'
                  : 'border-navy-600 bg-navy-900 text-neutral-300 hover:border-gold-500/50'
                const conteudo = (
                  <>
                    {acesso.nome}
                    {acesso.concluido && <Icon name="verified" className="text-xs" fill />}
                  </>
                )
                return (
                  <li key={acesso.id}>
                    {acesso.link ? (
                      <a
                        href={acesso.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          if (!acesso.concluido) alternarAcesso(acesso)
                        }}
                        title={acesso.concluido ? 'Já liberado — clique pra abrir o link de novo' : 'Abre o link e marca como liberado'}
                        className={cx(classeBase, classeEstado)}
                      >
                        {conteudo}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => alternarAcesso(acesso)}
                        title={acesso.concluido ? 'Marcar como não liberado' : 'Marcar como liberado'}
                        className={cx(classeBase, classeEstado)}
                      >
                        {conteudo}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 text-xs text-neutral-500">
              {acessosFeitos} de {acessos.length} liberados — clique num acesso pendente pra abrir o
              link e marcar como feito.
            </p>
          </>
        )}
      </Acordeao>

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
        <div key={aba} className="anim-page flex flex-col gap-4">
          <p className="self-center text-xs font-medium uppercase tracking-wide text-neutral-500">
            Progresso de {dados.nome}
          </p>
          <TrilhaFasesLeitura passos={dados.passos} />
        </div>
      ) : (
        <div key={aba} className="anim-page flex flex-col gap-4">
          <p className="self-center text-xs font-medium uppercase tracking-wide text-neutral-500">
            Guia de {dados.nome}
          </p>
          <GuiaModulosLeitura fluxos={fluxos} />
        </div>
      )}

      {toastFeedback.montado && toastFeedback.valor && (
        <div
          className={cx(
            'fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-xl border bg-navy-800 px-4 py-3 text-sm shadow-lg',
            toastFeedback.saindo ? 'anim-pop-out' : 'anim-pop',
            toastFeedback.valor.ok ? 'border-green-500/40 text-green-300' : 'border-red-500/40 text-red-300',
          )}
        >
          <Icon name={toastFeedback.valor.ok ? 'check_circle' : 'warning'} className="text-base" />
          {toastFeedback.valor.texto}
        </div>
      )}
    </div>
  )
}
