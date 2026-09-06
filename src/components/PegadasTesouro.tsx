import { Icon } from './Icon'

// Animação pra estados de erro/espera — pegadas "andando" em zigue-zague até um X (o "tesouro"),
// no lugar do ícone estático da bússola. Cada pegada acende e apaga em sequência (efeito de
// passos), o X pulsa marcando o destino. As classes `anim-pegada`/`anim-tesouro` (keyframes em
// index.css) desligam sozinhas com prefers-reduced-motion, como as outras animações do app.
const PEGADAS = [
  { top: '68%', left: '2%', rotate: -14, atraso: 0 },
  { top: '44%', left: '26%', rotate: 10, atraso: 0.3 },
  { top: '58%', left: '50%', rotate: -10, atraso: 0.6 },
  { top: '32%', left: '72%', rotate: 12, atraso: 0.9 },
] as const

export function PegadasTesouro({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-14 w-40 ${className}`} aria-hidden="true">
      {PEGADAS.map((p, i) => (
        <span
          key={i}
          className="anim-pegada absolute text-2xl text-gold-500"
          style={{ top: p.top, left: p.left, transform: `rotate(${p.rotate}deg)`, animationDelay: `${p.atraso}s` }}
        >
          <Icon name="footprint" />
        </span>
      ))}
      <span className="anim-tesouro absolute right-0 top-0 text-2xl text-gold-400">
        <Icon name="close" />
      </span>
    </div>
  )
}
