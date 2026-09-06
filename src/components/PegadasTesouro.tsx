import { Icon } from './Icon'

// Palmeira em SILHUETA (traço bem grosso arredondado, lê como sólido, não linework fino) — é o
// estilo real de mapa do tesouro (referência que o Miguel mandou: ícones pretos "carimbados", não
// esboço técnico). Não existe "palmeira" no Material Symbols, então desenhamos à mão só uma vez
// aqui (mesma ideia de sempre: sem trazer biblioteca de ícone nova só por causa de 1 desenho).
function Palmeira({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 60" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M20 58 Q 15 38 23 20" strokeWidth={6} strokeLinecap="round" />
      <path d="M23 20 Q 6 13 2 26" strokeWidth={5} strokeLinecap="round" />
      <path d="M23 20 Q 10 4 16 14" strokeWidth={5} strokeLinecap="round" />
      <path d="M23 20 Q 23 2 27 9" strokeWidth={5} strokeLinecap="round" />
      <path d="M23 20 Q 37 4 34 15" strokeWidth={5} strokeLinecap="round" />
      <path d="M23 20 Q 40 14 39 27" strokeWidth={5} strokeLinecap="round" />
    </svg>
  )
}

// Morrinho em silhueta (skyline recortado sólido) — companhia da palmeira, mesmo pedido de
// referência ("um morrinho embaixo").
function Morro({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 26" className={className} fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M0 26 L9 8 L15 17 L24 2 L32 16 L38 9 L48 26 Z" />
    </svg>
  )
}

// Animação pra estados de erro/espera — pegadas em zigue-zague (cada uma rotacionada na direção de
// quem caminha) até um X (o "tesouro"), sobre uma rota pontilhada que também faz zigue-zague — a
// mesma "curva em S" de mapa do tesouro de verdade —, com palmeiras e um morrinho espalhados pelos
// cantos pra vibe de ilha. No lugar do ícone estático da bússola. Cada pegada acende e apaga em
// sequência (efeito de passos), o X pulsa marcando o destino. As classes `anim-pegada`/
// `anim-tesouro` (keyframes em index.css) desligam sozinhas com prefers-reduced-motion.
const PEGADAS = [
  { top: '78%', left: '6%', rotate: 66, atraso: 0 },
  { top: '58%', left: '50%', rotate: -27, atraso: 0.3 },
  { top: '38%', left: '40%', rotate: 65, atraso: 0.6 },
  { top: '20%', left: '78%', rotate: 29, atraso: 0.9 },
] as const

export function PegadasTesouro({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-36 w-56 ${className}`} aria-hidden="true">
      <Palmeira className="absolute -left-2 -top-1 h-10 w-7 text-gold-500/25" />
      <Palmeira className="absolute -left-3 bottom-2 h-14 w-10 text-gold-500/30" />
      <Palmeira className="absolute -right-3 bottom-4 h-10 w-7 -scale-x-100 text-gold-500/20" />
      <Morro className="absolute bottom-0 left-[26%] h-8 w-16 text-gold-500/20" />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full text-gold-500/30"
      >
        <path
          d="M6 78 L50 58 L40 38 L78 20 L84 9"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeDasharray="3 5"
          strokeLinecap="round"
          strokeLinejoin="round"
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
