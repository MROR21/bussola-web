import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EstadoErro } from '../components/EstadoErro'
import { Icon } from '../components/Icon'
import { Markdown } from '../components/Markdown'
import { MarkdownEditor } from '../components/MarkdownEditor'
import { Carregando, Spinner } from '../components/Spinner'
import { useAuthStore } from '../features/auth/authStore'
import { useTitulo } from '../hooks/useTitulo'
import { editarPasso, listarPassosAdmin } from '../features/admin/adminService'
import type { PassoAdmin, PassoAdminInput } from '../features/admin/types'
import { listarSteps } from '../features/onboarding/onboardingService'
import {
  concluirPasso,
  desmarcarPasso,
  getComprovacao,
} from '../features/onboarding/progressService'
import type { OnboardingStep } from '../features/onboarding/types'

const inputCls =
  'rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-gold-500'

// Mostra a evidência: se for um link (http), vira âncora clicável; senão, texto puro.
function Comprovacao({ texto }: { texto: string }) {
  if (/^https?:\/\//i.test(texto.trim())) {
    return (
      <a
        href={texto}
        target="_blank"
        rel="noreferrer"
        className="break-all text-gold-400 underline hover:text-gold-300"
      >
        {texto}
      </a>
    )
  }
  return <span className="whitespace-pre-wrap break-words text-neutral-300">{texto}</span>
}

// Página de um passo (rota /passo/:titulo): conteúdo em Markdown + concluir com comprovação opcional.
export function PassoDetalhePage() {
  const { titulo: tituloParam = '' } = useParams()
  const navigate = useNavigate()
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
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    if (!usuario) return
    let cancelado = false
    setLoading(true)
    setError(null)
    listarSteps()
      .then((todos) => {
        const passo = todos.find((s) => s.title === tituloParam)
        if (!passo) throw new Error('Passo não encontrado.')
        return getComprovacao(usuario.id, passo.id).then((comp) => ({ passo, comp }))
      })
      .then(({ passo, comp }) => {
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
  }, [tituloParam, usuario, tentativa])

  useTitulo(step?.title)

  async function concluir() {
    if (!usuario || !step) return
    setSalvando(true)
    try {
      await concluirPasso(usuario.id, step.id, evidencia)
      setConcluido(true)
      setEditando(false)
    } catch {
      // mantém o estado atual — o banner de offline sinaliza a queda
    } finally {
      setSalvando(false)
    }
  }

  async function desmarcar() {
    if (!usuario || !step) return
    setSalvando(true)
    try {
      await desmarcarPasso(usuario.id, step.id)
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
    if (!step) return
    setErroEdicao(null)
    setCarregandoEdicao(true)
    try {
      const todos = await listarPassosAdmin()
      const atual = todos.find((p) => p.id === step.id)
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
    if (!step || !baseAdmin || !camposConteudo || !camposConteudo.title.trim()) return
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
      await editarPasso(step.id, req)
      setEditandoConteudo(false)
      // A URL é pelo título — se o título mudou na edição, a rota precisa acompanhar (senão o
      // refetch abaixo procura pelo título velho e não acha mais o passo).
      if (req.title !== tituloParam) {
        navigate(`/passo/${encodeURIComponent(req.title)}`, { replace: true })
      }
      setTentativa((t) => t + 1)
      setSalvo(true)
    } catch (e) {
      setErroEdicao(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvandoConteudo(false)
    }
  }

  useEffect(() => {
    if (!salvo) return
    const t = setTimeout(() => setSalvo(false), 3000)
    return () => clearTimeout(t)
  }, [salvo])

  if (loading) return <Carregando texto="Carregando o passo..." />
  if (error) return <EstadoErro onRetry={() => setTentativa((t) => t + 1)} />
  if (!step) return null

  return (
    <article className="flex w-full max-w-2xl flex-col gap-5">
      {/* Volta no histórico (não um destino fixo) — quem entrou por uma fase da Jornada retorna
          pra ela, em vez de sempre cair na home (era o bug que o Miguel reportou: link fixo pra
          "/", igual ao que já tinha sido corrigido no Fluxo). */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 self-start text-sm text-neutral-400 hover:text-neutral-200"
      >
        <Icon name="arrow_back" className="text-base" /> Voltar
      </button>

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
              className="flex items-center gap-1 rounded-lg border border-navy-600 px-3 py-1.5 text-sm text-gold-400 hover:border-gold-400 hover:text-gold-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {carregandoEdicao ? (
                <>
                  <Spinner /> Carregando...
                </>
              ) : (
                <>
                  <Icon name="edit" className="text-base" /> Editar
                </>
              )}
            </button>
            {erroEdicao && <p className="text-xs text-red-400">{erroEdicao}</p>}
          </div>
        )}
      </header>

      {editandoConteudo && camposConteudo ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-gold-500/30 bg-navy-800 p-6">
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Título
            <input
              value={camposConteudo.title}
              onChange={(e) => setCamposConteudo({ ...camposConteudo, title: e.target.value })}
              className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none focus:border-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Descrição
            <textarea
              value={camposConteudo.description}
              onChange={(e) => setCamposConteudo({ ...camposConteudo, description: e.target.value })}
              rows={2}
              className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none focus:border-gold-500"
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
              className="rounded-lg px-4 py-2 text-sm text-neutral-300 hover:bg-navy-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvarConteudo}
              disabled={!camposConteudo.title.trim() || salvandoConteudo}
              className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {salvandoConteudo ? (
                <>
                  <Spinner /> Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-navy-700 bg-navy-800 p-6 leading-relaxed">
          <Markdown>{step.conteudo}</Markdown>
        </div>
      )}

      {concluido ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-green-500/30 bg-navy-800 p-5">
          <span className="flex items-center gap-1 self-start rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">
            <Icon name="check" className="text-sm" /> Concluído
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
                  className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-400 disabled:opacity-50"
                >
                  {salvando ? (
                    <>
                      <Spinner /> Salvando...
                    </>
                  ) : (
                    'Salvar comprovação'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  className="rounded-lg px-4 py-2 text-sm text-neutral-300 hover:bg-navy-700"
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
                  className="rounded-lg bg-navy-700 px-4 py-2 text-sm text-neutral-200 hover:bg-navy-600"
                >
                  {evidencia ? 'Editar comprovação' : 'Adicionar comprovação'}
                </button>
                <button
                  type="button"
                  onClick={desmarcar}
                  disabled={salvando}
                  className="rounded-lg px-4 py-2 text-sm text-neutral-400 hover:bg-navy-700 disabled:opacity-50"
                >
                  Desmarcar
                </button>
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-2 rounded-2xl border border-navy-700 bg-navy-800 p-5">
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
            className="flex items-center gap-1.5 self-start rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-400 disabled:opacity-50"
          >
            {salvando ? (
              <>
                <Spinner /> Salvando...
              </>
            ) : (
              'Marcar como concluído'
            )}
          </button>
        </section>
      )}

      {salvo && (
        <div className="anim-pop fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-xl border border-green-500/40 bg-navy-800 px-4 py-3 text-sm text-green-300 shadow-lg">
          <Icon name="check_circle" className="text-base" /> Salvo com sucesso
        </div>
      )}
    </article>
  )
}
