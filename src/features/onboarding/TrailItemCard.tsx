import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { cx } from '../../utils/cx'
import type { TrailStep } from './types'

// Card de um item da trilha — passo de onboarding OU fluxo do squad (tipo === 'fluxo').
// Check = concluído (esmaecido); destaque = próximo item (aro roxo).
// Clicar no título abre a página do item (passo ou fluxo) com o conteúdo completo.
export function TrailItemCard({
  step,
  concluido,
  destaque,
  onToggle,
}: {
  step: TrailStep
  concluido: boolean
  destaque: boolean
  onToggle: () => void
}) {
  const isFluxo = step.tipo === 'fluxo'
  const href = isFluxo
    ? `/fluxo/${encodeURIComponent(step.title)}`
    : `/passo/${encodeURIComponent(step.title)}`
  const isResumo = !isFluxo && step.recommendedDepth === 'Resumo'

  return (
    <li
      className={cx(
        'rounded-xl border p-4 transition-colors',
        concluido && 'border-navy-700 bg-navy-800/40',
        !concluido && !destaque && 'border-navy-700 bg-navy-800',
        destaque && 'border-gold-500/60 bg-gold-500/10 ring-1 ring-gold-500/30',
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={concluido ? 'Marcar como não concluído' : 'Marcar como concluído'}
          className={cx(
            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
            concluido
              ? 'border-gold-500 bg-gold-500 text-white'
              : 'border-navy-500 hover:border-gold-400',
          )}
        >
          {concluido && (
            <svg viewBox="0 0 20 20" className="size-3.5 fill-current">
              <path d="M7.5 13.5 4 10l1.4-1.4 2.1 2.1 5.1-5.1L14 7z" />
            </svg>
          )}
        </button>

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
              'font-medium leading-snug hover:underline',
              concluido ? 'text-neutral-500 line-through' : 'text-neutral-100',
            )}
          >
            {step.title}
          </Link>

          <p className="text-sm text-neutral-400">{step.description}</p>

          <Link
            to={href}
            className="flex items-center gap-1 self-start text-sm text-gold-400 hover:text-gold-300"
          >
            Ver {isFluxo ? 'fluxo' : 'passo'} <Icon name="arrow_forward" className="text-sm" />
          </Link>
        </div>
      </div>
    </li>
  )
}
