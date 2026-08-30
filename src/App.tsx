import { SessaoAutenticada } from './app/SessaoAutenticada'
import { CompassRose } from './components/CompassRose'
import { LoginForm } from './features/auth/LoginForm'
import { useAuthStore } from './features/auth/authStore'

function App() {
  const usuario = useAuthStore((state) => state.usuario)

  // Sem login: tela de entrada, fora de tudo. Logo+form moram no MESMO enquadramento (um cartão
  // só, maior e com mais respiro) em vez de texto solto sobre um card pequeno separado.
  if (!usuario) {
    return (
      // PREVIEW da paleta+ornamentos "carta de navegação" (navy + dourado, rosa dos ventos, cantos
      // de moldura) — só nesta tela, pra avaliar a direção antes de varrer o app inteiro.
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0f1a] px-4 py-10 text-neutral-100">
        <CompassRose
          className="pointer-events-none absolute left-1/2 top-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 text-[#c9a227] opacity-[0.05]"
        />

        <div className="anim-page relative w-full max-w-lg rounded-3xl border border-[#1f2b47] bg-[#111a2e] p-10 shadow-2xl shadow-black/40">
          <span className="pointer-events-none absolute left-3 top-3 size-7 rounded-tl-lg border-l-2 border-t-2 border-[#c9a227]/40" />
          <span className="pointer-events-none absolute right-3 top-3 size-7 rounded-tr-lg border-r-2 border-t-2 border-[#c9a227]/40" />
          <span className="pointer-events-none absolute bottom-3 left-3 size-7 rounded-bl-lg border-b-2 border-l-2 border-[#c9a227]/40" />
          <span className="pointer-events-none absolute bottom-3 right-3 size-7 rounded-br-lg border-b-2 border-r-2 border-[#c9a227]/40" />

          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#c9a227]/10">
              <CompassRose className="size-8 text-[#d4af37]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Bússola</h1>
            <p className="text-sm text-neutral-400">Onboarding técnico</p>
          </div>
          <LoginForm />
        </div>
      </main>
    )
  }

  // Logado: decide entre nivelamento (sem menu) e a casca (com menu).
  return <SessaoAutenticada usuario={usuario} />
}

export default App
