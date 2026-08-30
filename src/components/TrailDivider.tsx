import { Icon } from './Icon'

// Divisor "rota de mapa do tesouro" — trilha pontilhada com um marco no meio, entre dois pontos de
// parada. Puramente decorativo (aria-hidden), usado como flourish entre seções.
export function TrailDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-gold-500/50 ${className}`} aria-hidden="true">
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      <span className="flex-1 border-t border-dashed border-current" />
      <Icon name="explore" className="shrink-0 text-sm" />
      <span className="flex-1 border-t border-dashed border-current" />
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
    </div>
  )
}
