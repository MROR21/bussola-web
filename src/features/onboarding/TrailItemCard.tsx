import { Link } from 'react-router-dom'
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
  const href = isFluxo ? `/fluxo/${step.id}` : `/passo/${step.id}`
  const isResumo = !isFluxo && step.recommendedDepth === 'Resumo'

  return (
    <li
      className={cx(
        'rounded-xl border p-4 transition-colors',
        concluido && 'border-neutral-800 bg-neutral-900/40',
        !concluido && !destaque && 'border-neutral-800 bg-neutral-900',
        destaque && 'border-purple-500/60 bg-purple-500/10 ring-1 ring-purple-500/30',
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
              ? 'border-purple-500 bg-purple-500 text-white'
              : 'border-neutral-600 hover:border-purple-400',
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
              <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
                Fluxo do seu squad
              </span>
            ) : (
              <span className="text-xs text-neutral-500">Passo {step.order}</span>
            )}
            {step.isCompanySpecific && !isFluxo && (
              <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
                Agilean
              </span>
            )}
            {isResumo && (
              <span className="rounded-full bg-neutral-700/50 px-2 py-0.5 text-xs text-neutral-300">
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

          <Link to={href} className="self-start text-sm text-purple-300 hover:text-purple-200">
            Ver {isFluxo ? 'fluxo' : 'passo'} →
          </Link>
        </div>
      </div>
    </li>
  )
}
