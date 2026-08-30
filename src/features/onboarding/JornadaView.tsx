import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { cx } from '../../utils/cx'
import { concluirFluxo, desmarcarFluxo, getFluxosConcluidos } from '../fluxos/fluxosService'
import { TrailItemCard } from './TrailItemCard'
import { ProgressRing } from './ProgressRing'
import { concluirPasso, desmarcarPasso, getProgresso } from './progressService'
import type { TrailStep } from './types'

// Ícone por fase (fallback genérico se aparecer uma fase nova).
const FASE_ICONE: Record<string, string> = {
  Ambientação: 'waving_hand',
  'Ambiente técnico': 'computer',
  Padrões: 'square_foot',
  'Conheça o sistema': 'hub',
  'Primeiro Card': 'emoji_events',
}
const iconeDaFase = (fase: string) => FASE_ICONE[fase] ?? 'flag'

// Só a fase final espera todo o resto pronto antes de liberar — as demais seguem no gate suave
// (visitável a qualquer momento).
const FASE_FINAL = 'Primeiro Card'

// Home "Sua Jornada": progresso geral + próximo passo + fases em CARDS (clica e entra na fase).
export function JornadaView({
  trail,
  userId,
  nome,
  gestorNome,
  onRestart,
}: {
  trail: TrailStep[]
  userId: string
  nome: string
  gestorNome?: string | null
  onRestart: () => void
}) {
  const [passosConcluidos, setPassosConcluidos] = useState<Set<string>>(new Set())
  const [fluxosConcluidos, setFluxosConcluidos] = useState<Set<string>>(new Set())
  // A fase aberta vive no PATH (/fase/:nome) — assim o "voltar" do navegador sai da fase
  // (em vez de sair da página), igual entrar/sair funcionasse por rota de verdade.
  const { nome: faseParam } = useParams<{ nome?: string }>()
  const faseSelecionada = faseParam ?? null
  const navigate = useNavigate()
  const entrarFase = (fase: string) => navigate(`/fase/${encodeURIComponent(fase)}`)
  const sairFase = () => navigate('/')

  useEffect(() => {
    getProgresso(userId).then((ids) => setPassosConcluidos(new Set(ids))).catch(() => {})
    getFluxosConcluidos().then((ids) => setFluxosConcluidos(new Set(ids))).catch(() => {})
  }, [userId])

  const estaConcluido = (item: TrailStep) =>
    item.tipo === 'fluxo' ? fluxosConcluidos.has(item.id) : passosConcluidos.has(item.id)

  // Marca/desmarca de forma otimista (atualiza a UI na hora, desfaz se o back falhar).
  async function toggle(item: TrailStep) {
    const jaConcluido = estaConcluido(item)
    const setConcluidos = item.tipo === 'fluxo' ? setFluxosConcluidos : setPassosConcluidos
    setConcluidos((prev) => {
      const next = new Set(prev)
      if (jaConcluido) next.delete(item.id)
      else next.add(item.id)
      return next
    })
    try {
      if (item.tipo === 'fluxo') {
        if (jaConcluido) await desmarcarFluxo(item.id)
        else await concluirFluxo(item.id)
      } else if (jaConcluido) {
        await desmarcarPasso(userId, item.id)
      } else {
        await concluirPasso(userId, item.id)
      }
    } catch {
      setConcluidos((prev) => {
        const next = new Set(prev)
        if (jaConcluido) next.add(item.id)
        else next.delete(item.id)
        return next
      })
    }
  }

  // Agrupa por fase preservando a ordem (o back já manda ordenado: fases guiadas, depois os
  // fluxos do squad, por fim o Primeiro Card).
  const fases = useMemo(() => {
    const grupos = new Map<string, TrailStep[]>()
    for (const item of trail) {
      const lista = grupos.get(item.phase) ?? []
      lista.push(item)
      grupos.set(item.phase, lista)
    }
    return [...grupos.entries()]
  }, [trail])

  const total = trail.length
  const feitos = trail.filter(estaConcluido).length
  const percent = total > 0 ? Math.round((feitos / total) * 100) : 0
  const completa = total > 0 && feitos === total

  const proximo = trail.find((item) => !estaConcluido(item))
  const faseAtualIndex = proximo ? fases.findIndex(([fase]) => fase === proximo.phase) : fases.length - 1

  const indiceFaseFinal = fases.findIndex(([fase]) => fase === FASE_FINAL)
  const faseFinalLiberada =
    indiceFaseFinal < 0 ||
    fases
      .slice(0, indiceFaseFinal)
      .every(([, itens]) => itens.every(estaConcluido))

  // ---- Vista de UMA fase (entrou no card) ----
  // Só entra se a fase da URL existe de fato (param inválido/velho → cai na home) e, se for a
  // fase final, se já estiver liberada (senão volta pra home — o link direto não fura o gate).
  const faseEntry = faseSelecionada ? fases.find(([f]) => f === faseSelecionada) : undefined
  const podeEntrar = faseEntry && (faseEntry[0] !== FASE_FINAL || faseFinalLiberada)
  if (podeEntrar) {
    const [faseNome, itens] = faseEntry
    const feitosFase = itens.filter(estaConcluido).length
    return (
      <div className="flex w-full max-w-2xl flex-col gap-5">
        <button
          type="button"
          onClick={sairFase}
          className="flex items-center gap-1 self-start text-sm text-neutral-400 hover:text-neutral-200"
        >
          <Icon name="arrow_back" className="text-base" /> Voltar pra jornada
        </button>
        <header className="flex items-center gap-3">
          <Icon name={iconeDaFase(faseNome)} className="text-3xl text-purple-300" />
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-neutral-100">{faseNome}</h2>
            <span className="text-sm text-neutral-500">
              {feitosFase} de {itens.length} itens concluídos
            </span>
          </div>
        </header>
        <ul className="flex flex-col gap-2">
          {itens.map((item) => (
            <TrailItemCard
              key={item.id}
              step={item}
              concluido={estaConcluido(item)}
              destaque={item.id === proximo?.id}
              onToggle={() => toggle(item)}
            />
          ))}
        </ul>
      </div>
    )
  }

  // ---- Home: hero + próximo passo + cards das fases ----
  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <header className="flex items-center gap-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <ProgressRing percent={percent}>
          <span className="text-xl font-bold text-neutral-100">{percent}%</span>
        </ProgressRing>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-neutral-400">Sua jornada</p>
          <h2 className="flex items-center gap-1.5 text-2xl font-bold text-neutral-100">
            Olá, {nome} <Icon name="waving_hand" className="text-xl text-purple-300" />
          </h2>
          <p className="text-sm text-neutral-400">
            {feitos} de {total} itens · Fase {Math.min(faseAtualIndex + 1, fases.length)} de{' '}
            {fases.length}
          </p>
          {gestorNome && (
            <p className="text-xs text-neutral-500">
              Seu gestor: <span className="text-neutral-400">{gestorNome}</span>
            </p>
          )}
        </div>
      </header>

      {completa ? (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-purple-500/40 bg-purple-500/10 p-6 text-center">
          <Icon name="emoji_events" className="text-4xl text-purple-300" fill />
          <h3 className="text-lg font-semibold text-neutral-100">Jornada completa!</h3>
          <p className="text-sm text-neutral-400">
            Você foi do clone ao primeiro card. Bem-vindo(a) de verdade à Agilean.
          </p>
          <p className="flex items-center justify-center gap-1.5 text-base font-medium text-purple-200">
            Agora é com você! <Icon name="rocket_launch" className="text-lg" />
          </p>
          <Link
            to="/fluxos"
            className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400"
          >
            Ir pro Guia pelo sistema
          </Link>
        </section>
      ) : (
        proximo && (
          <section className="flex flex-col gap-3 rounded-2xl border border-purple-500/40 bg-purple-500/10 p-5">
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-purple-300">
                <Icon name="play_arrow" className="text-sm" /> Próximo · {proximo.phase}
              </span>
              <h3 className="text-lg font-semibold text-neutral-100">{proximo.title}</h3>
              <p className="text-sm text-neutral-400">{proximo.description}</p>
            </div>
            <button
              type="button"
              onClick={() => entrarFase(proximo.phase)}
              className="self-start rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400"
            >
              Ir para o passo
            </button>
          </section>
        )
      )}

      {/* Fases em cards — clica e entra na fase */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Fases da jornada
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fases.map(([fase, itens], i) => {
            const feitosFase = itens.filter(estaConcluido).length
            const pct = itens.length > 0 ? Math.round((feitosFase / itens.length) * 100) : 0
            const faseCompleta = feitosFase === itens.length
            const atual = proximo?.phase === fase
            const bloqueada = fase === FASE_FINAL && !faseFinalLiberada

            return (
              <button
                key={fase}
                type="button"
                disabled={bloqueada}
                onClick={() => entrarFase(fase)}
                className={cx(
                  'flex flex-col gap-2 rounded-2xl border bg-neutral-900 p-5 text-left transition-all duration-200',
                  bloqueada
                    ? 'cursor-not-allowed border-neutral-800 opacity-50'
                    : 'hover:-translate-y-0.5',
                  !bloqueada && (atual
                    ? 'border-purple-500/60 hover:border-purple-500'
                    : 'border-neutral-800 hover:border-purple-500/50'),
                )}
              >
                <div className="flex items-center justify-between">
                  <Icon name={iconeDaFase(fase)} className="text-2xl text-purple-300" />
                  {bloqueada ? (
                    <Icon name="lock" className="text-neutral-500" title="Complete as fases anteriores" />
                  ) : faseCompleta ? (
                    <Icon name="military_tech" className="text-amber-400" fill title="Fase concluída" />
                  ) : atual ? (
                    <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-medium text-purple-200">
                      Você está aqui
                    </span>
                  ) : (
                    <Icon name="chevron_right" className="text-neutral-600" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Fase {i + 1}
                  </span>
                  <h3 className="font-semibold text-neutral-100">{fase}</h3>
                </div>
                <span className="text-sm text-neutral-500">
                  {bloqueada ? 'Apto após concluir o resto' : `${feitosFase} de ${itens.length} itens`}
                </span>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all"
                    style={{ width: `${bloqueada ? 0 : pct}%` }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={onRestart}
        className="self-center text-sm text-neutral-500 hover:text-neutral-300"
      >
        Refazer nivelamento
      </button>
    </div>
  )
}
