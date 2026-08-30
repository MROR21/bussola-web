import { useState } from 'react'
import { CompassRose } from '../components/CompassRose'
import { useAuthStore } from '../features/auth/authStore'
import { useTitulo } from '../hooks/useTitulo'
import { NivelamentoForm } from '../features/nivelamento/NivelamentoForm'
import { salvarPerfil } from '../features/nivelamento/nivelamentoService'
import { perfilPadrao } from '../features/nivelamento/types'
import type { Perfil, Squad } from '../features/nivelamento/types'
import type { UsuarioLogado } from '../features/auth/types'

// Tela de nivelamento — focada, SEM o menu lateral (só aparece depois que a pessoa "entra").
// Salva o perfil e avisa o pai (onConcluir) pra liberar a casca.
export function NivelamentoPage({
  usuario,
  onConcluir,
}: {
  usuario: UsuarioLogado
  onConcluir: (perfil: Perfil) => void
}) {
  useTitulo('Nivelamento')
  const [erro, setErro] = useState<string | null>(null)
  const atualizarUsuario = useAuthStore((s) => s.atualizarUsuario)

  async function concluir(perfil: Perfil, squad: Squad) {
    setErro(null)
    try {
      await salvarPerfil(usuario.id, perfil, squad)
      atualizarUsuario({ squad }) // mantém o squad da sessão em dia (o filtro de Fluxos usa ele)
      onConcluir(perfil)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar o nivelamento')
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-navy-900 px-4 py-12 text-neutral-100">
      <CompassRose
        className="pointer-events-none absolute left-1/2 top-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 text-gold-500 opacity-[0.05]"
      />
      <div className="relative flex flex-col items-center gap-1">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <CompassRose className="size-8 text-gold-400" /> Vamos te situar
        </h1>
        <p className="text-sm text-neutral-400">Responda rápido pra personalizar sua jornada.</p>
      </div>
      {erro && <p className="anim-fade relative text-sm text-red-400">{erro}</p>}
      <NivelamentoForm onSubmit={concluir} onSkip={(squad) => concluir(perfilPadrao, squad)} />
    </main>
  )
}
