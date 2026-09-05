import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { cx } from '../../utils/cx'
import type { PassoProgresso } from './types'

// Ícone por fase — mesmo mapa da JornadaView (o colaborador vê a própria trilha com os mesmos
// ícones; aqui o gestor vê a de outra pessoa, mas a linguagem visual precisa ser a mesma).
const FASE_ICONE: Record<string, string> = {
  Ambientação: 'waving_hand',
  'Ambiente técnico': 'computer',
  Padrões: 'square_foot',
  'Conheça o sistema': 'hub',
  'Primeiro Card': 'emoji_events',
}
const iconeDaFase = (fase: string) => FASE_ICONE[fase] ?? 'flag'
const FASE_FINAL = 'Primeiro Card'

const TRILHA_CIRCULO = 64
const TRILHA_PASSO_Y = 168
const TRILHA_AMPLITUDE = 25

// Versão SOMENTE LEITURA da trilha da JornadaView, pro gestor ver o progresso de um
// supervisionado — mesma linguagem visual (mesmo desenho, mesmas cores/ícones), mas sem edição:
// clicar num marco só abre/fecha os itens daquela fase aqui embaixo, não navega nem marca nada.
export function TrilhaFasesLeitura({ passos }: { passos: PassoProgresso[] }) {
  const [faseExpandida, setFaseExpandida] = useState<string | null>(null)

  const fases = useMemo(() => {
    const grupos = new Map<string, PassoProgresso[]>()
    for (const p of passos) {
      const lista = grupos.get(p.phase) ?? []
      lista.push(p)
      grupos.set(p.phase, lista)
    }
    return [...grupos.entries()]
  }, [passos])

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

  const proximo = passos.find((p) => !p.concluido)
  const indiceFaseFinal = fases.findIndex(([fase]) => fase === FASE_FINAL)
  const faseFinalLiberada =
    indiceFaseFinal < 0 ||
    fases.slice(0, indiceFaseFinal).every(([, itens]) => itens.every((p) => p.concluido))

  const itensExpandidos = faseExpandida ? fases.find(([f]) => f === faseExpandida)?.[1] : undefined

  if (fases.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
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
          const feitosFase = itens.filter((p) => p.concluido).length
          const pct = itens.length > 0 ? Math.round((feitosFase / itens.length) * 100) : 0
          const faseCompleta = feitosFase === itens.length
          const atual = proximo?.phase === fase
          const bloqueada = fase === FASE_FINAL && !faseFinalLiberada
          const ponto = pontosTrilha[i]
          const expandida = faseExpandida === fase

          return (
            <button
              key={fase}
              type="button"
              onClick={() => setFaseExpandida(expandida ? null : fase)}
              className={cx(
                'absolute flex w-[152px] -translate-x-1/2 flex-col items-center gap-2 transition-transform duration-200',
                'hover:-translate-y-0.5',
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
                  expandida && 'ring-2 ring-gold-300/60',
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
                  <span className="rounded-full bg-gold-500/20 px-2 py-0.5 text-[10px] font-medium text-gold-300">
                    Está aqui
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

      {itensExpandidos && (
        <section className="anim-fade flex flex-col gap-2 rounded-2xl border border-navy-700 bg-navy-800 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {faseExpandida}
          </h4>
          <ul className="flex flex-col gap-1.5">
            {itensExpandidos.map((p) => (
              <li key={p.id} className="flex flex-col gap-1 text-sm">
                <div className="flex items-center gap-2">
                  <Icon
                    name={p.concluido ? 'check_circle' : 'radio_button_unchecked'}
                    className={cx('text-base', p.concluido ? 'text-gold-400' : 'text-neutral-600')}
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
                        className="break-all text-gold-400 underline transition-colors hover:text-gold-300"
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
      )}
    </div>
  )
}
