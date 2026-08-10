import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Markdown } from '../components/Markdown'
import { getFluxo } from '../features/fluxos/fluxosService'
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
  const [fluxo, setFluxo] = useState<Fluxo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    setError(null)
    getFluxo(id)
      .then((f) => {
        if (!cancelado) setFluxo(f)
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
  }, [id])

  if (loading) return <p className="text-neutral-400">Carregando o fluxo...</p>
  if (error) return <p className="text-red-400">Erro: {error}</p>
  if (!fluxo) return null

  return (
    <article className="flex w-full max-w-2xl flex-col gap-5">
      <Link to="/fluxos" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← Voltar pros fluxos
      </Link>

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
    </article>
  )
}
