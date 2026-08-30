// Fragmento de "carta de exploração" — montanhas em traço, uma rota pontilhada até um X, e umas
// ilhotas soltas mais adiante. Mesma construção geométrica simples da rosa dos ventos (sem path
// desenhado à mão livre) — só linha fina em `currentColor`, pensado pra ficar quase invisível de
// fundo (opacidade baixíssima é responsabilidade de quem usa, via className).
export function MapIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      {/* Cordilheira — picos triangulares com uma linha interna, tipo esboço topográfico. */}
      <path d="M10 165 L68 88 L102 132 L145 55 L200 165" strokeWidth="2" strokeLinejoin="round" />
      <path d="M50 122 L68 88 L88 118" strokeWidth="1.2" opacity="0.6" />
      <path d="M122 105 L145 55 L165 100" strokeWidth="1.2" opacity="0.6" />

      {/* Rota pontilhada, da borda esquerda até o X perto da serra. */}
      <path
        d="M0 178 Q 90 158 132 176 T 268 142"
        strokeWidth="1.5"
        strokeDasharray="4 7"
        strokeLinecap="round"
      />

      {/* X marca o local. */}
      <path d="M262 136 L274 148 M274 136 L262 148" strokeWidth="2" strokeLinecap="round" />

      {/* Arquipélago disperso mais à direita. */}
      <circle cx="320" cy="150" r="3" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="345" cy="167" r="2" fill="currentColor" stroke="none" opacity="0.5" />
      <circle cx="300" cy="172" r="1.6" fill="currentColor" stroke="none" opacity="0.5" />
    </svg>
  )
}
