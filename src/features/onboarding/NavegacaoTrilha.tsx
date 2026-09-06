import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { hrefDoTrailItem } from './useTrailNavegacao'
import type { TrailStep } from './types'

// Setas de anterior/próximo dentro de um Passo ou Fluxo, pra seguir a trilha sem voltar pra tela
// da Fase a cada item — mas só DENTRO da mesma fase (ver `useTrailNavegacao`). Quando o item atual
// é o último da fase, `proximo` já vem undefined e `faseTerminada` avisa isso — no lugar da seta
// pro próximo item, mostra um link pra visão geral da FASE (que exibe "Fase concluída!"), pra ficar
// claro que a fase acabou antes de seguir pra próxima, em vez de pular direto sem avisar.
export function NavegacaoTrilha({
  anterior,
  proximo,
  faseTerminada,
  fase,
}: {
  anterior?: TrailStep
  proximo?: TrailStep
  faseTerminada?: boolean
  fase?: string
}) {
  const mostrarVerFase = faseTerminada && fase
  if (!anterior && !proximo && !mostrarVerFase) return null

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
      {proximo ? (
        <Link
          to={hrefDoTrailItem(proximo)}
          state={{ deFase: true }}
          className="flex min-w-0 items-center gap-1.5 text-right text-sm text-gold-400 transition-colors hover:text-gold-300"
        >
          <span className="truncate">{proximo.title}</span>
          <Icon name="arrow_forward" className="shrink-0 text-base" />
        </Link>
      ) : (
        mostrarVerFase && (
          <Link
            to={`/fase/${encodeURIComponent(fase)}`}
            className="flex min-w-0 items-center gap-1.5 text-right text-sm text-gold-400 transition-colors hover:text-gold-300"
          >
            <span className="truncate">Fase concluída · ver fase</span>
            <Icon name="military_tech" className="shrink-0 text-base" />
          </Link>
        )
      )}
    </div>
  )
}
