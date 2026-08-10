import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarFluxos } from '../features/fluxos/fluxosService'
import type { Fluxo } from '../features/fluxos/types'

// Referência viva: lista de fluxos do dia a dia, buscável, agrupada por categoria.
export function FluxosPage() {
  const [fluxos, setFluxos] = useState<Fluxo[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    listarFluxos()
      .then((f) => {
        if (!cancelado) setFluxos(f)
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
  }, [])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return fluxos
    return fluxos.filter((f) =>
      `${f.titulo} ${f.descricao} ${f.categoria} ${f.modulo}`.toLowerCase().includes(q),
    )
  }, [busca, fluxos])

  const porModulo = useMemo(() => {
    const grupos = new Map<string, Fluxo[]>()
    for (const fluxo of filtrados) {
      const lista = grupos.get(fluxo.modulo) ?? []
      lista.push(fluxo)
      grupos.set(fluxo.modulo, lista)
    }
    return [...grupos.entries()]
  }, [filtrados])

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-100">📚 Fluxos</h1>
        <p className="text-sm text-neutral-400">
          Consulte qualquer fluxo do dia a dia, quando precisar.
        </p>
      </header>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar fluxo..."
        className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
      />

      {loading && <p className="text-neutral-400">Carregando fluxos...</p>}
      {error && <p className="text-red-400">Erro: {error}</p>}
      {!loading && !error && filtrados.length === 0 && (
        <p className="text-neutral-500">Nenhum fluxo encontrado.</p>
      )}

      {porModulo.map(([modulo, itens]) => (
        <section key={modulo} className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {modulo}
            <span className="font-normal normal-case text-neutral-600">({itens.length})</span>
          </h2>
          <ul className="flex flex-col gap-2">
            {itens.map((fluxo) => (
              <li key={fluxo.id}>
                <Link
                  to={`/fluxo/${fluxo.id}`}
                  className="flex flex-col gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-purple-500/50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-neutral-100">{fluxo.titulo}</span>
                    {fluxo.videoUrl && <span title="Tem vídeo">🎬</span>}
                    {fluxo.categoria && (
                      <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                        {fluxo.categoria}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-neutral-400">{fluxo.descricao}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
