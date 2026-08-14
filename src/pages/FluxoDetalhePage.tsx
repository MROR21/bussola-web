import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EstadoErro } from '../components/EstadoErro'
import { Markdown } from '../components/Markdown'
import { cx } from '../utils/cx'
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
  const [fluxo, setFluxo] = useState<Fluxo | null>(null)
  const [concluido, setConcluido] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)

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

  if (loading) return <p className="text-neutral-400">Carregando o fluxo...</p>
  if (error) return <EstadoErro onRetry={() => setTentativa((t) => t + 1)} />
  if (!fluxo) return null

  return (
    <article className="flex w-full max-w-2xl flex-col gap-5">
      {/* Volta no histórico (não um destino fixo) — quem entrou pela Jornada (fase "Conheça o
          sistema") retorna pra lá; quem entrou pelo Guia retorna pro Guia. */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="self-start text-sm text-neutral-400 hover:text-neutral-200"
      >
        ← Voltar
      </button>

      <header className="flex flex-col gap-1">
        <span className="text-sm text-neutral-500">{fluxo.categoria}</span>
        <h1 className="text-2xl font-bold text-neutral-100">{fluxo.titulo}</h1>
      </header>

      {fluxo.videoUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-neutral-800">
          <iframe
            src={paraEmbed(fluxo.videoUrl)}
            title={fluxo.titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="size-full"
          />
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 leading-relaxed">
        <Markdown>{fluxo.conteudo}</Markdown>
      </div>

      <button
        type="button"
        onClick={toggle}
        className={cx(
          'self-start rounded-lg px-4 py-2 text-sm font-medium transition-colors',
          concluido
            ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            : 'bg-purple-500 text-white hover:bg-purple-400',
        )}
      >
        {concluido ? '✓ Concluído · desmarcar' : 'Marcar como concluído'}
      </button>
    </article>
  )
}
