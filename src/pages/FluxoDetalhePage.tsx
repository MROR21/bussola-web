import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EstadoErro } from '../components/EstadoErro'
import { Icon } from '../components/Icon'
import { Markdown } from '../components/Markdown'
import { MarkdownEditor } from '../components/MarkdownEditor'
import { Carregando, Spinner } from '../components/Spinner'
import { cx } from '../utils/cx'
import { useAuthStore } from '../features/auth/authStore'
import { editarFluxo, listarFluxosAdmin } from '../features/admin/adminService'
import type { FluxoAdmin, FluxoAdminInput } from '../features/admin/types'
import {
  concluirFluxo,
  desmarcarFluxo,
  getFluxo,
  getFluxosConcluidos,
} from '../features/fluxos/fluxosService'
import type { Fluxo } from '../features/fluxos/types'

// Converte links comuns de YouTube pro formato /embed; outros (Vimeo, interno) passam direto.
function paraEmbed(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`
    }
    return url
  } catch {
    return url
  }
}

// Página de um fluxo (rota /fluxo/:id): o conteúdo em Markdown, consulta pura.
export function FluxoDetalhePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const isGestor = useAuthStore((s) => s.usuario?.isGestor ?? false)
  const [fluxo, setFluxo] = useState<Fluxo | null>(null)
  const [concluido, setConcluido] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)

  // Edição inline (só gestor) — evita ter que ir até o Admin só pra corrigir/melhorar o conteúdo.
  const [editando, setEditando] = useState(false)
  const [carregandoEdicao, setCarregandoEdicao] = useState(false)
  const [base, setBase] = useState<FluxoAdmin | null>(null)
  const [campos, setCampos] = useState<Pick<FluxoAdmin, 'categoria' | 'titulo' | 'descricao' | 'conteudo' | 'videoUrl'> | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    setError(null)
    Promise.all([getFluxo(id), getFluxosConcluidos()])
      .then(([f, concluidos]) => {
        if (cancelado) return
        setFluxo(f)
        setConcluido(concluidos.includes(id))
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'Erro ao carregar o fluxo')
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [id, tentativa])

  // Alterna concluído de forma otimista (desfaz se o back falhar).
  async function toggle() {
    const antes = concluido
    setConcluido(!antes)
    try {
      if (antes) await desmarcarFluxo(id)
      else await concluirFluxo(id)
    } catch {
      setConcluido(antes)
    }
  }

  // Busca a forma completa (moduloId/order/squad) só ao entrar em edição — o back exige o objeto
  // inteiro no PUT, e a leitura pública não carrega esses campos estruturais.
  async function abrirEdicao() {
    setErroEdicao(null)
    setCarregandoEdicao(true)
    try {
      const todos = await listarFluxosAdmin()
      const atual = todos.find((f) => f.id === id)
      if (!atual) throw new Error('Fluxo não encontrado no admin.')
      setBase(atual)
      setCampos({
        categoria: atual.categoria,
        titulo: atual.titulo,
        descricao: atual.descricao,
        conteudo: atual.conteudo,
        videoUrl: atual.videoUrl,
      })
      setEditando(true)
    } catch (e) {
      setErroEdicao(e instanceof Error ? e.message : 'Erro ao carregar para edição')
    } finally {
      setCarregandoEdicao(false)
    }
  }

  async function salvar() {
    if (!base || !campos || !campos.titulo.trim()) return
    setSalvando(true)
    setErroEdicao(null)
    try {
      const req: FluxoAdminInput = {
        order: base.order,
        moduloId: base.moduloId,
        squad: base.squad,
        ...campos,
        titulo: campos.titulo.trim(),
      }
      await editarFluxo(id, req)
      setEditando(false)
      setTentativa((t) => t + 1)
      setSalvo(true)
    } catch (e) {
      setErroEdicao(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  useEffect(() => {
    if (!salvo) return
    const t = setTimeout(() => setSalvo(false), 3000)
    return () => clearTimeout(t)
  }, [salvo])

  if (loading) return <Carregando texto="Carregando o fluxo..." />
  if (error) return <EstadoErro onRetry={() => setTentativa((t) => t + 1)} />
  if (!fluxo) return null

  return (
    <article className="flex w-full max-w-2xl flex-col gap-5">
      {/* Volta no histórico (não um destino fixo) — quem entrou pela Jornada (fase "Conheça o
          sistema") retorna pra lá; quem entrou pelo Guia retorna pro Guia. */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 self-start text-sm text-neutral-400 hover:text-neutral-200"
      >
        <Icon name="arrow_back" className="text-base" /> Voltar
      </button>

      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-neutral-500">{fluxo.categoria}</span>
          <h1 className="text-2xl font-bold text-neutral-100">{fluxo.titulo}</h1>
          {fluxo.descricao && <p className="text-sm text-neutral-400">{fluxo.descricao}</p>}
        </div>
        {isGestor && !editando && (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <button
              type="button"
              onClick={abrirEdicao}
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

      {editando && campos ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-gold-500/30 bg-navy-800 p-6">
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Categoria
            <input
              value={campos.categoria}
              onChange={(e) => setCampos({ ...campos, categoria: e.target.value })}
              className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none focus:border-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Título
            <input
              value={campos.titulo}
              onChange={(e) => setCampos({ ...campos, titulo: e.target.value })}
              className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none focus:border-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Descrição
            <textarea
              value={campos.descricao}
              onChange={(e) => setCampos({ ...campos, descricao: e.target.value })}
              rows={2}
              className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none focus:border-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            URL do vídeo
            <input
              value={campos.videoUrl}
              onChange={(e) => setCampos({ ...campos, videoUrl: e.target.value })}
              className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none focus:border-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Conteúdo
            <MarkdownEditor
              value={campos.conteudo}
              onChange={(v) => setCampos({ ...campos, conteudo: v })}
            />
          </label>

          {erroEdicao && <p className="text-sm text-red-400">{erroEdicao}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="rounded-lg px-4 py-2 text-sm text-neutral-300 hover:bg-navy-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvar}
              disabled={!campos.titulo.trim() || salvando}
              className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {salvando ? (
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
        <>
          {fluxo.videoUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-navy-700">
              <iframe
                src={paraEmbed(fluxo.videoUrl)}
                title={fluxo.titulo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="size-full"
              />
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-2xl border border-navy-700 bg-navy-800 p-6 leading-relaxed">
            <Markdown>{fluxo.conteudo}</Markdown>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={toggle}
        className={cx(
          'flex items-center gap-1.5 self-start rounded-lg px-4 py-2 text-sm font-medium transition-colors',
          concluido
            ? 'bg-navy-700 text-neutral-300 hover:bg-navy-600'
            : 'bg-gold-500 text-white hover:bg-gold-400',
        )}
      >
        {concluido ? (
          <>
            <Icon name="check" className="text-base" /> Concluído · desmarcar
          </>
        ) : (
          'Marcar como concluído'
        )}
      </button>

      {salvo && (
        <div className="anim-pop fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-xl border border-green-500/40 bg-navy-800 px-4 py-3 text-sm text-green-300 shadow-lg">
          <Icon name="check_circle" className="text-base" /> Salvo com sucesso
        </div>
      )}
    </article>
  )
}
