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
import { GestorPage } from '../pages/GestorPage'
import { GuiasPage } from '../pages/GuiasPage'
import { JornadaPage } from '../pages/JornadaPage'
import { NivelamentoPage } from '../pages/NivelamentoPage'
import { PassoDetalhePage } from '../pages/PassoDetalhePage'
import { PerfilPage } from '../pages/PerfilPage'
import { SupervisionadoPage } from '../pages/SupervisionadoPage'

type EstadoSessao = 'carregando' | 'erro' | 'pronto'

// Decide, depois do login, entre a tela de nivelamento (sem menu) e a casca (com menu). A CASCA
// (menu + rotas) monta assim que sabemos o papel — `isGestor` já vem do próprio login, persistido
// em `authStore`, não depende dessa chamada. Só a rota "/" (Jornada Home, que precisa do perfil pra
// montar a trilha) mostra carregando/erro CONTIDOS nela, com retry; o resto do menu (Guias, Perfil,
// Admin, Supervisionados) fica navegável mesmo se essa chamada falhar ou travar. Antes, uma API
// fora do ar no F5 bloqueava o app inteiro atrás de uma tela cheia sem navegação nenhuma — pro
// gestor isso nem fazia sentido, já que nenhuma tela dele depende desse fetch.
export function SessaoAutenticada({ usuario }: { usuario: UsuarioLogado }) {
  const [estadoSessao, setEstadoSessao] = useState<EstadoSessao>('carregando')
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [gestorNome, setGestorNome] = useState<string | null>(null)
  // Nivelamento (1ª vez, ou "Refazer") é um fluxo próprio, sem menu — só é decidido depois que a
  // sessão carrega de verdade (nunca durante 'carregando'/'erro', que não sabem essa resposta).
  const [nivelamentoAtivo, setNivelamentoAtivo] = useState(false)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let cancelado = false
    setEstadoSessao('carregando')
    getUser(usuario.id)
      .then((detalhe) => {
        if (cancelado) return
        setGestorNome(detalhe.gestorNome)
        setPerfil(detalhe.perfil)
        setNivelamentoAtivo(!detalhe.isGestor && !detalhe.nivelamentoConcluido)
        setEstadoSessao('pronto')
      })
      .catch(() => {
        if (!cancelado) setEstadoSessao('erro')
      })
    return () => {
      cancelado = true
    }
  }, [usuario.id, tentativa])

  if (nivelamentoAtivo) {
    return (
      <NivelamentoPage
        usuario={usuario}
        onConcluir={(p) => {
          setPerfil(p)
          setNivelamentoAtivo(false)
        }}
      />
    )
  }

  const conteudoJornada = usuario.isGestor ? (
    <Navigate to="/gestor" replace />
  ) : estadoSessao === 'erro' ? (
    <EstadoErro
      mensagem="Não consegui carregar sua jornada. Verifique a conexão e tente de novo."
      onRetry={() => setTentativa((t) => t + 1)}
    />
  ) : !perfil ? (
    <Carregando texto="Carregando sua jornada..." />
  ) : (
    <JornadaPage
      perfil={perfil}
      gestorNome={gestorNome}
      onRefazer={() => setNivelamentoAtivo(true)}
    />
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={conteudoJornada} />
          <Route path="/fase/:nome" element={conteudoJornada} />
          <Route path="/passo/:titulo" element={<PassoDetalhePage perfil={perfil} />} />
          <Route path="/guias" element={<GuiasPage />} />
          <Route path="/guias/:modulo" element={<GuiasPage />} />
          <Route path="/fluxo/:titulo" element={<FluxoDetalhePage perfil={perfil} />} />
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
          <Route path="*" element={conteudoJornada} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
