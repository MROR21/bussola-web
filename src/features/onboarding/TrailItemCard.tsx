import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { MapCorners } from '../../components/MapCorners'
import { cx } from '../../utils/cx'
import type { TrailStep } from './types'

// Card de um item da trilha — passo de onboarding OU fluxo do squad (tipo === 'fluxo'). Só usado
// na lista de REVISÃO de uma fase já concluída — por isso não tem mais um checkbox interativo: a
// conclusão só acontece de verdade dentro do próprio passo/fluxo (botão "Marcar como concluído"
// que já existe lá). Aqui o ícone de check é só um indicador estático (todo item aqui já está feito).
// Clicar no título abre a página do item (passo ou fluxo) com o conteúdo completo.
export function TrailItemCard({
  step,
  concluido,
}: {
  step: TrailStep
  concluido: boolean
}) {
  const isFluxo = step.tipo === 'fluxo'
  const href = isFluxo
    ? `/fluxo/${encodeURIComponent(step.title)}`
    : `/passo/${encodeURIComponent(step.title)}`
  const isResumo = !isFluxo && step.recommendedDepth === 'Resumo'

  return (
    <li className="relative rounded-xl border border-navy-700 bg-navy-800/40 p-4 transition-colors">
      <MapCorners tamanho={3} opacidade={15} />
      <div className="flex items-start gap-3">
        <span
          className={cx(
            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border',
            concluido ? 'border-gold-500 bg-gold-500 text-white' : 'border-navy-500',
          )}
        >
          {concluido && (
            <svg viewBox="0 0 20 20" className="size-3.5 fill-current">
              <path d="M7.5 13.5 4 10l1.4-1.4 2.1 2.1 5.1-5.1L14 7z" />
            </svg>
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {isFluxo ? (
              <span className="rounded-full bg-gold-500/20 px-2 py-0.5 text-xs text-gold-400">
                Fluxo do seu squad
              </span>
            ) : (
              <span className="text-xs text-neutral-500">Passo {step.order}</span>
            )}
            {step.isCompanySpecific && !isFluxo && (
              <span className="rounded-full bg-gold-500/20 px-2 py-0.5 text-xs text-gold-400">
                Agilean
              </span>
            )}
            {isResumo && (
              <span className="rounded-full bg-navy-600/50 px-2 py-0.5 text-xs text-neutral-300">
                Resumo
              </span>
            )}
          </div>

          <Link
            to={href}
            className={cx(
              'font-medium leading-snug transition-colors hover:underline',
              concluido ? 'text-neutral-500 line-through' : 'text-neutral-100',
            )}
          >
            {step.title}
          </Link>

          <p className="text-sm text-neutral-400">{step.description}</p>

          <Link
            to={href}
            className="flex items-center gap-1 self-start text-sm text-gold-400 transition-colors hover:text-gold-300"
          >
            Ver {isFluxo ? 'fluxo' : 'passo'} <Icon name="arrow_forward" className="text-sm" />
          </Link>
        </div>
      </div>
    </li>
  )
}
