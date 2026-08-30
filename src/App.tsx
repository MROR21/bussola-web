import { SessaoAutenticada } from './app/SessaoAutenticada'
import { Icon } from './components/Icon'
import { LoginForm } from './features/auth/LoginForm'
import { useAuthStore } from './features/auth/authStore'

function App() {
  const usuario = useAuthStore((state) => state.usuario)

  // Sem login: tela de entrada, fora de tudo. Logo+form moram no MESMO enquadramento (um cartão
  // só, maior e com mais respiro) em vez de texto solto sobre um card pequeno separado.
  if (!usuario) {
    return (
      // PREVIEW da paleta "cara de bússola" (navy + dourado) — só nesta tela, pra avaliar a
      // direção antes de varrer o app inteiro. Cores soltas em vez de token porque é só protótipo.
      <main className="flex min-h-screen items-center justify-center bg-[#0a0f1a] px-4 py-10 text-neutral-100">
        <div className="anim-page w-full max-w-lg rounded-3xl border border-[#1f2b47] bg-[#111a2e] p-10 shadow-2xl shadow-black/40">
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#c9a227]/10">
              <Icon name="explore" className="text-3xl text-[#d4af37]" />
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
