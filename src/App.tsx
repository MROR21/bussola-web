import { SessaoAutenticada } from './app/SessaoAutenticada'
import { LoginForm } from './features/auth/LoginForm'
import { useAuthStore } from './features/auth/authStore'

function App() {
  const usuario = useAuthStore((state) => state.usuario)

  // Sem login: tela de entrada, fora de tudo.
  if (!usuario) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 text-neutral-100">
        <div className="anim-page flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-4xl font-bold tracking-tight">🧭 Bússola</h1>
            <p className="text-neutral-400">Onboarding técnico</p>
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
