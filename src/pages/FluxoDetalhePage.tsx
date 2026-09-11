import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { CompassRose } from '../components/CompassRose'
import { EstadoErro } from '../components/EstadoErro'
import { Icon } from '../components/Icon'
import { MapCorners } from '../components/MapCorners'
import { MapIllustration } from '../components/MapIllustration'
import { Markdown } from '../components/Markdown'
import { MarkdownEditor } from '../components/MarkdownEditor'
import { Carregando, Spinner } from '../components/Spinner'
import { cx } from '../utils/cx'
import { useRefetchOnFocus } from '../hooks/useAtualizarEmSegundoPlano'
import { useSaida, useSaidaValor } from '../hooks/useSaida'
import { useAuthStore } from '../features/auth/authStore'
import { useTitulo } from '../hooks/useTitulo'
import { editarFluxo, listarFluxosAdmin } from '../features/admin/adminService'
import type { FluxoAdmin, FluxoAdminInput } from '../features/admin/types'
import {
  concluirFluxo,
  desmarcarFluxo,
  getFluxosConcluidos,
  listarFluxos,
} from '../features/fluxos/fluxosService'
import type { Fluxo } from '../features/fluxos/types'
import type { Perfil } from '../features/nivelamento/types'
import { NavegacaoTrilha } from '../features/onboarding/NavegacaoTrilha'
import { hrefDoTrailItem, useTrailNavegacao } from '../features/onboarding/useTrailNavegacao'
import { paraEmbed } from '../utils/video'

// Página de um fluxo (rota /fluxo/:titulo): o conteúdo em Markdown, consulta pura.
export function FluxoDetalhePage({ perfil }: { perfil: Perfil | null }) {
  const { titulo: tituloParam = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isGestor = useAuthStore((s) => s.usuario?.isGestor ?? false)
  const { carregandoTrilha, anterior, proximo, faseDoItem, faseTerminada } = useTrailNavegacao(
    perfil,
    tituloParam,
  )
  // O mesmo Fluxo pode ser aberto por dois caminhos (Guia geral OU trilha da Jornada) — só sabemos
  // qual foi de verdade pelo estado que o link de origem deixou na navegação (`deFase`), não só
  // por ele fazer parte da trilha (um fluxo da fase "Conheça o sistema" também aparece no Guia).
  const veioDaFase = Boolean((location.state as { deFase?: boolean } | null)?.deFase) && faseDoItem
  const [fluxo, setFluxo] = useState<Fluxo | null>(null)
  // Lista completa (todos os módulos) só pra calcular anterior/próximo DENTRO DO MÓDULO do Guia —
  // navegação independente da trilha da Jornada, usada quando `veioDaFase` é false (mesma ordem
  // que a GuiasPage mostra, já que vem do mesmo `listarFluxos()`).
  const [todosFluxos, setTodosFluxos] = useState<Fluxo[]>([])
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
  const { montado: toastSalvoMontado, saindo: toastSalvoSaindo } = useSaida(salvo)
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)
  const toastFeedback = useSaidaValor(feedback)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    setError(null)
    Promise.all([listarFluxos(), getFluxosConcluidos()])
      .then(([todos, concluidos]) => {
        if (cancelado) return
        const f = todos.find((x) => x.titulo === tituloParam)
        // Título sem correspondência (link velho de antes da rota virar por nome, ou digitado
        // errado) — volta pra Jornada em vez de travar numa tela de erro que nunca vai "resolver".
        if (!f) {
          navigate('/', { replace: true })
          return
        }
        setFluxo(f)
        setConcluido(concluidos.includes(f.id))
        setTodosFluxos(todos)
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
  }, [tituloParam, tentativa, navigate])

  // Um gestor pode editar o conteúdo desse Fluxo pela tela de Admin enquanto o colaborador está
  // vendo — busca de novo o CONTEÚDO (nunca `concluido`, que pode estar sendo alternado agora
  // mesmo) quando a aba volta a ficar em foco.
  useRefetchOnFocus(() => {
    listarFluxos()
      .then((todos) => {
        const f = todos.find((x) => x.titulo === tituloParam)
        if (f) setFluxo(f)
        setTodosFluxos(todos)
      })
      .catch(() => {})
  })

  useTitulo(fluxo?.titulo)

  // Alterna concluído de forma otimista (desfaz se o back falhar) — sucesso já é visível na hora
  // pela própria mudança do chip, então só a falha precisa de um aviso explícito (senão o usuário
  // via só o chip voltando sozinho, sem saber por quê).
  async function toggle() {
    if (!fluxo) return
    const antes = concluido
    setConcluido(!antes)
    try {
      if (antes) await desmarcarFluxo(fluxo.id)
      else await concluirFluxo(fluxo.id)
    } catch {
      setConcluido(antes)
      setFeedback({ texto: 'Não deu para salvar. Tente de novo.', ok: false })
    }
  }

  // Busca a forma completa (moduloId/order/squad) só ao entrar em edição — o back exige o objeto
  // inteiro no PUT, e a leitura pública não carrega esses campos estruturais.
  async function abrirEdicao() {
    if (!fluxo) return
    setErroEdicao(null)
    setCarregandoEdicao(true)
    try {
      const todos = await listarFluxosAdmin()
      const atual = todos.find((f) => f.id === fluxo.id)
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
    if (!fluxo || !base || !campos || !campos.titulo.trim()) return
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
      await editarFluxo(fluxo.id, req)
      setEditando(false)
      // A URL é pelo título — se o título mudou na edição, a rota precisa acompanhar (senão o
      // refetch abaixo procura pelo título velho e não acha mais o fluxo).
      if (req.titulo !== tituloParam) {
        navigate(`/fluxo/${encodeURIComponent(req.titulo)}`, { replace: true })
      }
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

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(t)
  }, [feedback])

  if (loading || carregandoTrilha) return <Carregando texto="Carregando o fluxo..." />
  if (error) return <EstadoErro onRetry={() => setTentativa((t) => t + 1)} />
  if (!fluxo) return null

  // Anterior/próximo dentro do módulo do Guia (mesma ordem da GuiasPage) — só usado quando NÃO
  // veio da fase. Ao chegar no último item do módulo, não tem "fase concluída" nenhuma (não existe
  // fase aqui), só some a seta de "próximo" e sobra a de "anterior".
  const doMesmoModulo = todosFluxos.filter((f) => f.modulo === fluxo.modulo)
  const indiceModulo = doMesmoModulo.findIndex((f) => f.titulo === fluxo.titulo)
  const anteriorGuia = indiceModulo > 0 ? doMesmoModulo[indiceModulo - 1] : undefined
  const proximoGuia =
    indiceModulo >= 0 && indiceModulo < doMesmoModulo.length - 1
      ? doMesmoModulo[indiceModulo + 1]
      : undefined
  const hrefDoFluxo = (f: Fluxo) => `/fluxo/${encodeURIComponent(f.titulo)}`

  return (
    <article className="anim-fade relative flex w-full max-w-2xl flex-col gap-5">
      <CompassRose className="pointer-events-none absolute -right-10 -top-4 size-64 text-gold-500 opacity-[0.15]" />
      <MapIllustration className="pointer-events-none absolute -bottom-10 -left-8 w-56 text-gold-500 opacity-[0.06]" />
      {/* Destino FIXO nos dois casos (nunca histórico) — quem entrou pela Jornada (`veioDaFase`,
          marcado pelo link de origem) sempre volta pra visão geral da fase, igual o Passo; quem
          entrou pelo Guia geral sempre volta pra visão geral DO MÓDULO em que estava. Usar
          `navigate(-1)` pro caso do Guia quebrava de novo: as próprias setinhas anterior/próximo
          do Guia empilham histórico, então "Voltar" caía no fluxo anterior visitado, não no
          módulo (mesma classe de bug já corrigida uma vez pro lado da Jornada). */}
      <button
        type="button"
        onClick={() =>
          veioDaFase
            ? navigate(`/fase/${encodeURIComponent(faseDoItem)}`)
            : navigate(`/guias/${encodeURIComponent(fluxo.modulo)}`)
        }
        className="relative flex items-center gap-1 self-start text-sm text-neutral-400 transition-colors hover:text-neutral-200"
      >
        <Icon name="arrow_back" className="text-base" /> Voltar
      </button>

      <header className="relative flex items-start justify-between gap-3">
        <div className="relative flex flex-col gap-1 self-start p-5">
          <MapCorners tamanho={5} opacidade={25} />
          <span className="text-sm text-neutral-500">{fluxo.categoria}</span>
          <h1 className="text-2xl font-bold text-neutral-100">{fluxo.titulo}</h1>
          {fluxo.descricao && <p className="text-sm text-neutral-400">{fluxo.descricao}</p>}
        </div>
        {isGestor && !editando && (
          <div className="anim-fade flex shrink-0 flex-col items-end gap-1">
            <button
              type="button"
              onClick={abrirEdicao}
              disabled={carregandoEdicao}
              className="flex items-center gap-1 rounded-lg border border-navy-600 px-3 py-1.5 text-sm text-gold-400 transition-all hover:border-gold-400 hover:text-gold-300 disabled:cursor-not-allowed disabled:opacity-40"
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
        <div className="anim-fade flex flex-col gap-4 rounded-2xl border border-gold-500/30 bg-navy-800 p-6">
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Categoria
            <input
              value={campos.categoria}
              onChange={(e) => setCampos({ ...campos, categoria: e.target.value })}
              className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Título
            <input
              value={campos.titulo}
              onChange={(e) => setCampos({ ...campos, titulo: e.target.value })}
              className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Descrição
            <textarea
              value={campos.descricao}
              onChange={(e) => setCampos({ ...campos, descricao: e.target.value })}
              rows={2}
              className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            URL do vídeo
            <input
              value={campos.videoUrl}
              onChange={(e) => setCampos({ ...campos, videoUrl: e.target.value })}
              className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
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
              className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvar}
              disabled={!campos.titulo.trim() || salvando}
              className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
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
        <div className="anim-fade flex flex-col gap-5">
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

            {/* Concluir/desmarcar mora no MESMO container da descrição — não é mais uma caixa à
                parte só pra isso. */}
            <div className="border-t border-navy-700 pt-4">
              {concluido ? (
                <div className="anim-fade flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={toggle}
                    className="rounded-lg px-3 py-1.5 text-sm text-red-400 transition-all hover:bg-red-500/10"
                  >
                    Desmarcar
                  </button>
                  <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">
                    <Icon name="check" className="text-sm" /> Concluído
                  </span>
                </div>
              ) : (
                <div className="anim-fade flex items-center justify-between gap-3">
                  <span className="text-sm text-neutral-400">Terminou esse fluxo?</span>
                  <button
                    type="button"
                    onClick={toggle}
                    className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gold-400"
                  >
                    Marcar como concluído
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mesmo Fluxo pode aparecer no Guia geral SEM ter vindo de lá pela Jornada — a navegação
          anterior/próximo é uma ou outra dependendo de onde veio (`veioDaFase`), nunca as duas
          juntas: pela Jornada, segue a trilha da fase (com "fase concluída" no fim); pelo Guia,
          segue a ordem do módulo (sem noção de fase nenhuma — bug real reportado pelo Miguel: a
          1ª versão desse fix mostrava "fase concluída" mesmo navegando só pelo Guia). Só na
          Jornada o "próximo"/"fase concluída" exige `concluido` primeiro pra ficar clicável (mas
          continua aparecendo sem cor + tooltip, ver `proximoLiberado`); no Guia, sempre liberado —
          não é um fluxo obrigatório/sequencial. */}
      <NavegacaoTrilha
        anterior={
          veioDaFase
            ? anterior && { title: anterior.title, href: hrefDoTrailItem(anterior) }
            : anteriorGuia && { title: anteriorGuia.titulo, href: hrefDoFluxo(anteriorGuia) }
        }
        proximo={
          veioDaFase
            ? proximo && { title: proximo.title, href: hrefDoTrailItem(proximo) }
            : proximoGuia && { title: proximoGuia.titulo, href: hrefDoFluxo(proximoGuia) }
        }
        faseTerminada={veioDaFase ? faseTerminada : undefined}
        fase={veioDaFase ? faseDoItem : undefined}
        origemFase={Boolean(veioDaFase)}
        proximoLiberado={veioDaFase ? concluido : true}
      />

      {toastSalvoMontado && (
        <div
          className={cx(
            'fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-xl border border-green-500/40 bg-navy-800 px-4 py-3 text-sm text-green-300 shadow-lg',
            toastSalvoSaindo ? 'anim-pop-out' : 'anim-pop',
          )}
        >
          <Icon name="check_circle" className="text-base" /> Salvo com sucesso
        </div>
      )}

      {toastFeedback.montado && toastFeedback.valor && (
        <div
          className={cx(
            'fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-xl border bg-navy-800 px-4 py-3 text-sm shadow-lg',
            toastFeedback.saindo ? 'anim-pop-out' : 'anim-pop',
            toastFeedback.valor.ok ? 'border-green-500/40 text-green-300' : 'border-red-500/40 text-red-300',
          )}
        >
          <Icon name={toastFeedback.valor.ok ? 'check_circle' : 'warning'} className="text-base" />
          {toastFeedback.valor.texto}
        </div>
      )}
    </article>
  )
}
