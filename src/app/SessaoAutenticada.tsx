import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { EstadoErro } from '../components/EstadoErro'
import { Carregando } from '../components/Spinner'
import { getUser } from '../features/auth/userService'
import type { UsuarioLogado } from '../features/auth/types'
import type { Perfil } from '../features/nivelamento/types'
import { AppLayout } from './AppLayout'
import { AdminPage } from '../pages/AdminPage'
import { ChatPage } from '../pages/ChatPage'
import { FluxoDetalhePage } from '../pages/FluxoDetalhePage'
import { FluxosPage } from '../pages/FluxosPage'
import { GestorPage } from '../pages/GestorPage'
import { JornadaPage } from '../pages/JornadaPage'
import { NivelamentoPage } from '../pages/NivelamentoPage'
import { PassoDetalhePage } from '../pages/PassoDetalhePage'
import { PerfilPage } from '../pages/PerfilPage'
import { SupervisionadoPage } from '../pages/SupervisionadoPage'

type Estado = 'carregando' | 'nivelar' | 'pronto'

function TelaCheia({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-neutral-100">
      {children}
    </main>
  )
}

// Decide, depois do login, entre a tela de nivelamento (sem menu) e a casca (com menu).
// Só entra na casca quando o usuário já nivelou.
export function SessaoAutenticada({ usuario }: { usuario: UsuarioLogado }) {
  const [estado, setEstado] = useState<Estado>('carregando')
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [gestorNome, setGestorNome] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let cancelado = false
    setEstado('carregando')
    setError(null)
    getUser(usuario.id)
      .then((detalhe) => {
        if (cancelado) return
        setGestorNome(detalhe.gestorNome)
        // Gestor não passa pelo nivelamento — cai direto na casca (e o "/" redireciona pro painel).
        if (detalhe.isGestor || detalhe.nivelamentoConcluido) {
          setPerfil(detalhe.perfil)
          setEstado('pronto')
        } else {
          setEstado('nivelar')
        }
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'Erro ao carregar sua sessão')
      })
    return () => {
      cancelado = true
    }
  }, [usuario.id, tentativa])

  if (error) {
    return (
      <TelaCheia>
        <EstadoErro
          mensagem="Não consegui carregar sua sessão. Verifique a conexão e tente de novo."
          onRetry={() => setTentativa((t) => t + 1)}
        />
      </TelaCheia>
    )
  }
  if (estado === 'carregando') {
    return <TelaCheia><Carregando texto="Carregando sua jornada..." /></TelaCheia>
  }
  if (estado === 'nivelar') {
    return (
      <NivelamentoPage
        usuario={usuario}
        onConcluir={(p) => {
          setPerfil(p)
          setEstado('pronto')
        }}
      />
    )
  }

  // pronto → casca com menu
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={
              usuario.isGestor ? (
                <Navigate to="/gestor" replace />
              ) : (
                <JornadaPage
                  perfil={perfil!}
                  gestorNome={gestorNome}
                  onRefazer={() => setEstado('nivelar')}
                />
              )
            }
          />
          <Route
            path="/fase/:nome"
            element={
              usuario.isGestor ? (
                <Navigate to="/gestor" replace />
              ) : (
                <JornadaPage
                  perfil={perfil!}
                  gestorNome={gestorNome}
                  onRefazer={() => setEstado('nivelar')}
                />
              )
            }
          />
          <Route path="/passo/:id" element={<PassoDetalhePage />} />
          <Route path="/fluxos" element={<FluxosPage />} />
          <Route path="/fluxos/:modulo" element={<FluxosPage />} />
          <Route path="/fluxo/:id" element={<FluxoDetalhePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route
            path="/gestor"
            element={usuario.isGestor ? <GestorPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/supervisionado/:id"
            element={usuario.isGestor ? <SupervisionadoPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/admin"
            element={usuario.isGestor ? <AdminPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="*"
            element={
              usuario.isGestor ? (
                <Navigate to="/gestor" replace />
              ) : (
                <JornadaPage
                  perfil={perfil!}
                  gestorNome={gestorNome}
                  onRefazer={() => setEstado('nivelar')}
                />
              )
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
