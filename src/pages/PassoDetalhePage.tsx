import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EstadoErro } from '../components/EstadoErro'
import { Markdown } from '../components/Markdown'
import { MarkdownEditor } from '../components/MarkdownEditor'
import { useAuthStore } from '../features/auth/authStore'
import { editarPasso, listarPassosAdmin } from '../features/admin/adminService'
import type { PassoAdmin, PassoAdminInput } from '../features/admin/types'
import { getStep } from '../features/onboarding/onboardingService'
import {
  concluirPasso,
  desmarcarPasso,
  getComprovacao,
} from '../features/onboarding/progressService'
import type { OnboardingStep } from '../features/onboarding/types'

const inputCls =
  'rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-purple-400'

// Mostra a evidência: se for um link (http), vira âncora clicável; senão, texto puro.
function Comprovacao({ texto }: { texto: string }) {
  if (/^https?:\/\//i.test(texto.trim())) {
    return (
      <a
        href={texto}
        target="_blank"
        rel="noreferrer"
        className="break-all text-purple-300 underline hover:text-purple-200"
      >
        {texto}
      </a>
    )
  }
  return <span className="whitespace-pre-wrap break-words text-neutral-300">{texto}</span>
}

// Página de um passo (rota /passo/:id): conteúdo em Markdown + concluir com comprovação opcional.
export function PassoDetalhePage() {
  const { id = '' } = useParams()
  const usuario = useAuthStore((state) => state.usuario)
  const isGestor = usuario?.isGestor ?? false

  const [step, setStep] = useState<OnboardingStep | null>(null)
  const [concluido, setConcluido] = useState(false)
  const [evidencia, setEvidencia] = useState('')
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)

  // Edição inline do CONTEÚDO do passo (só gestor) — não confundir com `editando` acima, que é a
  // comprovação do próprio colaborador.
  const [editandoConteudo, setEditandoConteudo] = useState(false)
  const [carregandoEdicao, setCarregandoEdicao] = useState(false)
  const [baseAdmin, setBaseAdmin] = useState<PassoAdmin | null>(null)
  const [camposConteudo, setCamposConteudo] = useState<Pick<PassoAdmin, 'title' | 'description' | 'conteudo'> | null>(null)
  const [salvandoConteudo, setSalvandoConteudo] = useState(false)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)

  useEffect(() => {
    if (!usuario) return
    let cancelado = false
    setLoading(true)
    setError(null)
    Promise.all([getStep(id), getComprovacao(usuario.id, id)])
      .then(([passo, comp]) => {
        if (cancelado) return
        setStep(passo)
        setConcluido(comp.concluido)
        setEvidencia(comp.evidencia)
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'Erro ao carregar o passo')
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [id, usuario, tentativa])

  async function concluir() {
    if (!usuario) return
    setSalvando(true)
    try {
      await concluirPasso(usuario.id, id, evidencia)
      setConcluido(true)
      setEditando(false)
    } catch {
      // mantém o estado atual — o banner de offline sinaliza a queda
    } finally {
      setSalvando(false)
    }
  }

  async function desmarcar() {
    if (!usuario) return
    setSalvando(true)
    try {
      await desmarcarPasso(usuario.id, id)
      setConcluido(false)
      setEditando(false)
    } catch {
      // idem
    } finally {
      setSalvando(false)
    }
  }

  // Busca a forma completa (faseId/order/isCompanySpecific/skillArea) só ao entrar em edição — o
  // back exige o objeto inteiro no PUT, e a leitura pública não carrega esses campos estruturais.
  async function abrirEdicaoConteudo() {
    setErroEdicao(null)
    setCarregandoEdicao(true)
    try {
      const todos = await listarPassosAdmin()
      const atual = todos.find((p) => p.id === id)
      if (!atual) throw new Error('Passo não encontrado no admin.')
      setBaseAdmin(atual)
      setCamposConteudo({
        title: atual.title,
        description: atual.description,
        conteudo: atual.conteudo,
      })
      setEditandoConteudo(true)
    } catch (e) {
      setErroEdicao(e instanceof Error ? e.message : 'Erro ao carregar para edição')
    } finally {
      setCarregandoEdicao(false)
    }
  }

  async function salvarConteudo() {
    if (!baseAdmin || !camposConteudo || !camposConteudo.title.trim()) return
    setSalvandoConteudo(true)
    setErroEdicao(null)
    try {
      const req: PassoAdminInput = {
        order: baseAdmin.order,
        faseId: baseAdmin.faseId,
        isCompanySpecific: baseAdmin.isCompanySpecific,
        skillArea: baseAdmin.skillArea,
        ...camposConteudo,
        title: camposConteudo.title.trim(),
      }
      await editarPasso(id, req)
      setEditandoConteudo(false)
      setTentativa((t) => t + 1)
    } catch (e) {
      setErroEdicao(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvandoConteudo(false)
    }
  }

  if (loading) return <p className="text-neutral-400">Carregando o passo...</p>
  if (error) return <EstadoErro onRetry={() => setTentativa((t) => t + 1)} />
  if (!step) return null

  return (
    <article className="flex w-full max-w-2xl flex-col gap-5">
      <Link to="/" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← Voltar pra jornada
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-neutral-500">
            Passo {step.order} · {step.phase}
          </span>
          <h1 className="text-2xl font-bold text-neutral-100">{step.title}</h1>
          {step.description && <p className="text-sm text-neutral-400">{step.description}</p>}
        </div>
        {isGestor && !editandoConteudo && (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <button
              type="button"
              onClick={abrirEdicaoConteudo}
              disabled={carregandoEdicao}
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-purple-300 hover:border-purple-400 hover:text-purple-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {carregandoEdicao ? 'Carregando...' : '✏️ Editar'}
            </button>
            {erroEdicao && <p className="text-xs text-red-400">{erroEdicao}</p>}
          </div>
        )}
      </header>

      {editandoConteudo && camposConteudo ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-purple-500/30 bg-neutral-900 p-6">
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Título
            <input
              value={camposConteudo.title}
              onChange={(e) => setCamposConteudo({ ...camposConteudo, title: e.target.value })}
              className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Descrição
            <textarea
              value={camposConteudo.description}
              onChange={(e) => setCamposConteudo({ ...camposConteudo, description: e.target.value })}
              rows={2}
              className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Conteúdo
            <MarkdownEditor
              value={camposConteudo.conteudo}
              onChange={(v) => setCamposConteudo({ ...camposConteudo, conteudo: v })}
            />
          </label>

          {erroEdicao && <p className="text-sm text-red-400">{erroEdicao}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditandoConteudo(false)}
              className="rounded-lg px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvarConteudo}
              disabled={!camposConteudo.title.trim() || salvandoConteudo}
              className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {salvandoConteudo ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 leading-relaxed">
          <Markdown>{step.conteudo}</Markdown>
        </div>
      )}

      {concluido ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-green-500/30 bg-neutral-900 p-5">
          <span className="self-start rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">
            ✓ Concluído
          </span>

          {editando ? (
            <>
              <textarea
                value={evidencia}
                onChange={(e) => setEvidencia(e.target.value)}
                rows={2}
                placeholder="Cole o link do PR, um print, ou uma nota (opcional)"
                className={inputCls}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={concluir}
                  disabled={salvando}
                  className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400 disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar comprovação'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  className="rounded-lg px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500">Comprovação</span>
                {evidencia ? (
                  <Comprovacao texto={evidencia} />
                ) : (
                  <span className="text-sm text-neutral-500">Sem comprovação anexada.</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
                >
                  {evidencia ? 'Editar comprovação' : 'Adicionar comprovação'}
                </button>
                <button
                  type="button"
                  onClick={desmarcar}
                  disabled={salvando}
                  className="rounded-lg px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800 disabled:opacity-50"
                >
                  Desmarcar
                </button>
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <span className="text-sm font-medium text-neutral-200">Comprovação (opcional)</span>
          <p className="text-xs text-neutral-500">
            Cole o link do PR, um print, ou uma nota do que você fez.
          </p>
          <textarea
            value={evidencia}
            onChange={(e) => setEvidencia(e.target.value)}
            rows={2}
            placeholder="https://bitbucket.org/... ou uma nota"
            className={inputCls}
          />
          <button
            type="button"
            onClick={concluir}
            disabled={salvando}
            className="self-start rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Marcar como concluído'}
          </button>
        </section>
      )}
    </article>
  )
}
