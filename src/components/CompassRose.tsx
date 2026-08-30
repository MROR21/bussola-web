// Rosa dos ventos de 8 pontas, construída geometricamente (polígonos girados por transform, sem
// path desenhado à mão) — o motivo central do visual "carta de navegação" da tela de login.
export function CompassRose({ className = '' }: { className?: string }) {
  const pontaLonga = '50,4 44,50 56,50'
  const pontaCurta = '50,22 46,50 54,50'

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.75" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      {[0, 90, 180, 270].map((graus) => (
        <polygon key={graus} points={pontaLonga} fill="currentColor" transform={`rotate(${graus} 50 50)`} />
      ))}
      {[45, 135, 225, 315].map((graus) => (
        <polygon
          key={graus}
          points={pontaCurta}
          fill="currentColor"
          opacity="0.7"
          transform={`rotate(${graus} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="3.5" fill="currentColor" />
    </svg>
  )
}
