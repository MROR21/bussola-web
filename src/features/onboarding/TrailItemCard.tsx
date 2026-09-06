import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { MapCorners } from '../../components/MapCorners'
import { cx } from '../../utils/cx'
import type { TrailStep } from './types'

// Card de um item da trilha — passo de onboarding OU fluxo do squad (tipo === 'fluxo'). Só usado
// na lista de REVISÃO de uma fase já concluída — sem checkbox (nem interativo, nem visual): a
// conclusão só acontece de verdade dentro do próprio passo/fluxo (botão "Marcar como concluído"
// que já existe lá), e como aqui é sempre revisão de itens já feitos, o check não agrega nada.
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
      <div className="flex flex-col gap-1">
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
    </li>
  )
}
