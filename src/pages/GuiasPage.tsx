import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CompassRose } from '../components/CompassRose'
import { EstadoErro } from '../components/EstadoErro'
import { Icon } from '../components/Icon'
import { MapCorners } from '../components/MapCorners'
import { MapIllustration } from '../components/MapIllustration'
import { Carregando } from '../components/Spinner'
import { useTitulo } from '../hooks/useTitulo'
import { getFluxosConcluidos, listarFluxos } from '../features/fluxos/fluxosService'
import type { Fluxo } from '../features/fluxos/types'

// Ícone por módulo (fallback "extension" = peça/módulo genérico).
const MODULO_ICONE: Record<string, string> = {
  'Mão de Obra': 'engineering',
  'Básico do dev': 'handyman',
  'Quiz Quality': 'quiz',
  'Agilean (desktop)': 'desktop_windows',
}
const iconeDoModulo = (m: string) => MODULO_ICONE[m] ?? 'extension'

// Tópico é só um agrupamento VISUAL por cima dos Módulos que já existem (sem entidade/migration
// nova) — todo módulo cai em "Fluxos do sistema" por padrão, exceto os listados aqui.
const TOPICO_POR_MODULO: Record<string, string> = {
  'Básico do dev': 'Padrões do sistema',
}
const TOPICO_PADRAO = 'Fluxos do sistema'
const topicoDoModulo = (m: string) => TOPICO_POR_MODULO[m] ?? TOPICO_PADRAO
// "Fluxos do sistema" sempre lidera; "Padrões do sistema" (e qualquer outro tópico futuro) depois.
const pesoTopico = (t: string) => (t === TOPICO_PADRAO ? '' : t)

// Guia pelo sistema (referência viva): módulos em cards, agrupados por Tópico → entra → fluxos
// dentro (+ busca global). Aberto a qualquer colaborador logado, gestor ou não — não há mais
// atribuição individual: o fluxo do próprio squad já entra como parte da Jornada; aqui é a
// consulta livre de tudo.
export function GuiasPage() {
  const [fluxos, setFluxos] = useState<Fluxo[]>([])
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)
  // O módulo aberto vive no PATH (/guias/:modulo) — mesmo padrão da Jornada: assim o "voltar" (do
  // navegador ou ao sair de um fluxo) retorna pro módulo certo, não pro topo do guia. `destaque`
  // continua um parâmetro de busca (é um deep-link de notificação, não "onde" você está).
  const { modulo: moduloParam } = useParams<{ modulo?: string }>()
  const moduloSelecionado = moduloParam ?? null
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const destaqueParam = searchParams.get('destaque')
  const entrarModulo = (modulo: string) => navigate(`/guias/${encodeURIComponent(modulo)}`)
  const sairModulo = () => navigate('/guias')
  const [destacado, setDestacado] = useState<string | null>(null)

  useTitulo(moduloSelecionado ?? 'Guia pelo sistema')

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    setError(null)
    Promise.all([listarFluxos(), getFluxosConcluidos()])
      .then(([f, ids]) => {
        if (cancelado) return
        setFluxos(f)
        setConcluidos(new Set(ids))
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'Erro ao carregar os fluxos')
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [tentativa])

  // Notificação (?destaque=): entra no módulo do fluxo e marca ele pra pulsar. Se ainda não estiver
  // no módulo certo, navega pra lá levando o `destaque` junto na URL nova — assim funciona igual
  // independente de o componente remontar ou não nessa navegação.
  useEffect(() => {
    if (!destaqueParam || loading) return
    const alvo = fluxos.find((f) => f.id === destaqueParam)
    if (!alvo) return
    if (moduloSelecionado !== alvo.modulo) {
      navigate(`/guias/${encodeURIComponent(alvo.modulo)}?destaque=${destaqueParam}`, {
        replace: true,
      })
      return
    }
    setDestacado(destaqueParam)
  }, [destaqueParam, loading, fluxos, moduloSelecionado, navigate])

  // Depois de entrar no módulo, rola até o fluxo e pulsa a borda por alguns segundos.
  useEffect(() => {
    if (!destacado) return
    const rolar = setTimeout(() => {
      document.getElementById(`fluxo-${destacado}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 60)
    const limpar = setTimeout(() => setDestacado(null), 4000)
    return () => {
      clearTimeout(rolar)
      clearTimeout(limpar)
    }
  }, [destacado, moduloSelecionado])

  const feitos = fluxos.filter((f) => concluidos.has(f.id)).length

  const porModulo = useMemo(() => {
    const grupos = new Map<string, Fluxo[]>()
    for (const fluxo of fluxos) {
      const lista = grupos.get(fluxo.modulo) ?? []
      lista.push(fluxo)
      grupos.set(fluxo.modulo, lista)
    }
    return [...grupos.entries()]
  }, [fluxos])

  // Agrupa os módulos (já com seus fluxos) por Tópico — "Fluxos do sistema" sempre primeiro,
  // "Padrões do sistema" (Básico do dev) depois. Puramente visual, não vem do back.
  const porTopico = useMemo(() => {
    const grupos = new Map<string, [string, Fluxo[]][]>()
    for (const entrada of porModulo) {
      const topico = topicoDoModulo(entrada[0])
      const lista = grupos.get(topico) ?? []
      lista.push(entrada)
      grupos.set(topico, lista)
    }
    return [...grupos.entries()].sort((a, b) => pesoTopico(a[0]).localeCompare(pesoTopico(b[0]), 'pt'))
  }, [porModulo])

  const resultadosBusca = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return []
    return fluxos.filter((f) =>
      `${f.titulo} ${f.descricao} ${f.categoria} ${f.modulo}`.toLowerCase().includes(q),
    )
  }, [busca, fluxos])

  // Um item de fluxo (card com link), reusado na busca e dentro do módulo.
  // ocultarTag: esconde o chip da categoria quando o item já está sob o cabeçalho da tag.
  function itemFluxo(fluxo: Fluxo, ocultarTag = false) {
    return (
      <li key={fluxo.id} id={`fluxo-${fluxo.id}`}>
        <Link
          to={`/fluxo/${encodeURIComponent(fluxo.titulo)}`}
          className={
            'relative flex flex-col gap-1 rounded-xl border border-navy-700 bg-navy-800 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-500/50' +
            (destacado === fluxo.id ? ' animate-pulse ring-2 ring-gold-400' : '')
          }
        >
          <MapCorners tamanho={3} opacidade={15} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-neutral-100">{fluxo.titulo}</span>
            {fluxo.videoUrl && (
              <Icon name="smart_display" className="text-base text-neutral-400" title="Tem vídeo" />
            )}
            {concluidos.has(fluxo.id) && (
              <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">
                <Icon name="check" className="text-sm" /> Concluído
              </span>
            )}
            {!ocultarTag && fluxo.categoria && (
              <span className="rounded-full bg-navy-700 px-2 py-0.5 text-xs text-neutral-400">
                {fluxo.categoria}
              </span>
            )}
          </div>
          <span className="text-sm text-neutral-400">{fluxo.descricao}</span>
        </Link>
      </li>
    )
  }

  if (loading) return <Carregando texto="Carregando o guia..." />
  if (error) return <EstadoErro onRetry={() => setTentativa((t) => t + 1)} />

  // ---- Dentro de um módulo ----
  if (moduloSelecionado) {
    const itens = porModulo.find(([m]) => m === moduloSelecionado)?.[1] ?? []

    // Agrupa por tag (categoria) pra organizar por tópico. Se o módulo só tem uma tag
    // (ex.: os de "Sistema"), mostra lista simples — sem cabeçalho redundante.
    const porTag = new Map<string, Fluxo[]>()
    for (const f of itens) {
      const tag = f.categoria || 'Outros'
      const lista = porTag.get(tag) ?? []
      lista.push(f)
      porTag.set(tag, lista)
    }
    // "Visão geral" sempre lidera; o resto em ordem alfabética.
    const pesoTag = (t: string) => (t === 'Visão geral' ? '' : t)
    const grupos = [...porTag.entries()].sort((a, b) =>
      pesoTag(a[0]).localeCompare(pesoTag(b[0]), 'pt'),
    )

    return (
      <div className="anim-fade flex w-full max-w-2xl flex-col gap-5">
        <button
          type="button"
          onClick={sairModulo}
          className="flex items-center gap-1 self-start text-sm text-neutral-400 transition-colors hover:text-neutral-200"
        >
          <Icon name="arrow_back" className="text-base" /> Voltar pros módulos
        </button>
        <div className="relative overflow-hidden rounded-2xl border border-navy-700 bg-navy-800 p-5">
          <MapCorners tamanho={5} opacidade={30} />
          <MapIllustration className="pointer-events-none absolute -bottom-6 -right-4 w-40 text-gold-500 opacity-[0.06]" />
          <div className="relative flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-400">
              <Icon name={iconeDoModulo(moduloSelecionado)} className="text-2xl" />
            </span>
            <h1 className="text-2xl font-bold text-neutral-100">{moduloSelecionado}</h1>
          </div>
        </div>
        {grupos.length > 1 ? (
          <div className="flex flex-col gap-6">
            {grupos.map(([tag, fluxosTag]) => (
              <section key={tag} className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  {tag}
                </h2>
                <ul className="flex flex-col gap-2">
                  {fluxosTag.map((f) => itemFluxo(f, true))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">{itens.map((f) => itemFluxo(f))}</ul>
        )}
      </div>
    )
  }

  const buscando = busca.trim().length > 0

  // ---- Lista de módulos (cards) + busca global ----
  return (
    <div className="anim-fade flex w-full max-w-2xl flex-col gap-6">
      <header className="relative overflow-hidden rounded-3xl border border-navy-700 bg-navy-800 p-6 shadow-xl shadow-black/20">
        <MapCorners />
        <CompassRose
          className="pointer-events-none absolute -bottom-8 -right-8 size-32 text-gold-500 opacity-[0.06]"
        />
        <MapIllustration className="pointer-events-none absolute -left-8 -top-6 w-48 text-gold-500 opacity-[0.05]" />
        <div className="relative flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-100">
            <Icon name="menu_book" className="text-2xl text-gold-400" /> Guia pelo sistema
          </h1>
          <p className="text-sm text-neutral-400">
            Consulte qualquer fluxo do sistema, de qualquer squad, quando precisar.
          </p>
          {fluxos.length > 0 && (
            <p className="text-xs text-neutral-500">
              {feitos} de {fluxos.length} concluídos
            </p>
          )}
        </div>
      </header>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar fluxo..."
        className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
      />

      {buscando ? (
        resultadosBusca.length === 0 ? (
          <p className="anim-fade text-neutral-500">Nenhum fluxo encontrado.</p>
        ) : (
          <ul className="anim-fade flex flex-col gap-2">{resultadosBusca.map((f) => itemFluxo(f))}</ul>
        )
      ) : (
        <div className="anim-fade flex flex-col gap-6">
          {porTopico.map(([topico, modulos]) => (
            <section key={topico} className="flex flex-col gap-3">
              {porTopico.length > 1 && (
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  {topico}
                </h2>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {modulos.map(([modulo, itens]) => {
                  const feitosMod = itens.filter((f) => concluidos.has(f.id)).length
                  const pct = itens.length > 0 ? Math.round((feitosMod / itens.length) * 100) : 0
                  return (
                    <button
                      key={modulo}
                      type="button"
                      onClick={() => entrarModulo(modulo)}
                      className="relative flex flex-col gap-2 rounded-2xl border border-navy-700 bg-navy-800 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-500/50"
                    >
                      <MapCorners tamanho={4} opacidade={20} />
                      <div className="flex items-center justify-between">
                        <Icon name={iconeDoModulo(modulo)} className="text-2xl text-gold-400" />
                        <Icon name="chevron_right" className="text-neutral-600" />
                      </div>
                      <h3 className="font-semibold text-neutral-100">{modulo}</h3>
                      <span className="text-sm text-neutral-500">
                        {feitosMod} de {itens.length} concluídos
                      </span>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-700">
                        <div
                          className="h-full rounded-full bg-gold-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
