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
const ROTA = 'M8 85 Q40 75 28 55 T60 32 T84 10'

const PEGADAS = [
  { top: '67.8%', left: '31%', rotate: 12, atraso: 0 },
  { top: '46.1%', left: '25.5%', rotate: 7, atraso: 0.25 },
  { top: '34.1%', left: '43.4%', rotate: 78, atraso: 0.5 },
  { top: '30.7%', left: '71.8%', rotate: 81, atraso: 0.75 },
  { top: '26.7%', left: '85.7%', rotate: 60, atraso: 1 },
] as const

export function PegadasTesouro({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-36 w-56 ${className}`} aria-hidden="true">
      <TreePalm className="absolute -left-2 -top-1 h-10 w-7 text-gold-500/25" />
      <TreePalm className="absolute -left-3 bottom-2 h-14 w-10 text-gold-500/30" />
      <TreePalm className="absolute -right-3 bottom-4 h-10 w-7 -scale-x-100 text-gold-500/20" />
      <TreePalm className="absolute h-8 w-6 text-gold-500/25" style={{ top: '44%', left: '56%' }} />
      <Mountain className="absolute bottom-0 left-[24%] h-9 w-16 text-gold-500/20" />
      <Mountain className="absolute -top-2 h-9 w-16 text-gold-500/20" style={{ left: '52%' }} />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full text-gold-500/30"
      >
        <path
          d={ROTA}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeDasharray="3 4"
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
        style={{ top: '9%', left: '84%', transform: 'translate(-50%, -50%)' }}
      >
        <Icon name="close" />
      </span>
    </div>
  )
}
