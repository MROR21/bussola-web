import { Icon } from './Icon'

// Ícone de palmeira em traço simples (mesma técnica das outras ilustrações do app — só linha em
// `currentColor`, sem path desenhado à mão livre) — não existe "palmeira" no Material Symbols
// (só árvores genéricas tipo "forest"/"park"), então desenhamos uma pra reforçar a vibe de "ilha/
// floresta tropical" que o Miguel pediu ao lado da animação.
function Palmeira({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 60" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M20 60 Q 15 40 23 19" strokeWidth={2} strokeLinecap="round" />
      <path d="M23 19 Q 4 10 3 27" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M23 19 Q 11 3 18 15" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M23 19 Q 24 1 29 11" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M23 19 Q 38 3 35 17" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M23 19 Q 41 12 40 28" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx="21" cy="23" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="26" cy="25" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

// Animação pra estados de erro/espera — pegadas subindo em zigue-zague (rotacionadas na direção de
// quem caminha) até um X (o "tesouro"), sobre uma rota pontilhada tipo mapa do tesouro, com
// palmeiras nos cantos sugerindo uma ilha/floresta. No lugar do ícone estático da bússola. Cada
// pegada acende e apaga em sequência (efeito de passos), o X pulsa marcando o destino. As classes
// `anim-pegada`/`anim-tesouro` (keyframes em index.css) desligam sozinhas com
// prefers-reduced-motion, como as outras animações do app.
const PEGADAS = [
  { top: '68.8%', left: '16.7%', rotate: 34, atraso: 0 },
  { top: '57.8%', left: '41.1%', rotate: 58, atraso: 0.3 },
  { top: '34.8%', left: '54.7%', rotate: 40, atraso: 0.6 },
  { top: '23.8%', left: '79.1%', rotate: 60, atraso: 0.9 },
] as const

export function PegadasTesouro({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-32 w-48 ${className}`} aria-hidden="true">
      <Palmeira className="absolute -left-2 bottom-0 h-14 w-10 text-gold-500/25" />
      <Palmeira className="absolute -right-3 bottom-2 h-11 w-8 -scale-x-100 text-gold-500/20" />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full text-gold-500/30"
      >
        <path
          d="M10 85 L82 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeDasharray="3 5"
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
        style={{ top: '10%', left: '84%', transform: 'translate(-50%, -50%)' }}
      >
        <Icon name="close" />
      </span>
    </div>
  )
}
