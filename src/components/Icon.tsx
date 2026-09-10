import type { CSSProperties } from 'react'

// Ícone via Material Symbols (fonte com ligature — o texto vira o glifo). Substitui os emojis do
// app por algo que não parece "genérico"/copiado de outro sistema (pedido do gestor). `fill` deixa
// o traço preenchido (equivalente ao estado "ativo"/selecionado em vez do outline padrão).
export function Icon({
  name,
  className = '',
  fill = false,
  title,
  size,
  style,
}: {
  name: string
  className?: string
  fill?: boolean
  title?: string
  // Tamanho em px via style inline — só pra quando uma classe de tamanho (text-xs, text-[11px]
  // etc.) não é suficiente pra vencer o `font-size: 24px` fixo que o pacote material-symbols
  // define pra `.material-symbols-outlined` (inline style sempre tem prioridade sobre classe).
  size?: number
  // Passagem livre de style (ex.: transform/transition inline de uma animação, ver
  // AmpulhetaAnimada.tsx) — mescla por cima de fill/size.
  style?: CSSProperties
}) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        ...(fill ? { fontVariationSettings: "'FILL' 1" } : undefined),
        ...(size ? { fontSize: size } : undefined),
        ...style,
      }}
      title={title}
      aria-hidden={title ? undefined : true}
    >
      {name}
    </span>
  )
}
