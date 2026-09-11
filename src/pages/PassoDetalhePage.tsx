import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CompassRose } from '../components/CompassRose'
import { EstadoErro } from '../components/EstadoErro'
import { Icon } from '../components/Icon'
import { MapCorners } from '../components/MapCorners'
import { MapIllustration } from '../components/MapIllustration'
import { Markdown } from '../components/Markdown'
import { MarkdownEditor } from '../components/MarkdownEditor'
import { Carregando, Spinner } from '../components/Spinner'
import { usePolling, useRefetchOnFocus } from '../hooks/useAtualizarEmSegundoPlano'
import { useSaida, useSaidaValor } from '../hooks/useSaida'
import { cx } from '../utils/cx'
import { paraEmbed } from '../utils/video'
import { useAuthStore } from '../features/auth/authStore'
import { useTitulo } from '../hooks/useTitulo'
import { editarPasso, listarPassosAdmin } from '../features/admin/adminService'
import type { PassoAdmin, PassoAdminInput } from '../features/admin/types'
import { NavegacaoTrilha } from '../features/onboarding/NavegacaoTrilha'
import { listarSteps } from '../features/onboarding/onboardingService'
import {
  concluirPasso,
  desmarcarPasso,
  getComprovacao,
  marcarCorrigido,
} from '../features/onboarding/progressService'
import type { OnboardingStep } from '../features/onboarding/types'
import { hrefDoTrailItem, useTrailNavegacao } from '../features/onboarding/useTrailNavegacao'
import type { Perfil } from '../features/nivelamento/types'

const inputCls =
  'rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors focus:border-gold-500'

// Rascunho da comprovação no localStorage — sobrevive a navegar pra outro passo/fase e voltar (ou
// até fechar e abrir o navegador de novo), pra não perder o que a pessoa já tinha colado só por
// sair da tela ou cancelar o envio. Só é lido/escrito enquanto o passo ainda não foi concluído de
// verdade (ver efeitos abaixo); some sozinho assim que o envio é confirmado com sucesso.
function chaveRascunho(usuarioId: string, stepId: string) {
  return `bussola:rascunho-comprovacao:${usuarioId}:${stepId}`
}

function lerRascunho(usuarioId: string, stepId: string): string | null {
  try {
    return localStorage.getItem(chaveRascunho(usuarioId, stepId))
  } catch {
    return null
  }
}

function salvarRascunho(usuarioId: string, stepId: string, texto: string) {
  try {
    if (texto) localStorage.setItem(chaveRascunho(usuarioId, stepId), texto)
    else localStorage.removeItem(chaveRascunho(usuarioId, stepId))
  } catch {
    // sem storage disponível (ex.: aba privada) — só não persiste, sem quebrar a tela
  }
}

// Mostra a evidência: se for um link (http), vira âncora clicável; senão, texto puro.
function Comprovacao({ texto }: { texto: string }) {
  if (/^https?:\/\//i.test(texto.trim())) {
    return (
      <a
        href={texto}
        target="_blank"
        rel="noreferrer"
        className="break-all text-gold-400 underline transition-colors hover:text-gold-300"
      >
        {texto}
      </a>
    )
  }
  return <span className="whitespace-pre-wrap break-words text-neutral-300">{texto}</span>
}

// Página de um passo (rota /passo/:titulo): conteúdo em Markdown + concluir com comprovação opcional.
export function PassoDetalhePage({
  perfil,
  gestorNome,
}: {
  perfil: Perfil | null
  gestorNome?: string | null
}) {
  const { titulo: tituloParam = '' } = useParams()
  const navigate = useNavigate()
  const usuario = useAuthStore((state) => state.usuario)
  const isGestor = usuario?.isGestor ?? false
  const { carregandoTrilha, anterior, proximo, faseDoItem, faseTerminada, ultimoItemDaTrilha } =
    useTrailNavegacao(perfil, tituloParam)

  const [step, setStep] = useState<OnboardingStep | null>(null)
  const [concluido, setConcluido] = useState(false)
  const [evidencia, setEvidencia] = useState('')
  const [precisaCorrecao, setPrecisaCorrecao] = useState(false)
  const [qtdCorrecoes, setQtdCorrecoes] = useState(0)
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false)
  const [marcandoCorrigido, setMarcandoCorrigido] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false)
  // Colapsa o container colorido (grid-rows 1fr→0fr) ANTES de cancelar de fato — sem isso o box
  // simplesmente sumia seco assim que a chamada terminava, sem nenhuma transição visível.
  const [colapsandoCancelamento, setColapsandoCancelamento] = useState(false)
  const { montado: modalCancelarMontado, saindo: modalCancelarSaindo } = useSaida(confirmandoCancelar)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)

  // Edição inline do CONTEÚDO do passo (só gestor).
  const [editandoConteudo, setEditandoConteudo] = useState(false)
  const [carregandoEdicao, setCarregandoEdicao] = useState(false)
  const [baseAdmin, setBaseAdmin] = useState<PassoAdmin | null>(null)
  const [camposConteudo, setCamposConteudo] = useState<Pick<PassoAdmin, 'title' | 'description' | 'conteudo' | 'videoUrl'> | null>(null)
  const [salvandoConteudo, setSalvandoConteudo] = useState(false)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)
  const { montado: toastSalvoMontado, saindo: toastSalvoSaindo } = useSaida(salvo)
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)
  const toastFeedback = useSaidaValor(feedback)

  useEffect(() => {
    if (!usuario) return
    let cancelado = false
    setLoading(true)
    setError(null)
    listarSteps()
      .then((todos) => {
        if (cancelado) return
        const passo = todos.find((s) => s.title === tituloParam)
        // Título sem correspondência (link velho de antes da rota virar por nome, ou digitado
        // errado) — volta pra Jornada em vez de travar numa tela de erro que nunca vai "resolver".
        if (!passo) {
          navigate('/', { replace: true })
          return
        }
        return getComprovacao(usuario.id, passo.id).then((comp) => {
          if (cancelado) return
          setStep(passo)
          setConcluido(comp.concluido)
          // Sem comprovação enviada ainda (nunca mandou, ou acabou de cancelar o envio) — recupera
          // o rascunho salvo, se tiver algum, em vez de começar a caixa de texto vazia de novo.
          const rascunho = !comp.concluido ? lerRascunho(usuario.id, passo.id) : null
          setEvidencia(rascunho ?? comp.evidencia)
          setPrecisaCorrecao(comp.precisaCorrecao)
          setQtdCorrecoes(comp.qtdCorrecoes)
          setAguardandoConfirmacao(comp.aguardandoConfirmacao)
        })
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
  }, [tituloParam, usuario, tentativa, navigate])

  // Salva o rascunho a cada letra digitada, enquanto ainda não enviou de verdade — é o que permite
  // sair da tela (ou cancelar o envio) sem perder o que já tinha colado. Uma vez concluído, o que
  // importa é a comprovação salva no servidor, não o rascunho local.
  useEffect(() => {
    if (!usuario || !step || concluido) return
    salvarRascunho(usuario.id, step.id, evidencia)
  }, [usuario, step, concluido, evidencia])

  // Um gestor pode editar o conteúdo desse Passo pela tela de Admin enquanto o colaborador está
  // lendo — busca de novo o CONTEÚDO (não a comprovação: nunca mexe em `concluido`/`evidencia`,
  // que podem estar sendo digitados agora mesmo) quando a aba volta a ficar em foco.
  useRefetchOnFocus(() => {
    if (!usuario) return
    listarSteps()
      .then((todos) => {
        const passo = todos.find((s) => s.title === tituloParam)
        if (passo) setStep(passo)
      })
      .catch(() => {})
  })

  // O gestor pode pedir/aprovar correção (na tela do Supervisionado) enquanto o colaborador já
  // está com esse passo aberto, literalmente esperando ver a resposta — poll a cada 15s, mesmo
  // intervalo do lado do gestor (SupervisionadoPage.tsx), em vez de só ao voltar o foco (não mexe
  // em concluido/evidencia, que podem estar sendo digitados agora mesmo).
  usePolling(() => {
    if (!usuario || !step) return
    getComprovacao(usuario.id, step.id)
      .then((comp) => {
        setPrecisaCorrecao(comp.precisaCorrecao)
        setQtdCorrecoes(comp.qtdCorrecoes)
        setAguardandoConfirmacao(comp.aguardandoConfirmacao)
      })
      .catch(() => {})
  }, 15_000)

  useTitulo(step?.title)

  async function concluir() {
    if (!usuario || !step) return
    setSalvando(true)
    try {
      await concluirPasso(usuario.id, step.id, evidencia)
      // Otimista: sem isso, o container azul "PR em análise" só aparecia no próximo poll (até
      // 15s depois) — o back já nasce o registro com AguardandoConfirmacao=true nesse caso, então
      // dá pra refletir na hora em vez de esperar o round-trip do polling.
      if (!concluido && ultimoItemDaTrilha) {
        setAguardandoConfirmacao(true)
        setFeedback({ texto: 'Comprovação enviada!', ok: true })
      }
      setConcluido(true)
      salvarRascunho(usuario.id, step.id, '')
    } catch {
      // sucesso já é visível na hora pelo próprio chip mudando — só a falha precisa de aviso
      // explícito, senão o usuário via só nada acontecer, sem saber por quê
      setFeedback({ texto: 'Não deu para salvar. Tente de novo.', ok: false })
    } finally {
      setSalvando(false)
    }
  }

  // Marca que já corrigiu (fez push na mesma branch/PR) — avisa o gestor que pode conferir de novo.
  async function corrigir() {
    if (!usuario || !step) return
    setMarcandoCorrigido(true)
    try {
      await marcarCorrigido(usuario.id, step.id)
      setPrecisaCorrecao(false)
      setQtdCorrecoes((q) => q + 1)
      setAguardandoConfirmacao(true)
    } catch {
      setFeedback({ texto: 'Não deu para avisar seu gestor. Tente de novo.', ok: false })
    } finally {
      setMarcandoCorrigido(false)
    }
  }

  async function desmarcar() {
    if (!usuario || !step) return
    setSalvando(true)
    // Otimista — troca pra "Comprovação (opcional)" (ou pro estado sem comprovação, nos passos
    // normais) NA HORA, sem esperar a resposta do servidor. Antes disso esperava o `await` pra só
    // então virar a tela, e o tempo de rede criava uma pausa "morta" entre o container encolher e
    // a próxima tela aparecer — duas trocas visuais separadas em vez de uma só direta. O
    // `anim-fade` que a tela de comprovação já tem cuida do efeito dessa troca.
    setConcluido(false)
    setColapsandoCancelamento(false)
    try {
      await desmarcarPasso(usuario.id, step.id)
      setFeedback({ texto: ultimoItemDaTrilha ? 'Envio cancelado.' : 'Desmarcado.', ok: true })
    } catch {
      // Deu errado — desfaz o otimismo, volta pro estado concluído de verdade.
      setConcluido(true)
      setFeedback({ texto: 'Não deu para salvar. Tente de novo.', ok: false })
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
        videoUrl: atual.videoUrl,
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

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(t)
  }, [feedback])

  if (loading || carregandoTrilha) return <Carregando texto="Carregando o passo..." />
  if (error) return <EstadoErro onRetry={() => setTentativa((t) => t + 1)} />
  if (!step) return null

  // Comprovação (link de PR/print/nota) só faz sentido no ÚLTIMO passo da ÚLTIMA fase — é o único
  // que fecha a Jornada de verdade com um artefato real pra linkar (o PR do primeiro card). Os
  // outros passos, mesmo dentro do "Primeiro Card", são leitura ou ação local pontual, sem nada
  // que valha a pena anexar — ali o botão só marca concluído.
  const exigeComprovacao = ultimoItemDaTrilha
  // `concluido` só diz que existe registro (comprovação enviada) — pra esse passo específico isso
  // NÃO é a mesma coisa que "de verdade terminado" enquanto o gestor não aprova (mesmo critério do
  // back, ver Program.cs). Usado pra travar o "Fase concluída · ver fase" até a aprovação de
  // verdade, senão a Jornada dava a entender que a fase já tinha fechado antes da hora.
  const concluidoDeVerdade = concluido && !precisaCorrecao && !aguardandoConfirmacao

  return (
    <article className="anim-fade relative flex w-full max-w-2xl flex-col gap-5">
      <CompassRose className="pointer-events-none absolute -right-10 -top-4 size-64 text-gold-500 opacity-[0.15]" />
      <MapIllustration className="pointer-events-none absolute -bottom-10 -left-8 w-56 text-gold-500 opacity-[0.06]" />
      {/* Sempre volta pra visão geral da fase (nunca pro passo anterior) — mesmo entrando pelas
          setinhas de navegação da trilha, "Voltar" tem destino fixo. */}
      <button
        type="button"
        onClick={() => navigate(`/fase/${encodeURIComponent(step.phase)}`)}
        className="relative flex items-center gap-1 self-start text-sm text-neutral-400 transition-colors hover:text-neutral-200"
      >
        <Icon name="arrow_back" className="text-base" /> Voltar
      </button>

      <header className="relative flex items-start justify-between gap-3">
        <div className="relative flex flex-col gap-1 self-start p-5">
          <MapCorners tamanho={5} opacidade={25} />
          <span className="text-sm text-neutral-500">
            Passo {step.order} · {step.phase}
          </span>
          <h1 className="text-2xl font-bold text-neutral-100">{step.title}</h1>
          {step.description && <p className="text-sm text-neutral-400">{step.description}</p>}
        </div>
        {isGestor && !editandoConteudo && (
          <div className="anim-fade flex shrink-0 flex-col items-end gap-1">
            <button
              type="button"
              onClick={abrirEdicaoConteudo}
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

      {editandoConteudo && camposConteudo ? (
        <div className="anim-fade flex flex-col gap-4 rounded-2xl border border-gold-500/30 bg-navy-800 p-6">
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Título
            <input
              value={camposConteudo.title}
              onChange={(e) => setCamposConteudo({ ...camposConteudo, title: e.target.value })}
              className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            Descrição
            <textarea
              value={camposConteudo.description}
              onChange={(e) => setCamposConteudo({ ...camposConteudo, description: e.target.value })}
              rows={2}
              className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-400">
            URL do vídeo (opcional)
            <input
              value={camposConteudo.videoUrl}
              onChange={(e) => setCamposConteudo({ ...camposConteudo, videoUrl: e.target.value })}
              placeholder="https://..."
              className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
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
              className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvarConteudo}
              disabled={!camposConteudo.title.trim() || salvandoConteudo}
              className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
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
        <div className="anim-fade flex flex-col gap-5">
          {step.videoUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-navy-700">
              <iframe
                src={paraEmbed(step.videoUrl)}
                title={step.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="size-full"
              />
            </div>
          )}
          <div className="flex flex-col gap-3 rounded-2xl border border-navy-700 bg-navy-800 p-6 leading-relaxed">
            {/* Conteúdo rola dentro de si mesmo (altura travada) — passos com várias imagens
                (Ambientação) ficavam gigantes, empurrando concluir/desmarcar lá pro fundo da
                página. A barra de rolagem personalizada (index.css) já cobre o visual. */}
            <div className="max-h-[32rem] overflow-y-auto pr-1">
              <Markdown>{step.conteudo}</Markdown>
            </div>

            {/* Concluir/desmarcar mora no MESMO container da descrição — não é mais uma caixa à
                parte só pra isso. */}
            <div className="border-t border-navy-700 pt-4">
              {concluido ? (
                !exigeComprovacao ? (
                  <div className="anim-fade flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={desmarcar}
                      disabled={salvando}
                      className="rounded-lg px-3 py-1.5 text-sm text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Desmarcar
                    </button>
                    <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">
                      <Icon name="check" className="text-sm" /> Concluído
                    </span>
                  </div>
                ) : (
                  <div className="anim-fade flex flex-col gap-3">
                    {/* Mesmo container nos dois estados — só muda de cor/conteúdo (âmbar
                        "pendente" → verde "corrigido"), em vez de sumir e virar uma pilula solta
                        em outro lugar (perde o contexto de repente). Sempre mostra aqui dentro
                        (sem gating por precisaCorrecao/qtdCorrecoes/aguardandoConfirmacao) — esse
                        passo específico SEMPRE passa por um desses 4 estados assim que a
                        comprovação existe (nasce em "aguardando avaliação"), então gatear por
                        qtdCorrecoes>0 escondia justo o "aprovado de primeira" (nenhum dos 3 campos
                        true ao mesmo tempo). O grid-rows por fora é só pra "Cancelar envio" ter uma
                        saída suave (encolhe antes de sumir) em vez de cortar seco — mesma técnica
                        do Acordeao.tsx. */}
                        <div
                          className={cx(
                            'grid transition-[grid-template-rows] duration-200 ease-out',
                            colapsandoCancelamento ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
                          )}
                        >
                          <div className="overflow-hidden">
                          <div
                            className={cx(
                              'anim-pop flex flex-col gap-2 rounded-lg border p-3 transition-colors',
                              precisaCorrecao
                                ? 'border-amber-500/40 bg-amber-500/10'
                                : aguardandoConfirmacao
                                  ? 'border-sky-500/40 bg-sky-500/10'
                                  : 'border-green-500/40 bg-green-500/10',
                            )}
                          >
                            <span
                              className={cx(
                                'flex items-center gap-1.5 text-sm font-medium',
                                precisaCorrecao
                                  ? 'text-amber-300'
                                  : aguardandoConfirmacao
                                    ? 'text-sky-300'
                                    : 'text-green-300',
                              )}
                            >
                              <Icon
                                name={
                                  precisaCorrecao
                                    ? 'rate_review'
                                    : aguardandoConfirmacao
                                      ? 'hourglass_top'
                                      : 'check_circle'
                                }
                                className="text-base"
                                fill={!precisaCorrecao && !aguardandoConfirmacao}
                              />
                              {precisaCorrecao
                                ? 'Seu gestor pediu uma correção'
                                : aguardandoConfirmacao
                                  ? qtdCorrecoes > 0
                                    ? 'Você marcou como corrigido — aguardando aprovação do gestor'
                                    : 'Comprovação enviada — aguardando avaliação do gestor'
                                  : qtdCorrecoes > 0
                                    ? gestorNome
                                      ? `Correção aprovada pelo seu gestor ${gestorNome}`
                                      : 'Correção aprovada'
                                    : gestorNome
                                      ? `Aprovado pelo seu gestor ${gestorNome}`
                                      : 'Aprovado'}
                            </span>
                            {precisaCorrecao && (
                              <>
                                <p className="text-xs text-neutral-400">
                                  Os comentários estão no próprio PR, no Bitbucket (link na
                                  comprovação abaixo). Depois de ajustar e dar push na mesma branch,
                                  marque abaixo que já corrigiu.
                                </p>
                                <button
                                  type="button"
                                  onClick={corrigir}
                                  disabled={marcandoCorrigido}
                                  className="flex items-center gap-1.5 self-start rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {marcandoCorrigido ? (
                                    <>
                                      <Spinner /> Enviando...
                                    </>
                                  ) : (
                                    'Marcar como corrigido'
                                  )}
                                </button>
                              </>
                            )}
                            {aguardandoConfirmacao && (
                              <p className="text-xs text-neutral-400">
                                Uma notificação já foi enviada para o seu gestor. Ele vai revisar o
                                PR {qtdCorrecoes > 0 ? 'de novo ' : ''}e aprovar se estiver tudo
                                certo — você recebe uma notificação assim que ele aprovar.
                              </p>
                            )}
                          </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-neutral-500">Comprovação</span>
                          {evidencia ? (
                            <Comprovacao texto={evidencia} />
                          ) : (
                            <span className="text-sm text-neutral-500">Sem comprovação anexada.</span>
                          )}
                        </div>

                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setConfirmandoCancelar(true)}
                        disabled={salvando}
                        className="rounded-lg px-3 py-1.5 text-sm text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Cancelar envio
                      </button>
                      {/* Mesmo chip de sempre, mas dinâmico — enquanto o gestor não avalia, isso
                          NÃO conta como concluído de verdade (o back também não conta pro
                          percentual da fase até aprovar), então "Concluído" fixo aqui era enganoso. */}
                      <span
                        className={cx(
                          'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
                          precisaCorrecao
                            ? 'bg-amber-500/20 text-amber-300'
                            : aguardandoConfirmacao
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'bg-green-500/20 text-green-300',
                        )}
                      >
                        <Icon
                          name={precisaCorrecao ? 'rate_review' : aguardandoConfirmacao ? 'hourglass_top' : 'check'}
                          className="text-sm"
                          size={aguardandoConfirmacao ? 15 : undefined}
                        />
                        {precisaCorrecao ? 'Correção pedida' : aguardandoConfirmacao ? 'PR em análise' : 'Concluído'}
                      </span>
                    </div>
                  </div>
                )
              ) : exigeComprovacao ? (
                <div className="anim-fade flex flex-col gap-2">
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
                    className="flex items-center gap-1.5 self-end rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gold-400 disabled:opacity-50"
                  >
                    {salvando ? (
                      <>
                        <Spinner /> Salvando...
                      </>
                    ) : (
                      'Enviar comprovação'
                    )}
                  </button>
                </div>
              ) : (
                <div className="anim-fade flex items-center justify-between gap-3">
                  <span className="text-sm text-neutral-400">Terminou esse passo?</span>
                  <button
                    type="button"
                    onClick={concluir}
                    disabled={salvando}
                    className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gold-400 disabled:opacity-50"
                  >
                    {salvando ? (
                      <>
                        <Spinner /> Salvando...
                      </>
                    ) : (
                      'Marcar como concluído'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* "Próximo" (e o "fase concluída" no fim) continua aparecendo mesmo sem o passo atual
          concluído — só fica sem cor e sem link (`proximoLiberado=false`), com tooltip explicando
          o porquê. "Anterior" fica sempre livre. */}
      <NavegacaoTrilha
        anterior={anterior && { title: anterior.title, href: hrefDoTrailItem(anterior) }}
        proximo={proximo && { title: proximo.title, href: hrefDoTrailItem(proximo) }}
        faseTerminada={faseTerminada}
        fase={faseDoItem}
        origemFase
        proximoLiberado={concluidoDeVerdade}
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

      {modalCancelarMontado && (
        <div
          className={cx(
            'fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4',
            modalCancelarSaindo ? 'anim-fade-out' : 'anim-fade',
          )}
          onClick={() => setConfirmandoCancelar(false)}
        >
          <div
            className={cx(
              'flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6',
              modalCancelarSaindo ? 'anim-pop-out' : 'anim-pop',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-100">Cancelar o envio da comprovação?</h3>
            <p className="text-sm text-neutral-400">
              Some da tela do seu gestor e das notificações dele. Seu texto continua preenchido
              para reenviar depois.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoCancelar(false)}
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmandoCancelar(false)
                  setColapsandoCancelamento(true)
                  // Espera o colapso visual (mesma duração da transição do grid-rows) antes de
                  // chamar a API de verdade — dá tempo do container encolher suavemente antes da
                  // tela trocar pro formulário de "Enviar comprovação" de novo.
                  setTimeout(desmarcar, 200)
                }}
                className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                Cancelar envio
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
