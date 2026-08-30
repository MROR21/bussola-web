import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { EstadoErro } from '../components/EstadoErro'
import { getFluxosConcluidos, listarFluxos } from '../features/fluxos/fluxosService'
import type { Fluxo } from '../features/fluxos/types'

// Emoji por módulo (fallback 🧩 = "peça/módulo") — dá mais cara de módulo que uma pastinha.
const MODULO_EMOJI: Record<string, string> = {
  'Mão de Obra': '👷',
  'Básico do dev': '🛠️',
  'Quiz Quality': '🔍',
  'Agilean (desktop)': '🖥️',
}
const emojiDoModulo = (m: string) => MODULO_EMOJI[m] ?? '🧩'

// Guia pelo sistema (referência viva): módulos em cards → entra → fluxos dentro (+ busca global).
// Aberto a qualquer colaborador logado, gestor ou não — não há mais atribuição individual: o
// fluxo do próprio squad já entra como parte da Jornada; aqui é a consulta livre de tudo.
export function FluxosPage() {
  const [fluxos, setFluxos] = useState<Fluxo[]>([])
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)
  // O módulo aberto vive no PATH (/fluxos/:modulo) — mesmo padrão da Jornada: assim o "voltar" (do
  // navegador ou ao sair de um fluxo) retorna pro módulo certo, não pro topo do guia. `destaque`
  // continua um parâmetro de busca (é um deep-link de notificação, não "onde" você está).
  const { modulo: moduloParam } = useParams<{ modulo?: string }>()
  const moduloSelecionado = moduloParam ?? null
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const destaqueParam = searchParams.get('destaque')
  const entrarModulo = (modulo: string) => navigate(`/fluxos/${encodeURIComponent(modulo)}`)
  const sairModulo = () => navigate('/fluxos')
  const [destacado, setDestacado] = useState<string | null>(null)

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
      navigate(`/fluxos/${encodeURIComponent(alvo.modulo)}?destaque=${destaqueParam}`, {
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
    // "Básico do dev" sempre por último → o módulo do squad aparece primeiro.
    return [...grupos.entries()].sort(
      (a, b) => Number(a[0] === 'Básico do dev') - Number(b[0] === 'Básico do dev'),
    )
  }, [fluxos])

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
          to={`/fluxo/${fluxo.id}`}
          className={
            'flex flex-col gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-500/50' +
            (destacado === fluxo.id ? ' animate-pulse ring-2 ring-purple-400' : '')
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-neutral-100">{fluxo.titulo}</span>
            {fluxo.videoUrl && <span title="Tem vídeo">🎬</span>}
            {concluidos.has(fluxo.id) && (
              <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">
                ✓ Concluído
              </span>
            )}
            {!ocultarTag && fluxo.categoria && (
              <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                {fluxo.categoria}
              </span>
            )}
          </div>
          <span className="text-sm text-neutral-400">{fluxo.descricao}</span>
        </Link>
      </li>
    )
  }

  if (loading) return <p className="text-neutral-400">Carregando o guia...</p>
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
      <div className="flex w-full max-w-2xl flex-col gap-5">
        <button
          type="button"
          onClick={sairModulo}
          className="self-start text-sm text-neutral-400 hover:text-neutral-200"
        >
          ← Voltar pros módulos
        </button>
        <h1 className="text-2xl font-bold text-neutral-100">{moduloSelecionado}</h1>
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
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-100">🖥️ Guia pelo sistema</h1>
        <p className="text-sm text-neutral-400">
          Consulte qualquer fluxo do sistema, de qualquer squad, quando precisar.
        </p>
        {fluxos.length > 0 && (
          <p className="text-xs text-neutral-500">
            {feitos} de {fluxos.length} concluídos
          </p>
        )}
      </header>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar fluxo..."
        className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
      />

      {buscando ? (
        resultadosBusca.length === 0 ? (
          <p className="text-neutral-500">Nenhum fluxo encontrado.</p>
        ) : (
          <ul className="flex flex-col gap-2">{resultadosBusca.map((f) => itemFluxo(f))}</ul>
        )
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {porModulo.map(([modulo, itens]) => {
            const feitosMod = itens.filter((f) => concluidos.has(f.id)).length
            const pct = itens.length > 0 ? Math.round((feitosMod / itens.length) * 100) : 0
            return (
              <button
                key={modulo}
                type="button"
                onClick={() => entrarModulo(modulo)}
                className="flex flex-col gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-500/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{emojiDoModulo(modulo)}</span>
                  <span className="text-neutral-600">›</span>
                </div>
                <h3 className="font-semibold text-neutral-100">{modulo}</h3>
                <span className="text-sm text-neutral-500">
                  {feitosMod} de {itens.length} concluídos
                </span>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
