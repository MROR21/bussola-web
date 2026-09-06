import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { hrefDoTrailItem } from './useTrailNavegacao'
import type { TrailStep } from './types'

// Setas de anterior/próximo dentro de um Passo ou Fluxo, pra seguir a trilha sem voltar pra tela
// da Fase a cada item. Só aparece o que existir (início/fim da trilha ficam sem um dos lados).
export function NavegacaoTrilha({
  anterior,
  proximo,
}: {
  anterior?: TrailStep
  proximo?: TrailStep
}) {
  if (!anterior && !proximo) return null

  return (
    <div className="flex items-center justify-between gap-3 border-t border-navy-700 pt-4">
      {anterior ? (
        <Link
          to={hrefDoTrailItem(anterior)}
          state={{ deFase: true }}
          className="flex min-w-0 items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-neutral-200"
        >
          <Icon name="arrow_back" className="shrink-0 text-base" />
          <span className="truncate">{anterior.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {proximo && (
        <Link
          to={hrefDoTrailItem(proximo)}
          state={{ deFase: true }}
          className="flex min-w-0 items-center gap-1.5 text-right text-sm text-gold-400 transition-colors hover:text-gold-300"
        >
          <span className="truncate">{proximo.title}</span>
          <Icon name="arrow_forward" className="shrink-0 text-base" />
        </Link>
      )}
    </div>
  )
}
