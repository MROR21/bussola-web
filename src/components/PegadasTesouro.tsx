import { Mountain, TreePalm } from 'lucide-react'
import { Icon } from './Icon'

// Animação pra estados de erro/espera — pegadas seguindo uma rota ondulada (curva de verdade, não
// segmentos retos) até um X (o "tesouro"), com palmeiras e um morro (ícones do `lucide-react` — o
// Material Symbols não tem palmeira, e o pedido foi usar ícone de biblioteca, não desenho à mão)
// espalhados pelos cantos pra vibe de ilha. No lugar do ícone estático da bússola. Cada pegada
// acende e apaga em sequência (efeito de passos), o X pulsa marcando o destino. As posições e
// rotações das pegadas foram calculadas sobre a curva bezier real (script descartável, não
// chutadas no olho) pra cada uma apontar na direção do trecho que está percorrendo. As classes
// `anim-pegada`/`anim-tesouro` (keyframes em index.css) desligam sozinhas com
// prefers-reduced-motion.
const ROTA = 'M8 85 Q40 75 28 55 T60 32 T84 10 L78 4'

const PEGADAS = [
  { top: '82.6%', left: '14.7%', rotate: 68, atraso: 0 },
  { top: '61.1%', left: '30.7%', rotate: -15, atraso: 0.25 },
  { top: '36.9%', left: '34.3%', rotate: 67, atraso: 0.5 },
  { top: '31.7%', left: '63.4%', rotate: 85, atraso: 0.75 },
  { top: '21.9%', left: '90%', rotate: 16, atraso: 1 },
] as const

export function PegadasTesouro({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-44 w-72 translate-y-6 scale-[0.7] ${className}`} aria-hidden="true">
      <TreePalm className="absolute left-0 top-2 h-10 w-7 text-gold-500" />
      <TreePalm className="absolute -left-3 bottom-2 h-14 w-10 text-gold-500" />
      <TreePalm className="absolute right-0 bottom-6 h-10 w-7 -scale-x-100 text-gold-500" />
      <TreePalm className="absolute h-8 w-6 text-gold-500" style={{ top: '44%', left: '56%' }} />
      <Mountain className="absolute bottom-0 left-[24%] h-9 w-16 text-gold-500" />
      <Mountain className="absolute -top-2 h-9 w-16 text-gold-500" style={{ left: '52%' }} />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full text-gold-500/60"
      >
        <path
          d={ROTA}
          pathLength={100}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeDasharray="2 2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {PEGADAS.map((p, i) => (
        <span
          key={i}
          className="anim-pegada absolute text-2xl text-gold-500"
          style={{
            top: p.top,
            left: p.left,
            transform: `translate(-50%, -50%) rotate(${p.rotate}deg)`,
            animationDelay: `${p.atraso}s`,
          }}
        >
          <Icon name="footprint" />
        </span>
      ))}
      <span
        className="anim-tesouro absolute text-2xl text-gold-400"
        style={{ top: '-2%', left: '75%', transform: 'translate(-100%, -100%)' }}
      >
        <Icon name="close" />
      </span>
    </div>
  )
}
