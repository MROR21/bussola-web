import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CompassRose } from '../../components/CompassRose'
import { Icon } from '../../components/Icon'
import { MapCorners } from '../../components/MapCorners'
import { MapIllustration } from '../../components/MapIllustration'
import { TrailDivider } from '../../components/TrailDivider'
import { useTitulo } from '../../hooks/useTitulo'
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

// Layout da trilha central: cada fase é um marco numa linha sinuosa (zigue-zague), não um grid de
// cards — o pedido foi um caminho visual de verdade. X em % (responsivo, mesma escala do viewBox
// do SVG) e Y em px reais (a altura do container é fixa em px).
const TRILHA_CIRCULO = 64
const TRILHA_PASSO_Y = 168
const TRILHA_AMPLITUDE = 25

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

  useTitulo(faseSelecionada ?? 'Jornada')

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

  // Coordenadas de cada marco da trilha (uma vez por fase) + o caminho SVG que os liga em curva.
  const pontosTrilha = useMemo(
    () =>
      fases.map((_, i) => ({
        x: i === 0 ? 50 : i % 2 === 1 ? 50 - TRILHA_AMPLITUDE : 50 + TRILHA_AMPLITUDE,
        y: i * TRILHA_PASSO_Y + TRILHA_CIRCULO / 2,
      })),
    [fases],
  )

  const alturaTrilha =
    pontosTrilha.length > 0 ? pontosTrilha[pontosTrilha.length - 1].y + TRILHA_CIRCULO / 2 + 90 : 0

  const caminhoTrilha = useMemo(() => {
    if (pontosTrilha.length < 2) return ''
    let d = `M ${pontosTrilha[0].x} ${pontosTrilha[0].y}`
    for (let i = 1; i < pontosTrilha.length; i++) {
      const anterior = pontosTrilha[i - 1]
      const atual = pontosTrilha[i]
      const meioY = (anterior.y + atual.y) / 2
      d += ` C ${anterior.x} ${meioY}, ${atual.x} ${meioY}, ${atual.x} ${atual.y}`
    }
    return d
  }, [pontosTrilha])

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
          className="flex items-center gap-1 self-start text-sm text-neutral-400 transition-colors hover:text-neutral-200"
        >
          <Icon name="arrow_back" className="text-base" /> Voltar pra jornada
        </button>
        <header className="flex items-center gap-3">
          <Icon name={iconeDaFase(faseNome)} className="text-3xl text-gold-400" />
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
    <div className="relative flex w-full max-w-2xl flex-col gap-8">
      {/* Atmosfera da página inteira — igual à técnica do hero (absoluto + DOM antes dos
          irmãos "opacos", sem z-index negativo): um `position:fixed` com z negativo parecia
          funcionar, mas quebrou quando o `AppLayout` ganhou `position:relative` lá em cima (o
          fixed passou a ficar preso na stacking context do layout, atrás do próprio fundo do
          app). absolute+DOM-order não tem essa armadilha. Dois motivos, cantos opostos, pra dar
          mais vida (rosa dos ventos em cima, mapa embaixo) sem competir com a do hero. */}
      <CompassRose
        className="pointer-events-none absolute -right-16 -top-10 size-[520px] text-gold-500 opacity-[0.06]"
      />
      <MapIllustration
        className="pointer-events-none absolute -bottom-10 -left-20 w-[420px] text-gold-500 opacity-[0.07]"
      />
      {/* Hero — anel de progresso + próximo passo num único cartão (antes eram duas caixas soltas
          empilhadas; agora lê como um bloco só, com o glow sutil atrás do anel). */}
      <div className="relative overflow-hidden rounded-3xl border border-navy-700 bg-navy-800 shadow-xl shadow-black/20">
        <MapCorners />
        <CompassRose
          className="pointer-events-none absolute -bottom-10 -right-10 size-40 text-gold-500 opacity-[0.06]"
        />
        <div
          className="pointer-events-none absolute -left-12 -top-16 size-56 rounded-full bg-gold-500/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-5 p-6">
          <ProgressRing percent={percent} size={96}>
            <span className="text-xl font-bold text-neutral-100">{percent}%</span>
          </ProgressRing>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-neutral-400">Sua jornada</p>
            <h2 className="flex items-center gap-1.5 text-2xl font-bold text-neutral-100">
              Olá, {nome} <Icon name="waving_hand" className="text-xl text-gold-400" />
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
        </div>

        {completa ? (
          <div className="anim-fade relative flex flex-col items-center gap-3 border-t border-navy-700 bg-gold-500/10 p-6 text-center">
            <Icon name="emoji_events" className="text-4xl text-gold-400" fill />
            <h3 className="text-lg font-semibold text-neutral-100">Jornada completa!</h3>
            <p className="text-sm text-neutral-400">
              Você foi do clone ao primeiro card. Bem-vindo(a) de verdade à Agilean.
            </p>
            <TrailDivider className="w-40" />
            <p className="flex items-center justify-center gap-1.5 text-base font-medium text-gold-300">
              Agora é com você! <Icon name="rocket_launch" className="text-lg" />
            </p>
            <Link
              to="/fluxos"
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-400"
            >
              Ir pro Guia pelo sistema
            </Link>
          </div>
        ) : (
          proximo && (
            <div className="anim-fade relative flex flex-col gap-3 border-t border-navy-700 bg-gold-500/10 p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gold-400/50 bg-navy-800 text-gold-400">
                  <Icon name={iconeDaFase(proximo.phase)} className="text-lg" />
                </span>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gold-400">
                    <Icon name="play_arrow" className="text-sm" /> Próximo · {proximo.phase}
                  </span>
                  <h3 className="text-lg font-semibold text-neutral-100">{proximo.title}</h3>
                  <p className="text-sm text-neutral-400">{proximo.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => entrarFase(proximo.phase)}
                className="self-start rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-400"
              >
                Ir para o passo
              </button>
            </div>
          )
        )}
      </div>

      {/* Trilha central — um caminho sinuoso ligando as fases, marco por marco (em vez de um
          grid de cards): o pedido foi um sentido de trilha literal, não uma lista disfarçada. */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Fases da jornada
        </h3>
        <div className="relative mx-auto w-full max-w-md" style={{ height: alturaTrilha }}>
          <svg
            viewBox={`0 0 100 ${alturaTrilha}`}
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 size-full text-navy-700"
            aria-hidden="true"
          >
            <path
              d={caminhoTrilha}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeDasharray="3 7"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {fases.map(([fase, itens], i) => {
            const feitosFase = itens.filter(estaConcluido).length
            const pct = itens.length > 0 ? Math.round((feitosFase / itens.length) * 100) : 0
            const faseCompleta = feitosFase === itens.length
            const atual = proximo?.phase === fase
            const bloqueada = fase === FASE_FINAL && !faseFinalLiberada
            const ponto = pontosTrilha[i]

            return (
              <button
                key={fase}
                type="button"
                disabled={bloqueada}
                onClick={() => entrarFase(fase)}
                className={cx(
                  'absolute flex w-[152px] -translate-x-1/2 flex-col items-center gap-2 transition-transform duration-200',
                  bloqueada ? 'cursor-not-allowed' : 'hover:-translate-y-0.5',
                )}
                style={{ left: `${ponto.x}%`, top: ponto.y - TRILHA_CIRCULO / 2 }}
              >
                <span
                  className={cx(
                    'flex size-16 shrink-0 items-center justify-center rounded-full border-2 bg-navy-800 text-2xl transition-colors duration-200',
                    bloqueada
                      ? 'border-dashed border-navy-600 text-neutral-600 opacity-60'
                      : faseCompleta
                        ? 'border-amber-400/70 text-amber-400'
                        : atual
                          ? 'border-gold-400 text-gold-400 shadow-[0_0_0_5px_rgba(201,162,39,0.15)]'
                          : 'border-navy-600 text-gold-400 hover:border-gold-500/60',
                  )}
                >
                  <Icon
                    name={bloqueada ? 'lock' : faseCompleta ? 'military_tech' : iconeDaFase(fase)}
                    fill={faseCompleta}
                  />
                </span>
                <span className="flex w-full flex-col items-center gap-1 rounded-xl border border-navy-700 bg-navy-800 px-3 py-2 text-center">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                    Fase {i + 1}
                  </span>
                  <span className="text-xs font-semibold leading-tight text-neutral-100">{fase}</span>
                  {atual && !bloqueada && (
                    <span className="anim-pop rounded-full bg-gold-500/20 px-2 py-0.5 text-[10px] font-medium text-gold-300">
                      Você está aqui
                    </span>
                  )}
                  <span className="text-[11px] text-neutral-500">
                    {bloqueada ? 'Apto após concluir o resto' : `${feitosFase} de ${itens.length}`}
                  </span>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-navy-700">
                    <div
                      className="h-full rounded-full bg-gold-500 transition-all"
                      style={{ width: `${bloqueada ? 0 : pct}%` }}
                    />
                  </div>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={onRestart}
        className="self-center text-sm text-neutral-500 transition-colors hover:text-neutral-300"
      >
        Refazer nivelamento
      </button>
    </div>
  )
}
