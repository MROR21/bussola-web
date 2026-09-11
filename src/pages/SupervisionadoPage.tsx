import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Acordeao } from '../components/Acordeao'
import { CompassRose } from '../components/CompassRose'
import { EstadoErro } from '../components/EstadoErro'
import { Icon } from '../components/Icon'
import { MapCorners } from '../components/MapCorners'
import { MapIllustration } from '../components/MapIllustration'
import { Carregando } from '../components/Spinner'
import { usePolling } from '../hooks/useAtualizarEmSegundoPlano'
import { useSaidaValor } from '../hooks/useSaida'
import { useTitulo } from '../hooks/useTitulo'
import { cx } from '../utils/cx'
import { NOME_CARGO } from '../features/gestor/acessosPorCargo'
import {
  confirmarCorrecaoPasso,
  enviarCardLink,
  getAcessosSupervisionado,
  getCardLinkSupervisionado,
  getFluxosSupervisionado,
  getProgressoDetalhado,
  marcarAcessoConcluido,
  pedirCorrecaoPasso,
} from '../features/gestor/gestorService'
import { GuiaModulosLeitura } from '../features/gestor/GuiaModulosLeitura'
import { TrilhaFasesLeitura } from '../features/gestor/TrilhaFasesLeitura'
import type { AcessoProgresso, FluxoProgresso, ProgressoSupervisionado } from '../features/gestor/types'

const inputCls =
  'rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors focus:border-gold-500'

// Tela de detalhe de um supervisionado, com abas: Passos (jornada) e Fluxos.
export function SupervisionadoPage() {
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const cardSecaoRef = useRef<HTMLDivElement>(null)
  const jaDestacouRef = useRef(false)
  const [destacarCard, setDestacarCard] = useState(false)
  const [dados, setDados] = useState<ProgressoSupervisionado | null>(null)
  useTitulo(dados?.nome)
  const [fluxos, setFluxos] = useState<FluxoProgresso[]>([])
  const [acessos, setAcessos] = useState<AcessoProgresso[]>([])
  const [cardLink, setCardLink] = useState<string | null>(null)
  const [editandoCard, setEditandoCard] = useState(false)
  const [novoCardLink, setNovoCardLink] = useState('')
  const [enviandoCard, setEnviandoCard] = useState(false)
  const [pedindoCorrecao, setPedindoCorrecao] = useState(false)
  const [confirmandoCorrecao, setConfirmandoCorrecao] = useState(false)
  const [aba, setAba] = useState<'passos' | 'fluxos'>('passos')
  const [acessosAbertos, setAcessosAbertos] = useState(false)
  const [cardAberto, setCardAberto] = useState(false)
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)
  const toastFeedback = useSaidaValor(feedback)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    setError(null)
    Promise.all([
      getProgressoDetalhado(id),
      getFluxosSupervisionado(id),
      getAcessosSupervisionado(id),
      getCardLinkSupervisionado(id),
    ])
      .then(([d, fs, as_, cl]) => {
        if (cancelado) return
        setDados(d)
        setFluxos(fs)
        setAcessos(as_)
        setCardLink(cl.url)
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'Erro ao carregar o progresso')
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [id, tentativa])

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(t)
  }, [feedback])

  // Notificações de comprovação/correção do Primeiro Card levam pra cá com `?destaque=primeiro-
  // card` (ver Program.cs) — abre o dropdown certo sozinho e pisca a seção, senão o gestor caía na
  // tela e precisava procurar/abrir manualmente onde estava a novidade. Espera `dados` carregar
  // (é quando a seção entra de fato no DOM, com `loading` virando false) e só dispara UMA vez —
  // sem a guarda, o poll de 15s recarregando `dados` reabriria/piscaria de novo sem parar.
  useEffect(() => {
    if (jaDestacouRef.current) return
    if (searchParams.get('destaque') !== 'primeiro-card') return
    if (!dados) return
    jaDestacouRef.current = true
    setCardAberto(true)
    setDestacarCard(true)
    cardSecaoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const t = setTimeout(() => setDestacarCard(false), 2500)
    return () => clearTimeout(t)
  }, [searchParams, dados])

  // O supervisionado marca passo/fluxo concluído (ou anexa evidência) numa sessão separada — sem
  // isso, essa tela (a que o gestor mais fica olhando esperando ver progresso) ficava parada até
  // sair e voltar. Silencioso, igual GestorPage.tsx. `acessos` fica DE FORA de propósito: quem
  // marca acesso é o PRÓPRIO gestor nessa mesma tela (`alternarAcesso`, otimista) — um poll
  // pisando em cima do estado otimista podia fazer o chip "piscar" de volta pra cinza por um
  // instante antes do PUT terminar.
  usePolling(async () => {
    try {
      const [d, fs] = await Promise.all([getProgressoDetalhado(id), getFluxosSupervisionado(id)])
      setDados(d)
      setFluxos(fs)
    } catch {
      // silencioso
    }
  }, 15_000)

  // Marca (ou desmarca) na hora do clique — não tem como saber quando a pessoa "volta" de um link
  // externo aberto numa aba nova, então o clique já é o próprio ato de liberar. Otimista: desfaz se
  // o back falhar.
  async function alternarAcesso(acesso: AcessoProgresso) {
    const novoValor = !acesso.concluido
    setAcessos((prev) => prev.map((a) => (a.id === acesso.id ? { ...a, concluido: novoValor } : a)))
    try {
      await marcarAcessoConcluido(id, acesso.id, novoValor)
    } catch (e) {
      setAcessos((prev) =>
        prev.map((a) => (a.id === acesso.id ? { ...a, concluido: acesso.concluido } : a)),
      )
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao salvar', ok: false })
    }
  }

  // Envia (ou reenvia/sobrescreve) o link do card — é o que trava/libera os passos da fase
  // "Primeiro Card" pro colaborador (ver JornadaView.tsx, ehPrimeiroCard/aguardandoCard).
  async function enviarCard() {
    const url = novoCardLink.trim()
    if (!url) return
    setEnviandoCard(true)
    try {
      await enviarCardLink(id, url)
      setCardLink(url)
      setEditandoCard(false)
      setFeedback({ texto: 'Card enviado!', ok: true })
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao enviar o card', ok: false })
    } finally {
      setEnviandoCard(false)
    }
  }

  // Pede correção no PR já enviado como comprovação (os comentários ficam no Bitbucket — isso só
  // liga o aviso pro colaborador). Atualiza `dados.passos` na hora pra tag mudar sem esperar o poll.
  async function pedirCorrecao(stepId: string) {
    setPedindoCorrecao(true)
    try {
      await pedirCorrecaoPasso(id, stepId)
      setDados((prev) =>
        prev
          ? {
              ...prev,
              passos: prev.passos.map((p) =>
                p.id === stepId ? { ...p, precisaCorrecao: true, aguardandoConfirmacao: false } : p,
              ),
            }
          : prev,
      )
      setFeedback({ texto: 'Correção pedida — o colaborador foi avisado.', ok: true })
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao pedir correção', ok: false })
    } finally {
      setPedindoCorrecao(false)
    }
  }

  // Gestor confere a correção marcada pelo colaborador e confirma que está tudo certo — fecha o
  // ciclo e avisa o colaborador. Atualiza `dados.passos` na hora, mesmo padrão de pedirCorrecao.
  async function confirmarCorrecao(stepId: string) {
    setConfirmandoCorrecao(true)
    try {
      await confirmarCorrecaoPasso(id, stepId)
      setDados((prev) =>
        prev
          ? {
              ...prev,
              passos: prev.passos.map((p) =>
                p.id === stepId ? { ...p, aguardandoConfirmacao: false } : p,
              ),
            }
          : prev,
      )
      setFeedback({ texto: 'Confirmado — o colaborador foi avisado.', ok: true })
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao confirmar', ok: false })
    } finally {
      setConfirmandoCorrecao(false)
    }
  }

  if (loading) return <Carregando texto="Carregando o progresso..." />
  if (error) return <EstadoErro onRetry={() => setTentativa((t) => t + 1)} />
  if (!dados) return null

  // Estrito — o rótulo da aba mostra quantos passos JÁ foram aprovados de verdade, não só
  // enviados/pendentes (coerência com o resto das telas do gestor).
  const passosFeitos = dados.passos.filter((p) => p.concluido && !p.precisaCorrecao && !p.aguardandoConfirmacao).length
  const passosTotal = dados.passos.length
  const fluxosFeitos = fluxos.filter((f) => f.concluido).length
  const acessosFeitos = acessos.filter((a) => a.concluido).length

  // Comprovação (o link do PR) do último passo do Primeiro Card — mesmo passo que exige
  // comprovação na tela do colaborador (PassoDetalhePage.tsx, ultimoItemDaTrilha). `dados.passos`
  // já vem com `evidencia` (GET /gestor/usuarios/{id}/progresso), sem precisar de outro fetch.
  // NÃO depende de `.concluido` — esse campo agora só vira true depois do gestor aprovar (ver
  // Program.cs), mas é justamente ENQUANTO ainda não aprovou que o gestor precisa ver o link e os
  // botões de Aprovar/Pedir correção; exigir `.concluido` aqui escondia a seção inteira até ele
  // já ter aprovado, o que não faz sentido nenhum.
  const passosPrimeiroCard = dados.passos
    .filter((p) => p.phase === 'Primeiro Card')
    .sort((a, b) => a.order - b.order)
  const ultimoPassoPrimeiroCard = passosPrimeiroCard[passosPrimeiroCard.length - 1]
  const comprovacaoPrimeiroCard = ultimoPassoPrimeiroCard?.evidencia || null

  return (
    <div className="relative flex w-full max-w-2xl flex-col gap-5">
      <CompassRose className="pointer-events-none absolute -right-10 -top-4 size-64 text-gold-500 opacity-[0.15]" />
      <MapIllustration className="pointer-events-none absolute -bottom-10 -left-8 w-56 text-gold-500 opacity-[0.06]" />
      <Link to="/gestor" className="flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-neutral-200">
        <Icon name="arrow_back" className="text-base" /> Voltar pros supervisionados
      </Link>

      <div className="relative flex items-center gap-3 self-start p-5">
        <MapCorners tamanho={5} opacidade={25} />
        <h1 className="text-2xl font-bold text-neutral-100">{dados.nome}</h1>
        <span className="rounded-full bg-navy-700 px-2.5 py-1 text-xs font-medium text-neutral-400">
          {NOME_CARGO[dados.cargo]}
        </span>
      </div>

      <Acordeao
        titulo={
          <span className="flex items-center gap-2 normal-case">
            <Icon name="key" className="text-base text-gold-400" /> Acessos a liberar (
            {NOME_CARGO[dados.cargo]})
          </span>
        }
        aberto={acessosAbertos}
        onToggle={() => setAcessosAbertos((a) => !a)}
      >
        {acessos.length === 0 ? (
          <p className="text-xs text-neutral-500">Nenhum acesso cadastrado pra esse cargo ainda.</p>
        ) : (
          <>
            <ul className="flex flex-wrap gap-2">
              {acessos.map((acesso) => {
                // O selo de concluído é um badge SOBREPOSTO (absolute), não conteúdo dentro do
                // pill — senão o pill cresce de tamanho só por ter o ícone dentro do fluxo normal.
                // O tamanho do chip fica só por conta do texto, ligado ou não.
                const classeBase =
                  'flex items-center rounded-full border px-3 py-1 text-xs transition-colors'
                const classeEstado = acesso.concluido
                  ? 'border-green-500/40 bg-green-500/10 text-green-300 hover:border-green-500/60'
                  : 'border-navy-600 bg-navy-900 text-neutral-300 hover:border-gold-500/50'
                return (
                  <li key={acesso.id} className="relative">
                    {acesso.link ? (
                      <a
                        href={acesso.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          if (!acesso.concluido) alternarAcesso(acesso)
                        }}
                        title={acesso.concluido ? 'Já liberado — clique pra abrir o link de novo' : 'Abre o link e marca como liberado'}
                        className={cx(classeBase, classeEstado)}
                      >
                        {acesso.nome}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => alternarAcesso(acesso)}
                        title={acesso.concluido ? 'Marcar como não liberado' : 'Marcar como liberado'}
                        className={cx(classeBase, classeEstado)}
                      >
                        {acesso.nome}
                      </button>
                    )}
                    {acesso.concluido && (
                      <span className="pointer-events-none absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-navy-800">
                        <Icon name="verified" className="text-sm text-green-400" fill />
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 text-xs text-neutral-500">
              {acessosFeitos} de {acessos.length} liberados — clique num acesso pendente pra abrir o
              link e marcar como feito.
            </p>
          </>
        )}
      </Acordeao>

      {/* Link do card do "Primeiro Card" — aparece SEMPRE (dá pra mandar o card antes mesmo da
          pessoa chegar na última fase); sem isso enviado, os passos dessa fase ficam travados pro
          colaborador (ele vê um aviso "aguardando seu gestor" no lugar da trilha normal). */}
      <div ref={cardSecaoRef}>
        <Acordeao
          titulo={
            <span className="flex items-center gap-2 normal-case">
              <Icon name="emoji_events" className="text-base text-gold-400" /> Primeiro card
            </span>
          }
          aberto={cardAberto}
          onToggle={() => setCardAberto((a) => !a)}
          className={cx(destacarCard && 'anim-pulso')}
        >
        <div className="flex flex-col gap-2">
          {cardLink && !editandoCard && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-neutral-500">Card enviado:</span>
              <a
                href={cardLink}
                target="_blank"
                rel="noreferrer"
                className="w-fit break-all text-sm text-gold-400 underline transition-colors hover:text-gold-300"
              >
                {cardLink}
              </a>
            </div>
          )}
          {!cardLink && !editandoCard && (
            <p className="text-xs text-neutral-500">
              Ainda não enviado — os passos dessa fase ficam travados pro colaborador até você mandar.
            </p>
          )}
          {editandoCard ? (
            <div className="anim-fade flex flex-col gap-2">
              <input
                value={novoCardLink}
                onChange={(e) => setNovoCardLink(e.target.value)}
                placeholder="https://..."
                className={inputCls}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={enviarCard}
                  disabled={enviandoCard || !novoCardLink.trim()}
                  className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {enviandoCard ? 'Enviando...' : 'Enviar'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditandoCard(false)}
                  className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNovoCardLink(cardLink ?? '')
                setEditandoCard(true)
              }}
              className="self-start rounded-lg bg-navy-700 px-4 py-2 text-sm text-neutral-200 transition-colors hover:bg-navy-600"
            >
              {cardLink ? 'Editar' : 'Enviar link do card'}
            </button>
          )}

          {/* Comprovação (o PR) que a pessoa anexou ao concluir o último passo — é pra cá que a
              notificação de "concluiu o Primeiro Card" agora manda o gestor (antes ia direto pro
              link externo, sem contexto nenhum da pessoa). Os comentários de review ficam no
              próprio Bitbucket — aqui é só o status de "precisa de correção" ou não. */}
          {comprovacaoPrimeiroCard && (
            <div className="mt-2 flex flex-col gap-2 border-t border-navy-700 pt-3">
              <span className="text-xs text-neutral-500">
                Comprovação enviada por {dados.nome}:
              </span>
              <a
                href={comprovacaoPrimeiroCard}
                target="_blank"
                rel="noreferrer"
                className="w-fit break-all text-sm text-gold-400 underline transition-colors hover:text-gold-300"
              >
                {comprovacaoPrimeiroCard}
              </a>
              {ultimoPassoPrimeiroCard.precisaCorrecao ? (
                <span className="flex w-fit items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300">
                  <Icon name="rate_review" className="text-sm" /> Aguardando correção de {dados.nome}
                </span>
              ) : (
                <div className="flex flex-col items-start gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Sempre mostra (sem gating por qtdCorrecoes/aguardandoConfirmacao) — chegando
                        aqui (evidencia existe e !precisaCorrecao), só existem 3 estados possíveis:
                        aguardando 1ª avaliação, aguardando pós-correção, ou aprovado. Gatear pelos
                        dois campos escondia justo o "aprovado de primeira" (qtdCorrecoes=0 e
                        aguardandoConfirmacao=false ao mesmo tempo). */}
                    <span
                      className={cx(
                        'flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                        ultimoPassoPrimeiroCard.aguardandoConfirmacao
                          ? 'bg-sky-500/20 text-sky-300'
                          : 'bg-green-500/20 text-green-300',
                      )}
                    >
                      <Icon
                        name={ultimoPassoPrimeiroCard.aguardandoConfirmacao ? 'hourglass_top' : 'check_circle'}
                        className="text-sm"
                        size={ultimoPassoPrimeiroCard.aguardandoConfirmacao ? 15 : undefined}
                        fill={!ultimoPassoPrimeiroCard.aguardandoConfirmacao}
                      />
                      {ultimoPassoPrimeiroCard.aguardandoConfirmacao
                        ? ultimoPassoPrimeiroCard.qtdCorrecoes > 0
                          ? `${dados.nome} marcou como corrigido`
                          : `Aguardando sua avaliação`
                        : ultimoPassoPrimeiroCard.qtdCorrecoes > 0
                          ? 'Correção aprovada'
                          : 'Aprovado'}
                    </span>
                    {ultimoPassoPrimeiroCard.aguardandoConfirmacao && (
                      <button
                        type="button"
                        onClick={() => confirmarCorrecao(ultimoPassoPrimeiroCard.id)}
                        disabled={confirmandoCorrecao}
                        className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {confirmandoCorrecao
                          ? 'Confirmando...'
                          : ultimoPassoPrimeiroCard.qtdCorrecoes > 0
                            ? 'Marcar como concluído'
                            : 'Aprovar'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => pedirCorrecao(ultimoPassoPrimeiroCard.id)}
                      disabled={pedindoCorrecao}
                      className="rounded-lg border border-navy-600 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:border-amber-500/50 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {pedindoCorrecao
                        ? 'Enviando...'
                        : ultimoPassoPrimeiroCard.qtdCorrecoes > 0
                          ? 'Pedir outra correção'
                          : 'Pedir correção'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        </Acordeao>
      </div>

      <div className="flex gap-2">
        {(['passos', 'fluxos'] as const).map((chave) => (
          <button
            key={chave}
            type="button"
            onClick={() => setAba(chave)}
            className={cx(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              aba === chave
                ? 'bg-gold-500/20 text-gold-300'
                : 'text-neutral-400 hover:text-neutral-200',
            )}
          >
            {chave === 'passos' ? `Passos (${passosFeitos}/${passosTotal})` : `Guia (${fluxosFeitos}/${fluxos.length})`}
          </button>
        ))}
      </div>

      {aba === 'passos' ? (
        <div key={aba} className="anim-page flex flex-col gap-4">
          <p className="self-center text-xs font-medium uppercase tracking-wide text-neutral-500">
            Progresso de {dados.nome}
          </p>
          <TrilhaFasesLeitura passos={dados.passos} />
        </div>
      ) : (
        <div key={aba} className="anim-page flex flex-col gap-4">
          <p className="self-center text-xs font-medium uppercase tracking-wide text-neutral-500">
            Guia de {dados.nome}
          </p>
          <GuiaModulosLeitura fluxos={fluxos} />
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
    </div>
  )
}
