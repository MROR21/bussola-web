import { useEffect, useState } from 'react'
import { EstadoErro } from '../components/EstadoErro'
import { useAuthStore } from '../features/auth/authStore'
import { postTrail } from '../features/nivelamento/nivelamentoService'
import type { Perfil } from '../features/nivelamento/types'
import { JornadaView } from '../features/onboarding/JornadaView'
import type { TrailStep } from '../features/onboarding/types'

// Rota "/" — a home da jornada. Só é renderizada quando o usuário já nivelou, então aqui é só
// montar a trilha do perfil e mostrar. "Refazer nivelamento" volta pra tela de nivelamento (no pai).
export function JornadaPage({
  perfil,
  gestorNome,
  onRefazer,
}: {
  perfil: Perfil
  gestorNome: string | null
  onRefazer: () => void
}) {
  const usuario = useAuthStore((state) => state.usuario)
  const [trail, setTrail] = useState<TrailStep[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    setError(null)
    postTrail(perfil)
      .then((t) => {
        if (!cancelado) setTrail(t)
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'Erro ao montar sua trilha')
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [perfil, tentativa])

  if (!usuario) return null
  if (loading) return <p className="text-neutral-400">Montando sua trilha...</p>
  if (error) return <EstadoErro onRetry={() => setTentativa((t) => t + 1)} />
  if (!trail) return null

  return (
    <div className="anim-fade">
      <JornadaView
        trail={trail}
        userId={usuario.id}
        nome={usuario.nome}
        gestorNome={gestorNome}
        onRestart={onRefazer}
      />
    </div>
  )
}
