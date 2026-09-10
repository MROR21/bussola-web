import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { CompassRose } from '../components/CompassRose'
import { Icon } from '../components/Icon'
import { useAuthStore } from '../features/auth/authStore'
import { listarFluxos } from '../features/fluxos/fluxosService'
import type { Fluxo } from '../features/fluxos/types'
import { NotificationBell } from '../features/notificacoes/NotificationBell'
import { listarSteps } from '../features/onboarding/onboardingService'
import type { OnboardingStep } from '../features/onboarding/types'
import { Avatar } from '../features/perfil/Avatar'
import { useApiStatus } from './useApiStatus'
import { useRefetchOnFocus } from '../hooks/useAtualizarEmSegundoPlano'
import { useSaida } from '../hooks/useSaida'
import { cx } from '../utils/cx'

const CHAVE_MENU_COLAPSADO = 'bussola-menu-colapsado'

// Fluxo aberto pela Jornada sempre entra na fase "Conheça o sistema" (constante espelhando
// `FaseConhecaOSistema` do back) — não precisa buscar nada extra pra saber qual galho destacar.
const FASE_FLUXO_NA_JORNADA = 'Conheça o sistema'

// Nomes distintos, na ordem de aparição (Set preserva ordem de inserção) — usado pra montar os
// "galhos" da árvore (fases da Jornada, módulos do Guia) a partir do que o back já devolve
// ordenado, sem precisar de endpoint novo só pra listar nomes.
function distintosEmOrdem<T>(itens: T[], chaveDe: (item: T) => string): string[] {
  const vistos = new Set<string>()
  for (const item of itens) vistos.add(chaveDe(item))
  return [...vistos]
}

// Ícone de trilha: uma linha ligando 4 pontos (etapas), herda a cor do link (currentColor).
function TrilhaIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 18 L10 11 L15 14 L19 6" />
      <circle cx="5" cy="18" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="10" cy="11" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="6" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

type Papel = 'gestor' | 'colaborador'
// `arvore` diz que tipo de galho essa seção tem (fase ou módulo) — usado só pra escolher a lista
// certa (`fases`/`modulos`) e a base do path (/fase ou /guias) na hora de montar o link. Item com
// `filhosFixos: true` (só "Configurações" hoje) tem galhos ESTÁTICOS (`CONFIG_FILHOS` abaixo), não
// vindos do back — mesmo comportamento de expandir/colapsar, fonte diferente.
const NAV: {
  to: string
  label: string
  icon: ReactNode
  end: boolean
  papel?: Papel
  arvore?: 'fase' | 'modulo'
  filhosFixos?: boolean
}[] = [
  { to: '/gestor', label: 'Supervisionados', icon: <Icon name="group" className="text-[18px]" />, end: false, papel: 'gestor' },
  { to: '/', label: 'Jornada', icon: <TrilhaIcon />, end: true, papel: 'colaborador', arvore: 'fase' },
  { to: '/guias', label: 'Guias', icon: <Icon name="menu_book" className="text-[18px]" />, end: false, arvore: 'modulo' },
  { to: '/configuracoes', label: 'Configurações', icon: <Icon name="settings" className="text-[18px]" />, end: false, filhosFixos: true },
  { to: '/admin', label: 'Admin', icon: <Icon name="build" className="text-[18px]" />, end: false, papel: 'gestor' },
  { to: '/chat', label: 'Assistente', icon: <Icon name="chat" className="text-[18px]" />, end: false },
]

// Filhos fixos de "Configurações" — "Chaves de API" só existe pro gestor (mesmo gate do back, ver
// Program.cs `/perfil/api-tokens` + a rota `/configuracoes/chaves` em SessaoAutenticada.tsx).
const CONFIG_FILHOS: { to: string; label: string; soGestor?: boolean }[] = [
  { to: '/perfil', label: 'Perfil' },
  { to: '/configuracoes/chaves', label: 'Chaves de API', soGestor: true },
]

type Galho = { chave: string; label: string; linkTo: string }

// Casca do app (logado): menu lateral fixo + header + área de conteúdo que troca por rota.
export function AppLayout() {
  const nome = useAuthStore((state) => state.usuario?.nome ?? '')
  const foto = useAuthStore((state) => state.usuario?.foto)
  const isGestor = useAuthStore((state) => state.usuario?.isGestor ?? false)
  const logout = useAuthStore((state) => state.logout)
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)
  const { montado: modalSaidaMontado, saindo: modalSaidaSaindo } = useSaida(confirmandoSaida)
  const status = useApiStatus()
  const location = useLocation()

  // Menu lateral ocultável — lembrado entre sessões (localStorage), não é estado de navegação.
  const [colapsado, setColapsado] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_MENU_COLAPSADO) === 'true'
    } catch {
      return false
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_MENU_COLAPSADO, String(colapsado))
    } catch {
      // sem storage disponível (ex.: aba privada) — só não persiste, sem quebrar a tela
    }
  }, [colapsado])

  // Colaborador não tem nada pra "escolher" em Configurações (só Perfil existe pra ele — Chaves de
  // API é só do gestor) — vira link direto pro Perfil, sem seta/dropdown, visão antiga de antes da
  // árvore existir. Gestor continua com a árvore de verdade (Perfil + Chaves de API).
  const itensMenuBase = NAV.filter(
    (item) => !item.papel || (item.papel === 'gestor' ? isGestor : !isGestor),
  ).map((item) => (item.to === '/configuracoes' && !isGestor ? { ...item, to: '/perfil', filhosFixos: false } : item))
  // Ordem pedida é diferente por papel (gestor: Configurações antes de Admin; colaborador:
  // Configurações por último) — não dá pra resolver só filtrando o array base (mesma posição pros
  // dois), então o colaborador reordena essa 1 entrada pro fim depois do filtro.
  const itensMenu = isGestor
    ? itensMenuBase
    : [
        ...itensMenuBase.filter((item) => item.label !== 'Configurações'),
        ...itensMenuBase.filter((item) => item.label === 'Configurações'),
      ]

  // Galhos da árvore: nomes de fase/módulo, na ordem que o back já devolve — carregados uma vez,
  // sem depender da página atual ter buscado isso (o menu é sempre visível).
  const [fases, setFases] = useState<string[]>([])
  const [modulos, setModulos] = useState<string[]>([])
  const [todosFluxos, setTodosFluxos] = useState<Fluxo[]>([])
  const [todosPassos, setTodosPassos] = useState<OnboardingStep[]>([])
  // Fica false até a 1ª resposta de `carregarArvore()` — enquanto isso, `fases`/`modulos` ainda
  // estão vazios (valor inicial), e usar isso direto pra decidir "mostra a seta de expandir?"
  // fazia ela aparecer/sumir de repente assim que o fetch resolvia, logo depois do login.
  const [arvoreCarregada, setArvoreCarregada] = useState(false)

  // FLIP pra animar o reordenar dos galhos (mesma técnica do `mover()` em SimpleEntityCrud.tsx):
  // guarda a posição de cada `<li>` ANTES de trocar o array, e um layout effect abaixo anima cada
  // um da posição antiga até a nova assim que o DOM já refletir a ordem certa.
  const refsGalhos = useRef(new Map<string, HTMLLIElement>())
  const posicoesGalhosAntes = useRef<Map<string, DOMRect> | null>(null)
  const pathnameAnteriorAdmin = useRef(location.pathname.startsWith('/admin'))

  function capturarPosicoesGalhos() {
    const rects = new Map<string, DOMRect>()
    refsGalhos.current.forEach((li, chave) => rects.set(chave, li.getBoundingClientRect()))
    posicoesGalhosAntes.current = rects
  }

  async function carregarArvore() {
    capturarPosicoesGalhos()
    try {
      const [steps, fluxos] = await Promise.all([listarSteps(), listarFluxos()])
      setTodosPassos(steps)
      setFases(distintosEmOrdem(steps, (s) => s.phase))
      setTodosFluxos(fluxos)
      setModulos(distintosEmOrdem(fluxos, (f) => f.modulo))
    } catch {
      // silencioso — o menu só não atualiza a árvore dessa vez, tenta de novo na próxima
    } finally {
      setArvoreCarregada(true)
    }
  }

  useEffect(() => {
    carregarArvore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // O menu lateral é um layout PERSISTENTE (não remonta ao navegar entre rotas), então a árvore de
  // fase/módulo carregada uma vez no mount ficava desatualizada se o admin reordenasse Fases/
  // Módulos numa aba do Admin — só se via a ordem nova recarregando a página inteira. Busca de
  // novo ao SAIR do Admin (não a cada navegação — seria fetch demais à toa).
  useEffect(() => {
    const veioDoAdmin = pathnameAnteriorAdmin.current
    const estaNoAdmin = location.pathname.startsWith('/admin')
    pathnameAnteriorAdmin.current = estaNoAdmin
    if (veioDoAdmin && !estaNoAdmin) carregarArvore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Cobre o caso de OUTRA sessão (gestor logado em outra aba/computador) editar Fase/Módulo — o
  // fix acima só pega a própria aba saindo do Admin. Busca de novo quando essa aba volta a ficar em
  // foco.
  useRefetchOnFocus(carregarArvore)

  useLayoutEffect(() => {
    const antes = posicoesGalhosAntes.current
    if (!antes) return
    posicoesGalhosAntes.current = null
    refsGalhos.current.forEach((li, chave) => {
      const rectAntes = antes.get(chave)
      if (!rectAntes) return
      const deltaY = rectAntes.top - li.getBoundingClientRect().top
      if (Math.abs(deltaY) < 1) return
      li.style.transition = 'none'
      li.style.transform = `translateY(${deltaY}px)`
      li.getBoundingClientRect() // força o navegador aplicar o transform acima antes da próxima linha
      requestAnimationFrame(() => {
        li.style.transition = 'transform 220ms ease-out'
        li.style.transform = ''
      })
    })
  }, [fases, modulos])

  // Um Fluxo pode ser aberto tanto de dentro de uma Fase (Jornada) quanto de um Módulo (Guias) — a
  // mesma marcação `state.deFase` já usada pro botão Voltar (ver FluxoDetalhePage) diz de qual dos
  // dois contextos o usuário veio, então o menu lateral consegue destacar a aba (e o galho) certos
  // mesmo estando "fora" das rotas /fase ou /guias de verdade.
  // `/supervisionado/:id` (o detalhe de um supervisionado) não começa com `/gestor` — a aba
  // "Supervisionados" (que É `/gestor`) ficava sem marcar enquanto o gestor olhava alguém.
  const emSupervisionado = location.pathname.startsWith('/supervisionado/')
  const emFluxo = location.pathname.startsWith('/fluxo/')
  const veioDaFaseNoFluxo = Boolean((location.state as { deFase?: boolean } | null)?.deFase)
  const tituloFluxoAtual = emFluxo
    ? decodeURIComponent(location.pathname.slice('/fluxo/'.length))
    : null
  const moduloDoFluxoAtual = tituloFluxoAtual
    ? todosFluxos.find((f) => f.titulo === tituloFluxoAtual)?.modulo
    : undefined

  // `/fase/:nome` também não bate com `to: '/'` (que é `end: true`) — e `/passo/:titulo` nem chega
  // perto de `/fase`, mas todo Passo mora dentro de uma fase (só o Fluxo é ambíguo entre os dois
  // contextos). A aba "Jornada" precisa marcar ativa nos dois, e o galho da fase certa no passo.
  const emFase = location.pathname.startsWith('/fase/')
  const emPasso = location.pathname.startsWith('/passo/')
  const tituloPassoAtual = emPasso
    ? decodeURIComponent(location.pathname.slice('/passo/'.length))
    : null
  const faseDoPassoAtual = tituloPassoAtual
    ? todosPassos.find((p) => p.title === tituloPassoAtual)?.phase
    : undefined

  const [expandido, setExpandido] = useState<Record<string, boolean>>({})

  // A que seção da árvore uma rota pertence (ou nenhuma). Usado só pra saber quando o usuário
  // ENTROU numa seção vindo de fora — não a cada navegação dentro dela. Um Fluxo entra na seção de
  // onde ele foi aberto (`viaFase`), não sempre em Guias.
  const regiaoDe = (pathname: string, viaFase: boolean): string | null => {
    if (pathname === '/' || pathname.startsWith('/fase') || pathname.startsWith('/passo')) return '/'
    if (pathname.startsWith('/fluxo')) return viaFase ? '/' : '/guias'
    if (pathname.startsWith('/guias')) return '/guias'
    return null
  }
  const regiaoAnterior = useRef<string | null>(null)

  // O botão "Ir pro Guia pelo sistema" (banner de Jornada completa) manda esse sinal via
  // `state` da navegação — é uma ação explícita de "me leva pra lá", diferente de navegação
  // incidental (por isso não muda a regra geral abaixo, que só fecha e nunca abre sozinha).
  useEffect(() => {
    if ((location.state as { expandirMenuGuias?: boolean } | null)?.expandirMenuGuias) {
      setExpandido((e) => ({ ...e, '/guias': true }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  // Ao TROCAR de seção (deep link, ou veio de outra aba), fecha sozinha a seção que ficou pra
  // trás — não abre mais a nova sozinha (isso causava um tremor visual no primeiro clique: abrir
  // e a lista de galhos empurrando o resto do menu na mesma hora). Quem quiser ver os galhos da
  // aba nova clica de novo, manualmente (ou na seta, ou na própria label).
  useEffect(() => {
    const atual = regiaoDe(location.pathname, veioDaFaseNoFluxo)
    const anterior = regiaoAnterior.current
    if (anterior && anterior !== atual) {
      setExpandido((e) => ({ ...e, [anterior]: false }))
    }
    regiaoAnterior.current = atual
  }, [location.pathname, veioDaFaseNoFluxo])

  return (
    <div className="relative flex h-screen overflow-hidden bg-navy-900 text-neutral-100">
      <aside
        className={cx(
          'relative flex shrink-0 flex-col gap-4 overflow-hidden border-r border-navy-700 bg-navy-800 p-4 transition-[width] duration-200',
          colapsado ? 'w-[72px] items-center' : 'w-60',
        )}
      >
        <CompassRose
          className="pointer-events-none absolute bottom-0 left-0 size-56 text-gold-500 opacity-[0.05]"
        />

        <div
          className={cx(
            'flex items-center border-b border-navy-700 px-2 pb-4 pt-1',
            colapsado ? 'px-0' : 'gap-2',
          )}
        >
          <CompassRose className="size-6 shrink-0 text-gold-400" />
          <span
            className={cx(
              'overflow-hidden whitespace-nowrap text-lg font-bold transition-all duration-200',
              colapsado ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100',
            )}
          >
            Bússola
          </span>
        </div>

        {/* Só a lista de navegação rola (min-h-0 é o que deixa o flex-1 respeitar o espaço
            disponível em vez de crescer) — o `<aside>` em si não tem overflow-y, senão a marca
            d'água decorativa (que sangra além da borda de propósito) contava como conteúdo
            "fora da área visível" e fazia o navegador desenhar uma barra de rolagem à toa. */}
        <nav className="flex w-full min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
          {itensMenu.map((item) => {
            const galhos: Galho[] = item.filhosFixos
              ? CONFIG_FILHOS.filter((f) => !f.soGestor || isGestor).map((f) => ({
                  chave: `config:${f.to}`,
                  label: f.label,
                  linkTo: f.to,
                }))
              : !arvoreCarregada
                ? []
                : (item.arvore === 'fase' ? fases : item.arvore === 'modulo' ? modulos : []).map((nome) => ({
                    chave: `${item.arvore}:${nome}`,
                    label: nome,
                    linkTo: `${item.arvore === 'fase' ? '/fase' : '/guias'}/${encodeURIComponent(nome)}`,
                  }))
            const aberto = expandido[item.to] ?? false
            // Dentro de um Fluxo não existe rota /fase ou /guias pra casar de verdade — força a
            // aba de origem (Jornada ou Guias) como ativa, igual o usuário esperaria vendo a URL.
            // "Perfil" também não fica sob /configuracoes de verdade — mesma ideia, força o galho
            // pai a marcar ativo mesmo com a URL "fora" da árvore.
            const ativoForcado =
              (item.to === '/' && ((emFluxo && veioDaFaseNoFluxo) || emFase || emPasso)) ||
              (item.to === '/guias' && emFluxo && !veioDaFaseNoFluxo) ||
              (item.to === '/gestor' && emSupervisionado) ||
              (item.to === '/configuracoes' && location.pathname === '/perfil')

            return (
              <div key={item.to}>
                <div className="flex items-center gap-1">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    title={colapsado ? item.label : undefined}
                    onClick={
                      galhos.length > 0 && !colapsado
                        ? () => setExpandido((e) => ({ ...e, [item.to]: !aberto }))
                        : undefined
                    }
                    onDoubleClick={
                      colapsado
                        ? () => {
                            setColapsado(false)
                            if (galhos.length > 0) setExpandido((e) => ({ ...e, [item.to]: true }))
                          }
                        : undefined
                    }
                    className={({ isActive }) =>
                      cx(
                        'flex items-center rounded-lg text-sm transition-colors',
                        colapsado ? 'size-10 shrink-0 justify-center' : 'flex-1 gap-3 px-3 py-2',
                        isActive || ativoForcado
                          ? 'bg-gold-500/10 text-gold-400'
                          : 'text-neutral-400 hover:bg-navy-700 hover:text-neutral-200',
                      )
                    }
                  >
                    <span>{item.icon}</span>
                    <span
                      className={cx(
                        'overflow-hidden whitespace-nowrap transition-all duration-200',
                        colapsado ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100',
                      )}
                    >
                      {item.label}
                    </span>
                  </NavLink>
                  {!colapsado && galhos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpandido((e) => ({ ...e, [item.to]: !aberto }))}
                      aria-label={aberto ? 'Recolher' : 'Expandir'}
                      className="px-2 text-neutral-600 transition-colors hover:text-neutral-300"
                    >
                      <Icon
                        name="chevron_right"
                        className={cx('text-base transition-transform duration-200', aberto && 'rotate-90')}
                      />
                    </button>
                  )}
                </div>

                {/* Grid-rows em vez de montar/desmontar o <ul> na hora — o truque de "0fr → 1fr"
                    dá uma transição suave de altura sem precisar medir pixel nenhum (só Tailwind,
                    sem CSS próprio). O padding/gap fica DENTRO do <ul> (não no grid pai), assim ele
                    encolhe junto com a linha em vez de deixar um respiro fixo quando fechado. */}
                {!colapsado && galhos.length > 0 && (
                  <div
                    className={cx(
                      'ml-4 grid border-l border-navy-700 pl-3 transition-[grid-template-rows] duration-200 ease-out',
                      aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                    )}
                  >
                    <ul className="flex flex-col gap-0.5 overflow-hidden py-1">
                      {galhos.map((galho) => {
                        const galhoForcado =
                          (item.to === '/guias' &&
                            emFluxo &&
                            !veioDaFaseNoFluxo &&
                            galho.label === moduloDoFluxoAtual) ||
                          (item.to === '/' &&
                            emFluxo &&
                            veioDaFaseNoFluxo &&
                            galho.label === FASE_FLUXO_NA_JORNADA) ||
                          (item.to === '/' && emPasso && galho.label === faseDoPassoAtual)
                        const ativo = location.pathname === galho.linkTo || galhoForcado
                        return (
                          <li
                            key={galho.chave}
                            ref={(el) => {
                              if (el) refsGalhos.current.set(galho.chave, el)
                              else refsGalhos.current.delete(galho.chave)
                            }}
                          >
                            <Link
                              to={galho.linkTo}
                              className={cx(
                                'block truncate rounded-lg px-2 py-1 text-xs transition-colors',
                                ativo
                                  ? 'text-gold-400'
                                  : 'text-neutral-500 hover:text-neutral-200',
                              )}
                            >
                              {galho.label}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

      </aside>

      {/* Botão de recolher na própria borda entre o menu e o conteúdo — meio da tela, discreto,
          igual o do Explorer do VSCode — em vez de um botão de texto ocupando linha lá embaixo. */}
      <button
        type="button"
        onClick={() => setColapsado((v) => !v)}
        title={colapsado ? 'Expandir menu' : 'Recolher menu'}
        className={cx(
          'absolute top-1/2 z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-navy-600 bg-navy-800 text-neutral-400 shadow-md transition-[left,color,border-color] duration-200 hover:border-gold-500/50 hover:text-gold-400',
          colapsado ? 'left-[72px]' : 'left-60',
        )}
      >
        <Icon
          name="chevron_left"
          className={cx('text-sm transition-transform duration-200', colapsado && 'rotate-180')}
        />
      </button>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-navy-700 bg-gradient-to-r from-navy-800 via-navy-800/70 to-navy-900 px-6">
          {/* overflow-hidden fica só aqui, contendo a marca d'água que sangra pra fora — não no
              header inteiro, senão corta o dropdown de notificação, que precisa abrir PRA FORA
              da faixa de 64px do header. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <CompassRose className="absolute -right-6 -top-10 size-32 text-gold-500 opacity-[0.07]" />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"
            aria-hidden="true"
          />
          <span className="flex items-center gap-1.5 rounded-full border border-navy-700 bg-navy-800 px-3 py-1 text-xs text-neutral-500">
            <span
              className={cx(
                'size-1.5 rounded-full',
                status === 'ok' && 'bg-green-400',
                status === 'offline' && 'bg-red-400',
                status === 'checando' && 'bg-neutral-500',
              )}
            />
            API{' '}
            <strong
              className={cx(
                'font-medium',
                status === 'ok' && 'text-green-400',
                status === 'offline' && 'text-red-400',
                status === 'checando' && 'text-neutral-400',
              )}
            >
              {status === 'checando' ? '...' : status}
            </strong>
          </span>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <NavLink
              to="/perfil"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-navy-700"
            >
              <Avatar nome={nome} foto={foto} className="size-8 text-xs" />
              <span className="text-sm text-neutral-200">{nome}</span>
            </NavLink>
            <span className="h-6 w-px bg-navy-700" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setConfirmandoSaida(true)}
              className="flex items-center gap-1 text-sm text-gold-400 hover:text-gold-300"
            >
              <Icon name="logout" className="text-base" /> Sair
            </button>
          </div>
        </header>

        {status === 'offline' && (
          <div className="anim-fade flex items-center justify-center gap-2 bg-red-500/15 px-4 py-1.5 text-center text-xs text-red-300">
            <Icon name="warning" className="text-sm" />
            Sem conexão com o servidor. Tentando reconectar…
          </div>
        )}

        {/* overflow-x-hidden explícito: só `overflow-y-auto` faz o navegador computar o eixo X
            como auto sozinho (regra da especificação do CSS) — qualquer marca d'água decorativa
            que sangre um pouco pra fora da coluna central acabaria desenhando uma barra de
            rolagem horizontal à toa (mesma causa do bug das setinhas no menu lateral). */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <div key={location.pathname} className="anim-page flex w-full justify-center">
            <Outlet />
          </div>
        </main>
      </div>

      {modalSaidaMontado && (
        <div
          className={cx(
            'fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4',
            modalSaidaSaindo ? 'anim-fade-out' : 'anim-fade',
          )}
          onClick={() => setConfirmandoSaida(false)}
        >
          <div
            className={cx(
              'flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6',
              modalSaidaSaindo ? 'anim-pop-out' : 'anim-pop',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-neutral-100">Sair do Bússola?</h2>
              <p className="text-sm text-neutral-400">
                Tem certeza que deseja sair do Bússola?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoSaida(false)}
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-400"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
