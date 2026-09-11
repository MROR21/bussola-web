import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BoasVindasModal } from '../../components/BoasVindasModal'
import { CompassRose } from '../../components/CompassRose'
import { Carregando } from '../../components/Spinner'
import { Icon } from '../../components/Icon'
import { MapCorners } from '../../components/MapCorners'
import { MapIllustration } from '../../components/MapIllustration'
import { TrailDivider } from '../../components/TrailDivider'
import { usePolling, useRefetchOnFocus } from '../../hooks/useAtualizarEmSegundoPlano'
import { useTitulo } from '../../hooks/useTitulo'
import { cx } from '../../utils/cx'
import { useAuthStore } from '../auth/authStore'
import { getFluxosConcluidos } from '../fluxos/fluxosService'
// import type { AcessoProgresso } from '../gestor/types'
import { ProgressRing } from './ProgressRing'
import { getMeuCardLink, getProgresso } from './progressService'
import type { TrailStep } from './types'

// Ícone por fase (fallback genérico se aparecer uma fase nova).
const FASE_ICONE: Record<string, string> = {
  Ambientação: 'waving_hand',
  'Ambiente técnico': 'computer',
  Padrões: 'square_foot',
  'Conheça o sistema': 'hub',
  'Primeiro Card': 'emoji_events',
}
const iconeDaFase = (fase: string) => FASE_ICONE[fase] ?? 'flag'

// Resumo breve por fase, pro card de dentro da fase — a Fase (`Bussola.Domain.Entities.Fase`) só
// tem Nome/Order no banco, sem campo de descrição, então isso fica fixo no front por enquanto
// (mesmo espírito do FASE_ICONE acima: são só 5 fases do currículo, não conteúdo editável por
// instância). Sem entrada = sem resumo (fase nova não quebra, só não mostra o texto).
const FASE_RESUMO: Record<string, string> = {
  Ambientação: 'Conheça a Agilean, o squad e como as coisas funcionam por aqui.',
  Padrões: 'Os padrões de código e o fluxo de git que o time segue no dia a dia.',
  'Ambiente técnico': 'Deixe o ambiente de desenvolvimento pronto pra codar.',
  'Conheça o sistema': 'Entenda o produto do seu squad por dentro, na prática.',
  'Primeiro Card': 'Do primeiro card ao merge — o ciclo completo de uma entrega.',
}

// Confete saindo do card quando a fase é concluída — cada pedacinho "explode" (pop + queda curta +
// sumiço) e REPETE 3 vezes seguidas (~3s no total, como se confetes novos fossem surgindo),
// não é 1 pedaço caindo devagar. Depois da última repetição, `forwards` segura invisível (não fica
// em loop pra sempre). Posições espalhadas nas 4 bordas do card, pra dar a sensação de "saindo de
// dentro dele" pros lados de fora.
const CONFETE = [
  { top: '-4%', left: '8%', rotate: -20, atraso: 0, cor: 'bg-gold-500' },
  { top: '-6%', left: '22%', rotate: 15, atraso: 0.05, cor: 'bg-amber-400' },
  { top: '-3%', left: '36%', rotate: -10, atraso: 0.26, cor: 'bg-gold-300' },
  { top: '-5%', left: '50%', rotate: 25, atraso: 0.1, cor: 'bg-green-400' },
  { top: '-3%', left: '64%', rotate: -20, atraso: 0.2, cor: 'bg-gold-500' },
  { top: '-6%', left: '78%', rotate: 10, atraso: 0.14, cor: 'bg-amber-400' },
  { top: '-4%', left: '92%', rotate: -15, atraso: 0.02, cor: 'bg-gold-300' },
  { top: '18%', left: '-5%', rotate: 30, atraso: 0.08, cor: 'bg-amber-400' },
  { top: '18%', left: '103%', rotate: -25, atraso: 0.28, cor: 'bg-gold-500' },
  { top: '45%', left: '-4%', rotate: 30, atraso: 0.08, cor: 'bg-amber-400' },
  { top: '45%', left: '102%', rotate: -25, atraso: 0.12, cor: 'bg-gold-300' },
  { top: '72%', left: '-5%', rotate: -20, atraso: 0.24, cor: 'bg-green-400' },
  { top: '72%', left: '103%', rotate: 15, atraso: 0.04, cor: 'bg-gold-500' },
  { top: '98%', left: '10%', rotate: 20, atraso: 0.16, cor: 'bg-green-400' },
  { top: '100%', left: '25%', rotate: -30, atraso: 0.22, cor: 'bg-gold-500' },
  { top: '99%', left: '40%', rotate: 10, atraso: 0.3, cor: 'bg-amber-400' },
  { top: '98%', left: '55%', rotate: -15, atraso: 0.06, cor: 'bg-gold-300' },
  { top: '100%', left: '70%', rotate: 25, atraso: 0.18, cor: 'bg-green-400' },
  { top: '98%', left: '85%', rotate: -10, atraso: 0.12, cor: 'bg-amber-400' },
] as const

function ConfeteExplosao() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {CONFETE.map((p, i) => (
        <span
          key={i}
          className="absolute"
          style={{ top: p.top, left: p.left, transform: `rotate(${p.rotate}deg)` }}
        >
          <span
            className={cx('anim-confete block h-2 w-1 rounded-sm', p.cor)}
            style={{ animationDelay: `${p.atraso}s` }}
          />
        </span>
      ))}
    </div>
  )
}

// Uma entrada do "Diário de bordo" (lista vertical de Passos/Fluxos dentro de uma Fase) — usado
// tanto na fase em andamento (mistura feito/atual/bloqueado) quanto na fase já concluída (revisão,
// tudo feito e clicável). Selo dourado preenchido quando feito; atual pulsa esperando ser
// carimbado; bloqueado fica opaco com cadeado e tracejado.
function ItemDiarioDeBordo({
  item,
  indice,
  isLast,
  feito,
  atual,
  bloqueado,
  href,
}: {
  item: TrailStep
  indice: number
  isLast: boolean
  feito: boolean
  atual: boolean
  bloqueado: boolean
  href: string
}) {
  const marco = (
    <div className="flex shrink-0 flex-col items-center">
      <span
        className={cx(
          'flex size-11 shrink-0 items-center justify-center rounded-full border-2 bg-navy-800 text-base transition-colors duration-200',
          bloqueado
            ? 'border-dashed border-navy-600 text-neutral-600 opacity-60'
            : feito
              ? 'border-amber-400/70 text-amber-400'
              : atual
                ? 'anim-pulso border-gold-400 text-gold-400 shadow-[0_0_0_4px_rgba(201,162,39,0.15)]'
                : 'border-navy-600 text-gold-400',
        )}
      >
        <Icon
          name={bloqueado ? 'lock' : feito ? 'military_tech' : item.tipo === 'fluxo' ? 'hub' : 'flag'}
          fill={feito}
        />
      </span>
      {!isLast && (
        <span
          className={cx(
            'my-1 min-h-[16px] w-px flex-1',
            bloqueado ? 'border-l border-dashed border-navy-600' : 'bg-navy-600',
          )}
        />
      )}
    </div>
  )

  // O item ATUAL se expande em formato de destaque (título, descrição, CTA) na própria posição
  // dele na lista — assim que ele é concluído, vira uma entrada compacta igual as outras, e é o
  // próximo item que virar "atual" quem expande, no lugar dele.
  if (atual) {
    return (
      <li className="flex gap-3">
        {marco}
        <div className="relative mb-6 flex-1 overflow-hidden rounded-xl border border-gold-500/50 bg-gold-500/10 p-4">
          <MapCorners tamanho={4} opacidade={25} />
          <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gold-400">
            <Icon name="play_arrow" className="text-sm" /> Passo atual
          </span>
          <h3 className="text-base font-semibold text-neutral-100">{item.title}</h3>
          {item.description && <p className="text-sm text-neutral-400">{item.description}</p>}
          <Link
            to={href}
            state={{ deFase: true }}
            className="mt-2 inline-block rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-400"
          >
            Ir para o {item.tipo === 'fluxo' ? 'fluxo' : 'passo'}
          </Link>
        </div>
      </li>
    )
  }

  const conteudo = (
    <>
      {marco}
      <div className="flex flex-1 flex-col gap-0.5 pb-6">
        <span className="text-xs text-neutral-500">
          {item.tipo === 'fluxo' ? 'Fluxo do squad' : `Passo ${indice + 1}`}
        </span>
        <span
          className={cx(
            'text-sm font-medium leading-snug',
            bloqueado ? 'text-neutral-600' : 'text-neutral-200',
          )}
        >
          {item.title}
        </span>
        {feito && (
          <span className="w-fit rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-400">
            Carimbado
          </span>
        )}
      </div>
    </>
  )
  return bloqueado ? (
    <li className="flex gap-3">{conteudo}</li>
  ) : (
    <li>
      <Link to={href} state={{ deFase: true }} className="flex gap-3 transition-opacity hover:opacity-80">
        {conteudo}
      </Link>
    </li>
  )
}

// Cada fase só libera depois que a ANTERIOR estiver 100% concluída — gate rígido em sequência
// (decisão do Miguel 2026-09-05, substituindo o gate suave que só travava a fase final).

// Layout da trilha central: cada fase é um marco numa linha sinuosa (zigue-zague), não um grid de
// cards — o pedido foi um caminho visual de verdade. X em % (responsivo, mesma escala do viewBox
// do SVG) e Y em px reais (a altura do container é fixa em px).
const TRILHA_CIRCULO = 64
const TRILHA_PASSO_Y = 168
const TRILHA_AMPLITUDE = 25

// Home "Sua Jornada": progresso geral + próximo passo + fases em CARDS (clica e entra na fase).
export function JornadaView({
  trail,
  userId,
  nome,
  gestorNome,
  onRestart,
}: {
  trail: TrailStep[]
  userId: string
  nome: string
  gestorNome?: string | null
  onRestart: () => void
}) {
  const [passosConcluidos, setPassosConcluidos] = useState<Set<string>>(new Set())
  // Subconjunto de `passosConcluidos` que ainda tá pendente de avaliação do gestor (pediu
  // correção OU aguardando aprovação) — usado só pra saber se a fase/Jornada fechou DE VERDADE
  // (ver `estaAprovado` abaixo); a contagem numérica normal (`estaConcluido`) já sente o envio da
  // comprovação como avanço mesmo antes da aprovação.
  const [passosPendentes, setPassosPendentes] = useState<Set<string>>(new Set())
  const [fluxosConcluidos, setFluxosConcluidos] = useState<Set<string>>(new Set())
  // ENGAVETADO junto com o container "Seus acessos" logo abaixo (ver comentário lá) — descomentar
  // os dois juntos se o gestor confirmar que faz sentido ter essa visão pro colaborador.
  // const [acessos, setAcessos] = useState<AcessoProgresso[]>([])
  // Link do card que o gestor enviou pra fase "Primeiro Card" — null = ainda não enviou, e é
  // isso que trava os passos dessa fase (ver o branch de faseNome === 'Primeiro Card' abaixo).
  const [cardLink, setCardLink] = useState<string | null>(null)
  // Fica false do mount até a 1ª rodada de progresso/fluxos/card resolver — sem essa trava, o
  // componente já renderizava de cara com os Sets vazios (padrão do useState), e como
  // `podeEntrar`/`faseLiberada` dependem desses dados, uma fase que já devia estar liberada
  // aparecia bloqueada por um instante — a Jornada "piscava" pra visão de Home antes de acertar
  // pra visão da fase certa. Reproduzível toda vez que este componente remonta do zero enquanto
  // já se está numa fase (ex.: "Voltar" de dentro de um Passo, ou entrar direto por link).
  const [dadosProntos, setDadosProntos] = useState(false)
  // Dispara sozinho na 1ª vez que ESSE usuário entra na Home da Jornada (chaveado por id, não uma
  // flag solta — ver comentário em authStore.ts) + pode ser reaberto a qualquer momento pelo botão
  // "Como funciona o Bússola?" lá embaixo.
  const jaViuBoasVindas = useAuthStore((s) => s.boasVindasVistas[userId]?.jornada)
  const marcarBoasVindasVista = useAuthStore((s) => s.marcarBoasVindasVista)
  const [mostrarBoasVindas, setMostrarBoasVindas] = useState(false)
  useEffect(() => {
    if (!jaViuBoasVindas) setMostrarBoasVindas(true)
  }, [jaViuBoasVindas])
  function fecharBoasVindas() {
    setMostrarBoasVindas(false)
    marcarBoasVindasVista(userId, 'jornada')
  }
  // A fase aberta vive no PATH (/fase/:nome) — assim o "voltar" do navegador sai da fase
  // (em vez de sair da página), igual entrar/sair funcionasse por rota de verdade.
  const { nome: faseParam } = useParams<{ nome?: string }>()
  const faseSelecionada = faseParam ?? null
  const navigate = useNavigate()
  const entrarFase = (fase: string) => navigate(`/fase/${encodeURIComponent(fase)}`)
  const sairFase = () => navigate('/')

  useTitulo(faseSelecionada ?? 'Jornada')

  useEffect(() => {
    setDadosProntos(false)
    const pProgresso = getProgresso(userId)
      .then((p) => {
        setPassosConcluidos(new Set(p.completos))
        setPassosPendentes(new Set(p.pendentes))
      })
      .catch(() => {})
    const pFluxos = getFluxosConcluidos().then((ids) => setFluxosConcluidos(new Set(ids))).catch(() => {})
    // getMeusAcessos(userId).then(setAcessos).catch(() => {})
    const pCardLink = getMeuCardLink(userId).then((r) => setCardLink(r.url)).catch(() => {})
    // Cada promise acima já engole o próprio erro (.catch(() => {})), então o Promise.all abaixo
    // sempre resolve assim que as 3 terminarem — nunca fica preso esperando por causa de uma falha.
    Promise.all([pProgresso, pFluxos, pCardLink]).then(() => setDadosProntos(true))
  }, [userId])

  // O gestor libera um acesso na tela do Supervisionado enquanto o colaborador já pode estar com a
  // Jornada aberta — busca de novo, em silêncio, quando a aba volta a ficar em foco (mesmo padrão
  // de JornadaPage.tsx pra trilha/fase editada pelo Admin).
  // ENGAVETADO junto com "Seus acessos" (ver acima) — sem uso enquanto o hook não tem call site.
  // useRefetchOnFocus(() => {
  //   getMeusAcessos(userId).then(setAcessos).catch(() => {})
  // })

  // O gestor envia o card na tela do Supervisionado enquanto o colaborador já pode estar com a
  // fase Primeiro Card aberta esperando — mesmo padrão de refetch-on-focus de cima.
  useRefetchOnFocus(() => {
    getMeuCardLink(userId).then((r) => setCardLink(r.url)).catch(() => {})
  })

  // O próprio colaborador envia a comprovação do Primeiro Card no PassoDetalhePage (rota
  // diferente), e o GESTOR aprova/pede correção de lá também — essa é a tela em que o
  // colaborador mais fica com a aba aberta esperando essa resposta (ver JornadaPage.tsx), então
  // só refetch-on-focus deixava um intervalo sem atualizar sozinho enquanto ele ficava olhando
  // sem trocar de aba. Polling de 15s, mesmo padrão de PassoDetalhePage/SupervisionadoPage.
  usePolling(() => {
    getProgresso(userId)
      .then((p) => {
        setPassosConcluidos(new Set(p.completos))
        setPassosPendentes(new Set(p.pendentes))
      })
      .catch(() => {})
  }, 15_000)

  const estaConcluido = (item: TrailStep) =>
    item.tipo === 'fluxo' ? fluxosConcluidos.has(item.id) : passosConcluidos.has(item.id)

  // Igual a `estaConcluido`, mas exige que não esteja pendente de avaliação do gestor — só usado
  // pros booleanos que fecham fase/Jornada de VERDADE (faseCompleta, completa, faseLiberada). A
  // contagem numérica (feitos/pct) usa `pesoItem` abaixo, não esse boolean direto.
  const estaAprovado = (item: TrailStep) =>
    estaConcluido(item) && (item.tipo === 'fluxo' || !passosPendentes.has(item.id))

  // Peso de um item pro PERCENTUAL (não pro "X de Y", que continua inteiro): 1 se aprovado de
  // verdade, 0.5 se só enviado e ainda pendente de avaliação (sente o envio como avanço, sem
  // travar num teto arbitrário tipo 99%), 0 se nem isso. Com isso, o percentual só bate 100%
  // quando `completa`/`faseCompleta` (estrito) também batem — nunca antes, sem precisar de cap.
  const pesoItem = (item: TrailStep) => (estaAprovado(item) ? 1 : estaConcluido(item) ? 0.5 : 0)

  // Agrupa por fase preservando a ordem (o back já manda ordenado: fases guiadas, depois os
  // fluxos do squad, por fim o Primeiro Card).
  const fases = useMemo(() => {
    const grupos = new Map<string, TrailStep[]>()
    for (const item of trail) {
      const lista = grupos.get(item.phase) ?? []
      lista.push(item)
      grupos.set(item.phase, lista)
    }
    return [...grupos.entries()]
  }, [trail])

  // Coordenadas de cada marco da trilha (uma vez por fase) + o caminho SVG que os liga em curva.
  const pontosTrilha = useMemo(
    () =>
      fases.map((_, i) => ({
        x: i === 0 ? 50 : i % 2 === 1 ? 50 - TRILHA_AMPLITUDE : 50 + TRILHA_AMPLITUDE,
        y: i * TRILHA_PASSO_Y + TRILHA_CIRCULO / 2,
      })),
    [fases],
  )

  // O "+140" precisa caber o card de rótulo mais alto possível — quando a ÚLTIMA fase da trilha
  // também é a "atual" (mostra o badge extra "Você está aqui"), o card fica mais alto que o normal;
  // com folga curta demais (era +90), esse card vazava por baixo da altura do container e ficava
  // sobreposto ao conteúdo seguinte da página (bug real reportado pelo Miguel).
  const alturaTrilha =
    pontosTrilha.length > 0 ? pontosTrilha[pontosTrilha.length - 1].y + TRILHA_CIRCULO / 2 + 140 : 0

  const caminhoTrilha = useMemo(() => {
    if (pontosTrilha.length < 2) return ''
    let d = `M ${pontosTrilha[0].x} ${pontosTrilha[0].y}`
    for (let i = 1; i < pontosTrilha.length; i++) {
      const anterior = pontosTrilha[i - 1]
      const atual = pontosTrilha[i]
      const meioY = (anterior.y + atual.y) / 2
      d += ` C ${anterior.x} ${meioY}, ${atual.x} ${meioY}, ${atual.x} ${atual.y}`
    }
    return d
  }, [pontosTrilha])

  const total = trail.length
  // Estrito — o texto "X de Y" mostra só o que foi aprovado de verdade (a barra/anel logo abaixo
  // usa peso fracionário e continua sentindo o envio, ver `percent`).
  const feitos = trail.filter(estaAprovado).length
  // Estrito (aprovado, não só enviado) — "toda a Jornada" só fecha de verdade depois da avaliação
  // do gestor no último passo.
  const completa = total > 0 && trail.every(estaAprovado)
  const percent =
    total > 0 ? Math.round((trail.reduce((soma, item) => soma + pesoItem(item), 0) / total) * 100) : 0

  const proximo = trail.find((item) => !estaConcluido(item))
  const faseAtualIndex = proximo ? fases.findIndex(([fase]) => fase === proximo.phase) : fases.length - 1

  // Fase no índice i só libera se TODAS as anteriores (0..i-1) estiverem aprovadas de verdade — a
  // primeira fase sempre libera (slice vazio, every() é true).
  const faseLiberada = (i: number) =>
    fases.slice(0, i).every(([, itens]) => itens.every(estaAprovado))

  // Só decide Home vs. Fase depois que os dados de progresso chegam — com os Sets ainda vazios
  // (mount fresco), `faseLiberada` acima daria falso pra qualquer fase depois da 1ª, mostrando a
  // Home por engano antes de corrigir sozinho no re-render seguinte (o "pisca" que o Miguel viu
  // ao clicar Voltar de um Passo).
  if (!dadosProntos) return <Carregando texto="Carregando sua jornada..." />

  // ---- Vista de UMA fase (entrou no card) ----
  // Só entra se a fase da URL existe de fato (param inválido/velho → cai na home) e já estiver
  // liberada na sequência (senão volta pra home — o link direto não fura o gate).
  const faseSelecionadaIndex = faseSelecionada ? fases.findIndex(([f]) => f === faseSelecionada) : -1
  const faseEntry = faseSelecionadaIndex >= 0 ? fases[faseSelecionadaIndex] : undefined
  const podeEntrar = faseEntry && faseLiberada(faseSelecionadaIndex)
  if (podeEntrar) {
    const [faseNome, itens] = faseEntry
    // Estrito — o texto "X de Y itens concluídos" mostra só o aprovado de verdade (a barra
    // `pctFase` abaixo usa peso fracionário e sente o envio).
    const feitosFase = itens.filter(estaAprovado).length
    // Estrito — "Fase concluída!" (banner/confete) só quando não sobra ninguém pendente de
    // avaliação do gestor.
    const faseCompleta = itens.every(estaAprovado)
    // "Primeiro Card" é diferente das outras fases: a sequência já libera ENTRAR nela assim que a
    // fase anterior termina, mas os PASSOS de dentro só liberam depois que o gestor manda o link
    // do card (ver GestorPage/SupervisionadoPage) — até lá, mostra um aviso explicando em vez da
    // trilha normal de itens.
    const ehPrimeiroCard = faseNome === 'Primeiro Card'
    const aguardandoCard = ehPrimeiroCard && !cardLink
    // Passo atual (o 1º ainda não concluído) em destaque + uma trilha sinuosa com TODOS os itens
    // da fase (feitos, atual, bloqueados) — mesma linguagem visual da trilha de Fases da Home, só
    // que um nível abaixo (Passo em vez de Fase). A conclusão só acontece de verdade dentro do
    // próprio passo/fluxo.
    const itemAtualIndex = itens.findIndex((item) => !estaConcluido(item))
    const itemAtual = itemAtualIndex >= 0 ? itens[itemAtualIndex] : undefined
    // Mesmo peso fracionário do percentual da Jornada acima — sem isso, uma fase pequena (tipo
    // Primeiro Card com só uns 7 itens) já batia 100% redondo assim que a comprovação era
    // enviada, contradizendo o banner "Chegou o seu primeiro card!" que continua na tela até a
    // aprovação de verdade.
    const pctFase =
      itens.length > 0
        ? Math.round((itens.reduce((soma, item) => soma + pesoItem(item), 0) / itens.length) * 100)
        : 0
    // Fase seguinte na sequência (se existir) — a fase atual acabou de ficar 100% completa, então
    // ela já libera a próxima (mesmo gate `faseLiberada` de cima), sem precisar checar de novo.
    const proximaFaseEntry =
      faseSelecionadaIndex >= 0 && faseSelecionadaIndex < fases.length - 1
        ? fases[faseSelecionadaIndex + 1]
        : undefined
    const hrefDoItem = (item: TrailStep) =>
      item.tipo === 'fluxo'
        ? `/fluxo/${encodeURIComponent(item.title)}`
        : `/passo/${encodeURIComponent(item.title)}`

    return (
      <div className="anim-fade relative flex w-full max-w-2xl flex-col gap-5">
        <CompassRose className="pointer-events-none absolute -right-10 -top-4 size-64 text-gold-500 opacity-[0.15]" />
        <MapIllustration className="pointer-events-none absolute -bottom-10 -left-8 w-56 text-gold-500 opacity-[0.06]" />
        <button
          type="button"
          onClick={sairFase}
          className="relative flex items-center gap-1 self-start text-sm text-neutral-400 transition-colors hover:text-neutral-200"
        >
          <Icon name="arrow_back" className="text-base" /> Voltar pra jornada
        </button>
        <div
          className={cx(
            'relative flex flex-col gap-3 rounded-2xl border bg-navy-800 p-5 transition-colors',
            faseCompleta ? 'border-gold-500/40' : 'border-navy-700',
          )}
        >
          <MapCorners tamanho={5} opacidade={20} />
          {faseCompleta && <ConfeteExplosao />}
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-400">
              <Icon name={iconeDaFase(faseNome)} className="text-2xl" />
            </span>
            <div className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-neutral-100">{faseNome}</h2>
                {faseCompleta && (
                  <span className="flex items-center gap-1 rounded-full bg-gold-500/20 px-2 py-0.5 text-xs font-medium text-gold-300">
                    <Icon name="check" className="text-sm" /> Concluída
                  </span>
                )}
              </div>
              <span className="text-xs text-neutral-500">
                {faseCompleta ? 'Fase concluída!' : `${feitosFase} de ${itens.length} itens concluídos`}
              </span>
            </div>
          </div>
          {FASE_RESUMO[faseNome] && (
            <p className="text-sm text-neutral-400">{FASE_RESUMO[faseNome]}</p>
          )}
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-700">
              <div
                className="h-full rounded-full bg-gold-500 transition-all"
                style={{ width: `${pctFase}%` }}
              />
            </div>
            <span className="shrink-0 text-xs text-neutral-500">{pctFase}%</span>
          </div>
        </div>

        {aguardandoCard && (
          <div className="anim-pop relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-navy-700 bg-navy-800 p-5">
            <MapCorners tamanho={4} opacidade={20} />
            <span className="flex items-center gap-2 text-base font-semibold text-neutral-100">
              <Icon name="hourglass_top" className="text-xl text-gold-400" /> Aguardando seu gestor
            </span>
            <p className="text-sm text-neutral-400">
              Chegou a hora do seu primeiro card! Seu gestor vai escolher e te enviar o link em
              breve — os passos dessa fase liberam automaticamente assim que ele mandar.
            </p>
          </div>
        )}

        {/* Some quando a fase termina — já cumpriu o papel de dar o link+instrução enquanto a
            pessoa trabalhava nele; o painel "concluiu a jornada" logo abaixo vira a mensagem
            final única, sem repetir outro card dourado igual em seguida. */}
        {ehPrimeiroCard && cardLink && !faseCompleta && (
          <div className="anim-pop relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-gold-500/40 bg-gold-500/10 p-5">
            <MapCorners tamanho={4} opacidade={20} />
            <span className="flex items-center gap-2 text-base font-semibold text-neutral-100">
              <Icon name="emoji_events" className="text-xl text-gold-400" fill /> Chegou o seu
              primeiro card!
            </span>
            <p className="text-sm text-neutral-400">
              É a sua primeira atividade de verdade aqui na Agilean — uma tarefa real, escolhida
              pelo seu gestor. Implemente o que o card pede seguindo o passo a passo abaixo — ele
              te guia da branch até o Pull Request. No último passo, cole o link do seu PR como
              comprovação.
            </p>
            <a
              href={cardLink}
              target="_blank"
              rel="noreferrer"
              className="flex w-fit items-center gap-1.5 self-start rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-400"
            >
              <Icon name="open_in_new" className="text-base" /> Abrir o link do seu primeiro card
            </a>
          </div>
        )}

        {faseCompleta && (
          <div className="anim-pop relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-gold-500/40 bg-gold-500/10 p-5 sm:flex-row sm:items-center">
            <MapCorners tamanho={4} opacidade={20} />
            {proximaFaseEntry ? (
              <>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-navy-800 text-gold-400">
                  <Icon name={iconeDaFase(proximaFaseEntry[0])} className="text-2xl" />
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gold-400">
                    <Icon name="arrow_forward" className="text-sm" /> Próxima fase
                  </span>
                  <span className="text-base font-semibold text-neutral-100">{proximaFaseEntry[0]}</span>
                  {FASE_RESUMO[proximaFaseEntry[0]] && (
                    <span className="text-sm text-neutral-400">{FASE_RESUMO[proximaFaseEntry[0]]}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => entrarFase(proximaFaseEntry[0])}
                  className="shrink-0 self-start rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-400 sm:self-center"
                >
                  Ir para a próxima fase
                </button>
              </>
            ) : (
              <>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-navy-800 text-gold-400">
                  <Icon name="emoji_events" className="text-2xl" fill />
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-base font-semibold text-neutral-100">
                    Você concluiu toda a jornada!
                  </span>
                  <span className="text-sm text-neutral-400">
                    Do clone ao primeiro card — bem-vindo(a) de verdade à Agilean.
                  </span>
                </div>
                <Link
                  to="/"
                  className="shrink-0 self-start rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-400 sm:self-center"
                >
                  Ver visão geral da jornada
                </Link>
              </>
            )}
          </div>
        )}

        {/* "Diário de bordo" — lista vertical de entradas de log ligadas por uma linha fina (não a
            trilha sinuosa da Jornada: um nível abaixo pede um registro mais discreto, tipo
            caderno de bordo, não outro mapa). O destaque do "passo atual" não é mais um card fixo
            separado — a entrada atual DENTRO da lista se expande (título, descrição, botão) e
            some pro formato compacto assim que é concluída, o próximo item que virar atual
            expande no lugar dele (o destaque "sobe" acompanhando o progresso).
            `itemAtual` pode não existir mesmo sem a fase estar 100% aprovada — é exatamente o caso
            do último passo (comprovação) já enviado mas ainda em análise: `estaConcluido` (lenient)
            já conta ele como feito, então não sobra "próximo item" pra apontar. Sem `itemAtual`,
            ninguém fica marcado como atual/bloqueado — só mostra tudo "feito" (o pendente também,
            já que ele sente o avanço igual) e o card de "aguardando avaliação" acima já avisa o
            que falta de verdade. */}
        {!aguardandoCard && (
          <ul className="relative flex flex-col">
            {itens.map((item, i) => (
              <ItemDiarioDeBordo
                key={item.id}
                item={item}
                indice={i}
                isLast={i === itens.length - 1}
                feito={estaConcluido(item)}
                atual={itemAtual ? item.id === itemAtual.id : false}
                bloqueado={itemAtual ? i > itemAtualIndex : false}
                href={hrefDoItem(item)}
              />
            ))}
          </ul>
        )}
      </div>
    )
  }

  // ---- Home: hero + próximo passo + cards das fases ----
  return (
    <div className="relative flex w-full max-w-2xl flex-col gap-8">
      <BoasVindasModal aberto={mostrarBoasVindas} onFechar={fecharBoasVindas} papel="colaborador" />
      {/* Atmosfera da página inteira — igual à técnica do hero (absoluto + DOM antes dos
          irmãos "opacos", sem z-index negativo): um `position:fixed` com z negativo parecia
          funcionar, mas quebrou quando o `AppLayout` ganhou `position:relative` lá em cima (o
          fixed passou a ficar preso na stacking context do layout, atrás do próprio fundo do
          app). absolute+DOM-order não tem essa armadilha. Dois motivos, cantos opostos, pra dar
          mais vida (rosa dos ventos em cima, mapa embaixo) sem competir com a do hero. */}
      <CompassRose
        className="pointer-events-none absolute -right-16 -top-10 size-[520px] text-gold-500 opacity-[0.15]"
      />
      <MapIllustration
        className="pointer-events-none absolute -bottom-10 -left-20 w-[420px] text-gold-500 opacity-[0.07]"
      />
      {/* Hero — anel de progresso + próximo passo num único cartão (antes eram duas caixas soltas
          empilhadas; agora lê como um bloco só, com o glow sutil atrás do anel). */}
      <div className="relative overflow-hidden rounded-3xl border border-navy-700 bg-navy-800 shadow-xl shadow-black/20">
        <MapCorners />
        <CompassRose
          className="pointer-events-none absolute -bottom-10 -right-10 size-40 text-gold-500 opacity-[0.15]"
        />
        <div
          className="pointer-events-none absolute -left-12 -top-16 size-56 rounded-full bg-gold-500/10 blur-3xl"
          aria-hidden="true"
        />

        {/* Botão do "guiazinho" (reabre o modal de boas-vindas) — antes morava lá embaixo, perto do
            "Refazer nivelamento", meio escondido no fim da página. Aqui no canto do hero é a
            primeira coisa visível ao entrar na Jornada. */}
        <button
          type="button"
          onClick={() => setMostrarBoasVindas(true)}
          title="Como funciona o Bússola?"
          className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full border border-gold-500/40 bg-navy-900/80 px-2.5 py-1 text-xs font-medium text-gold-400 backdrop-blur-sm transition-colors hover:border-gold-500/70 hover:text-gold-300"
        >
          <Icon name="help" className="text-sm" /> Guia rápido
        </button>

        <div className="relative flex items-center gap-5 p-6">
          <ProgressRing percent={percent} size={96}>
            <span className="text-xl font-bold text-neutral-100">{percent}%</span>
          </ProgressRing>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-neutral-400">Sua jornada</p>
            <h2 className="flex items-center gap-1.5 text-2xl font-bold text-neutral-100">
              Olá, {nome} <Icon name="waving_hand" className="text-xl text-gold-400" />
            </h2>
            <p className="text-sm text-neutral-400">
              {feitos} de {total} itens · Fase {Math.min(faseAtualIndex + 1, fases.length)} de{' '}
              {fases.length}
            </p>
            {gestorNome && (
              <p className="text-xs text-neutral-500">
                Seu gestor: <span className="text-neutral-400">{gestorNome}</span>
              </p>
            )}
          </div>
        </div>

        {completa ? (
          <div className="anim-fade relative flex flex-col items-center gap-3 border-t border-navy-700 bg-gold-500/10 p-6 text-center">
            <Icon name="emoji_events" className="text-4xl text-gold-400" fill />
            <h3 className="text-lg font-semibold text-neutral-100">Jornada completa!</h3>
            <p className="text-sm text-neutral-400">
              Você foi do clone ao primeiro card. Bem-vindo(a) de verdade à Agilean.
            </p>
            <TrailDivider className="w-40" />
            <p className="flex items-center justify-center gap-1.5 text-base font-medium text-gold-300">
              Agora é com você! <Icon name="rocket_launch" className="text-lg" />
            </p>
            <Link
              to="/guias"
              // Sinaliza pro AppLayout abrir o galho "Guias" do menu lateral já expandido — é uma
              // ação explícita de "me leva pra lá", diferente de navegação incidental (por isso não
              // reabre a regra geral do menu, que fica fechado até o usuário abrir manualmente).
              state={{ expandirMenuGuias: true }}
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-400"
            >
              Ir pro Guia pelo sistema
            </Link>
          </div>
        ) : proximo ? (
          <div className="anim-fade relative flex flex-col gap-3 border-t border-navy-700 bg-gold-500/10 p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gold-400/50 bg-navy-800 text-gold-400">
                <Icon name={iconeDaFase(proximo.phase)} className="text-lg" />
              </span>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gold-400">
                  <Icon name="play_arrow" className="text-sm" /> Próximo · {proximo.phase}
                </span>
                <h3 className="text-lg font-semibold text-neutral-100">{proximo.title}</h3>
                <p className="text-sm text-neutral-400">{proximo.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => entrarFase(proximo.phase)}
              className="self-start rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-400"
            >
              Ir para a fase
            </button>
          </div>
        ) : (
          // Não sobra "próximo" (todo mundo já tem registro, `estaConcluido` lenient) mas também
          // não é `completa` de verdade (ainda tem gente pendente de aprovação) — não existe
          // PRÓXIMA fase nenhuma nesse caso (é literalmente a última), então o rótulo é "último
          // passo pendente", não "próximo". `itemPendenteFinal` é o item que falta aprovar.
          (() => {
            const itemPendenteFinal = trail.find((item) => !estaAprovado(item))
            return (
              itemPendenteFinal && (
                <div className="anim-fade relative flex flex-col gap-3 border-t border-navy-700 bg-sky-500/10 p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-sky-400/50 bg-navy-800 text-sky-400">
                      <Icon name="hourglass_top" className="text-lg" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-sky-400">
                        <Icon name="play_arrow" className="text-sm" /> Aguardando aprovação ·{' '}
                        {itemPendenteFinal.phase}
                      </span>
                      <h3 className="text-lg font-semibold text-neutral-100">{itemPendenteFinal.title}</h3>
                      <p className="text-sm text-neutral-400">
                        Você já enviou tudo — só falta seu gestor aprovar pra fechar a Jornada.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => entrarFase(itemPendenteFinal.phase)}
                    className="self-start rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-400"
                  >
                    Ir para a fase
                  </button>
                </div>
              )
            )
          })()
        )}
      </div>

      {/* ENGAVETADO a pedido do Miguel (2026-09-09): tirado de vista até ele confirmar com o gestor
          se faz sentido o colaborador ver o próprio progresso de acessos aqui. Se a resposta for
          sim, descomentar o bloco abaixo; se não, apagar de vez. (Motivo original de existir: sem
          isso o modal de boas-vindas prometia "acompanhe seus acessos" sem nenhuma tela de verdade
          por trás pro colaborador ver o próprio progresso.)
      {acessos.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Seus acessos
          </h3>
          <div className="relative flex flex-col gap-3 rounded-2xl border border-navy-700 bg-navy-800 p-5">
            <MapCorners tamanho={4} opacidade={20} />
            <p className="text-sm text-neutral-400">
              {acessos.filter((a) => a.concluido).length} de {acessos.length} liberados pelo seu
              gestor.
            </p>
            <ul className="flex flex-wrap gap-2">
              {acessos.map((a) => (
                <li key={a.id} className="relative">
                  <span
                    className={cx(
                      'flex items-center rounded-full border px-3 py-1 text-xs',
                      a.concluido
                        ? 'border-green-500/40 bg-green-500/10 text-green-300'
                        : 'border-navy-600 bg-navy-900 text-neutral-400',
                    )}
                  >
                    {a.nome}
                  </span>
                  {a.concluido && (
                    <span className="pointer-events-none absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-navy-800">
                      <Icon name="verified" className="text-sm text-green-400" fill />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      */}

      {/* Trilha central — um caminho sinuoso ligando as fases, marco por marco (em vez de um
          grid de cards): o pedido foi um sentido de trilha literal, não uma lista disfarçada. */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Fases da jornada
        </h3>
        <div className="relative mx-auto w-full max-w-md" style={{ height: alturaTrilha }}>
          <svg
            viewBox={`0 0 100 ${alturaTrilha}`}
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 size-full text-navy-700"
            aria-hidden="true"
          >
            <path
              d={caminhoTrilha}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeDasharray="3 7"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {fases.map(([fase, itens], i) => {
            // Estrito — mesmo critério de coerência do texto acima ("X de Y" só conta aprovado).
            const feitosFase = itens.filter(estaAprovado).length
            const faseCompleta = itens.every(estaAprovado)
            const pct =
              itens.length > 0
                ? Math.round((itens.reduce((soma, item) => soma + pesoItem(item), 0) / itens.length) * 100)
                : 0
            const atual = proximo?.phase === fase
            const bloqueada = !faseLiberada(i)
            const ponto = pontosTrilha[i]

            return (
              <button
                key={fase}
                type="button"
                disabled={bloqueada}
                onClick={() => entrarFase(fase)}
                className={cx(
                  'absolute flex w-[152px] -translate-x-1/2 flex-col items-center gap-2 transition-transform duration-200',
                  bloqueada ? 'cursor-not-allowed' : 'hover:-translate-y-0.5',
                )}
                style={{ left: `${ponto.x}%`, top: ponto.y - TRILHA_CIRCULO / 2 }}
              >
                <span
                  className={cx(
                    'flex size-16 shrink-0 items-center justify-center rounded-full border-2 bg-navy-800 text-2xl transition-colors duration-200',
                    bloqueada
                      ? 'border-dashed border-navy-600 text-neutral-600 opacity-60'
                      : faseCompleta
                        ? 'border-amber-400/70 text-amber-400'
                        : atual
                          ? 'anim-pulso border-gold-400 text-gold-400 shadow-[0_0_0_5px_rgba(201,162,39,0.15)]'
                          : 'border-navy-600 text-gold-400 hover:border-gold-500/60',
                  )}
                >
                  <Icon name={bloqueada ? 'lock' : iconeDaFase(fase)} />
                </span>
                <span className="flex w-full flex-col items-center gap-1 rounded-xl border border-navy-700 bg-navy-800 px-3 py-2 text-center">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                    Fase {i + 1}
                  </span>
                  <span className="text-xs font-semibold leading-tight text-neutral-100">{fase}</span>
                  {atual && !bloqueada && (
                    <span className="anim-pop rounded-full bg-gold-500/20 px-2 py-0.5 text-[10px] font-medium text-gold-300">
                      Você está aqui
                    </span>
                  )}
                  <span className="text-[11px] text-neutral-500">
                    {bloqueada ? 'Apto após concluir a fase anterior' : `${feitosFase} de ${itens.length}`}
                  </span>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-navy-700">
                    <div
                      className="h-full rounded-full bg-gold-500 transition-all"
                      style={{ width: `${bloqueada ? 0 : pct}%` }}
                    />
                  </div>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={onRestart}
        className="self-center text-sm text-neutral-500 transition-colors hover:text-neutral-300"
      >
        Refazer nivelamento
      </button>
    </div>
  )
}
