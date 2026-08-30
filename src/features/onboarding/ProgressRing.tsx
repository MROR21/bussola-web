import type { ReactNode } from 'react'

// Anel de progresso circular (SVG). O trilho é o círculo de fundo; o arco roxo cresce com o percent.
export function ProgressRing({
  percent,
  size = 88,
  stroke = 9,
  children,
}: {
  percent: number
  size?: number
  stroke?: number
  children?: ReactNode
}) {
  const raio = (size - stroke) / 2
  const circunferencia = 2 * Math.PI * raio
  const preenchido = circunferencia - (Math.min(100, Math.max(0, percent)) / 100) * circunferencia

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={raio}
          strokeWidth={stroke}
          className="fill-none stroke-navy-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={raio}
          strokeWidth={stroke}
          strokeLinecap="round"
          className="fill-none stroke-gold-500 transition-[stroke-dashoffset] duration-500"
          style={{ strokeDasharray: circunferencia, strokeDashoffset: preenchido }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
