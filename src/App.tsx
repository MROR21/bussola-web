import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './app/AppLayout'
import { LoginForm } from './features/auth/LoginForm'
import { useAuthStore } from './features/auth/authStore'
import { ChatPage } from './pages/ChatPage'
import { FluxosPage } from './pages/FluxosPage'
import { GestorPage } from './pages/GestorPage'
import { JornadaPage } from './pages/JornadaPage'

function App() {
  const usuario = useAuthStore((state) => state.usuario)

  // Sem login: tela de entrada, fora da casca.
  if (!usuario) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 px-4 text-neutral-100">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl font-bold tracking-tight">🧭 Bússola</h1>
          <p className="text-neutral-400">Onboarding técnico</p>
        </div>
        <LoginForm />
      </main>
    )
  }

  // Logado: casca com menu lateral + rotas.
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<JornadaPage />} />
          <Route path="/fluxos" element={<FluxosPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/gestor" element={<GestorPage />} />
          <Route path="*" element={<JornadaPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
