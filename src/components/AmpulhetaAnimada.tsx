import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Icon } from './Icon'

// Quanto tempo a areia fica "parada" de cada lado (em cima esperando cair, embaixo esperando
// virar) antes de continuar pro próximo passo.
const INTERVALO_AREIA_MS = 2200
// Duração do giro em si — bem mais rápido que o intervalo acima, porque virar o objeto é uma
// ação rápida (um "click" de pulso), não algo gradual feito a areia caindo.
const GIRO_DURACAO_MS = 450

// Ampulheta "de verdade" pro sinal de "em análise/aguardando" do sistema. Lógica física correta:
// a areia CAI sem a ampulheta girar (é só o ícone trocando de hourglass_top pra hourglass_bottom,
// com crossfade) — o giro só acontece DEPOIS, pra virar a ampulheta de novo e voltar a ter areia
// em cima (é aí, e só aí, que ela roda). Sem isso, um giro contínuo/solto não faz sentido físico
// nenhum (a ampulheta giraria enquanto a areia ainda tá caindo, ou pararia de girar com ela de
// lado). Implementado com um "tick" que avança a cada intervalo, alternando entre as duas ações
// (trocar o ícone / girar 180°) — a rotação nunca "volta" pra 0 (só soma +180° a cada giro), e
// olhando de fora rotate(180deg) num hourglass_bottom parece exatamente um hourglass_top (e
// vice-versa), então a troca de ícone e o giro sempre ficam visualmente consistentes entre si.
// Para de avançar (fica parada com areia em cima) se o sistema pedir menos movimento.
export function AmpulhetaAnimada({ className = '' }: { className?: string }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setTick((v) => v + 1), INTERVALO_AREIA_MS)
    return () => clearInterval(t)
  }, [])

  // Ticks ímpares trocam o ícone (a areia caiu/subiu); ticks pares (a partir do 2º) giram — as
  // duas ações se alternam a cada tick, nunca ao mesmo tempo.
  const trocasDeIcone = Math.ceil(tick / 2)
  const giros = Math.floor(tick / 2)
  const areiaEmCima = trocasDeIcone % 2 === 0

  return (
    <Icon
      name={areiaEmCima ? 'hourglass_top' : 'hourglass_bottom'}
      className={`transition-opacity duration-700 ${className}`}
      style={
        {
          display: 'inline-block',
          transform: `rotate(${giros * 180}deg)`,
          transition: `transform ${GIRO_DURACAO_MS}ms ease-in-out`,
        } as CSSProperties
      }
    />
  )
}
