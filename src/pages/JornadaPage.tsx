import { useEffect, useState } from 'react'
import { useAuthStore } from '../features/auth/authStore'
import { getUser } from '../features/auth/userService'
import { NivelamentoForm } from '../features/nivelamento/NivelamentoForm'
import { postTrail, salvarPerfil } from '../features/nivelamento/nivelamentoService'
import { perfilPadrao } from '../features/nivelamento/types'
import type { Perfil } from '../features/nivelamento/types'
import { JornadaView } from '../features/onboarding/JornadaView'
import type { TrailStep } from '../features/onboarding/types'

// Rota "/" — a jornada do usuário. Ao entrar, decide entre questionário e trilha.
export function JornadaPage() {
  const usuario = useAuthStore((state) => state.usuario)
  const [trail, setTrail] = useState<TrailStep[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Busca o usuário: se já nivelou, monta a trilha do perfil salvo; senão, mostra o nivelamento.
  useEffect(() => {
    if (!usuario) return
    let cancelado = false
    setLoading(true)
    setError(null)
    getUser(usuario.id)
      .then(async (detalhe) => {
        if (cancelado) return
        setTrail(detalhe.nivelamentoConcluido ? await postTrail(detalhe.perfil) : null)
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'Erro ao carregar sua jornada')
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [usuario])

  // Fim do questionário: salva o perfil e monta a trilha. "Pular" usa o perfil padrão.
  async function carregarTrilha(perfil: Perfil) {
    if (!usuario) return
    setLoading(true)
    setError(null)
    try {
      await salvarPerfil(usuario.id, perfil)
      setTrail(await postTrail(perfil))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao montar a trilha')
    } finally {
      setLoading(false)
    }
  }

  if (!usuario) return null
  if (loading) return <p className="text-neutral-400">Carregando sua jornada...</p>
  if (error) return <p className="text-red-400">Erro: {error}</p>

  return trail ? (
    <JornadaView
      trail={trail}
      userId={usuario.id}
      nome={usuario.nome}
      onRestart={() => setTrail(null)}
    />
  ) : (
    <NivelamentoForm onSubmit={carregarTrilha} onSkip={() => carregarTrilha(perfilPadrao)} />
  )
}
