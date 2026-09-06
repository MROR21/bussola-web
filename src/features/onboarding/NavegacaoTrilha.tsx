import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'

export interface ItemNav {
  title: string
  href: string
}

// Setas de anterior/próximo dentro de um Passo ou Fluxo — serve dois contextos independentes:
// dentro da trilha de uma Fase da Jornada, OU dentro de um módulo do Guia (mesmo Fluxo pode
// aparecer nos dois, ver FluxoDetalhePage.tsx). Quem monta os itens (e decide se cabe "fase
// concluída") é a página que usa este componente — aqui é só renderização.
// `origemFase` marca o link com `state.deFase` pro Voltar/trilha da próxima página saberem que
// vieram da Jornada (só faz sentido passar true no contexto de Fase; no Guia fica de fora, senão
// a próxima página achava que também veio da Jornada).
// `faseTerminada`+`fase`: quando não tem mais `proximo` (é o último item do contexto) e esses dois
// vêm preenchidos, mostra um link pra visão geral da FASE (que exibe "Fase concluída!") no lugar da
// seta — só se aplica no contexto de Jornada; no Guia, ao chegar no último, só sobra a seta de
// "anterior" mesmo, sem nenhum aviso de fase (não existe fase lá).
export function NavegacaoTrilha({
  anterior,
  proximo,
  faseTerminada,
  fase,
  origemFase,
}: {
  anterior?: ItemNav
  proximo?: ItemNav
  faseTerminada?: boolean
  fase?: string
  origemFase?: boolean
}) {
  const mostrarVerFase = faseTerminada && fase
  if (!anterior && !proximo && !mostrarVerFase) return null

  const stateDeFase = origemFase ? { deFase: true } : undefined

  return (
    <div className="flex items-center justify-between gap-3 border-t border-navy-700 pt-4">
      {anterior ? (
        <Link
          to={anterior.href}
          state={stateDeFase}
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
          to={proximo.href}
          state={stateDeFase}
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
