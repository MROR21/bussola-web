import { useEffect, useMemo, useState } from 'react'
import {
  atribuirFluxo,
  desvincularFluxo,
  getAtribuicoes,
  listarFluxos,
} from '../features/fluxos/fluxosService'
import type { Atribuicao, Fluxo } from '../features/fluxos/types'
import { getUsuariosProgresso } from '../features/gestor/gestorService'
import type { UsuarioProgresso } from '../features/gestor/types'

// Aba Fluxos na visão do gestor: todos os fluxos (todos os squads), quem já tem cada um,
// e um modal pra atribuir o fluxo a um supervisionado (excluindo quem já o tem).
export function FluxosGestor() {
  const [fluxos, setFluxos] = useState<Fluxo[]>([])
  const [atribuicoes, setAtribuicoes] = useState<Atribuicao[]>([])
  const [supervisionados, setSupervisionados] = useState<UsuarioProgresso[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalFluxo, setModalFluxo] = useState<Fluxo | null>(null)
  const [toast, setToast] = useState<{ texto: string; ok: boolean } | null>(null)
  const [confirmando, setConfirmando] = useState<{ fluxo: Fluxo; atrib: Atribuicao } | null>(null)

  async function carregar() {
    setError(null)
    try {
      const [fs, ats, sups] = await Promise.all([
        listarFluxos(),
        getAtribuicoes(),
        getUsuariosProgresso(),
      ])
      setFluxos(fs)
      setAtribuicoes(ats)
      setSupervisionados(sups)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar os fluxos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // O toast some sozinho depois de alguns segundos.
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function atribuir(fluxo: Fluxo, supervisionado: UsuarioProgresso) {
    try {
      await atribuirFluxo(fluxo.id, supervisionado.id)
      setModalFluxo(null)
      setToast({ texto: `"${fluxo.titulo}" liberado para ${supervisionado.nome}`, ok: true })
      await carregar()
    } catch (e) {
      setToast({ texto: e instanceof Error ? e.message : 'Erro ao atribuir', ok: false })
    }
  }

  async function desvincular(fluxo: Fluxo, atrib: Atribuicao) {
    try {
      await desvincularFluxo(fluxo.id, atrib.usuarioId)
      setToast({ texto: `"${fluxo.titulo}" removido de ${atrib.nome}`, ok: true })
      await carregar()
    } catch (e) {
      setToast({ texto: e instanceof Error ? e.message : 'Erro ao remover', ok: false })
    }
  }

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
    return [...grupos.entries()].sort(
      (a, b) => Number(a[0] === 'Básico do dev') - Number(b[0] === 'Básico do dev'),
    )
  }, [filtrados])

  // Um supervisionado "tem" o fluxo se: é Básico (squad null), é do squad dele, ou foi atribuído.
  const jaTem = (fluxo: Fluxo, sup: UsuarioProgresso) =>
    fluxo.squad == null ||
    fluxo.squad === sup.squad ||
    atribuicoes.some((a) => a.fluxoId === fluxo.id && a.usuarioId === sup.id)

  // Tem alguém pra receber esse fluxo? (Se todos os supervisionados já têm, não dá pra atribuir.)
  const temParaAtribuir = (fluxo: Fluxo) => supervisionados.some((s) => !jaTem(fluxo, s))

  const disponiveisParaModal = modalFluxo
    ? supervisionados.filter((s) => !jaTem(modalFluxo, s))
    : []

  if (loading) return <p className="text-neutral-400">Carregando os fluxos...</p>
  if (error) return <p className="text-red-400">Erro: {error}</p>

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-100">📚 Fluxos</h1>
        <p className="text-sm text-neutral-400">
          Libere um fluxo de qualquer squad para um supervisionado seu.
        </p>
      </header>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar fluxo..."
        className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
      />

      {porModulo.map(([modulo, itens]) => (
        <section key={modulo} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {modulo}
          </h2>
          <ul className="flex flex-col gap-2">
            {itens.map((fluxo) => {
              const atribuidos = atribuicoes.filter((a) => a.fluxoId === fluxo.id)
              return (
                <li
                  key={fluxo.id}
                  className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col">
                      <span className="font-medium text-neutral-100">{fluxo.titulo}</span>
                      <span className="text-sm text-neutral-400">{fluxo.descricao}</span>
                    </div>
                    {temParaAtribuir(fluxo) ? (
                      <button
                        type="button"
                        onClick={() => setModalFluxo(fluxo)}
                        className="shrink-0 rounded-lg bg-purple-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-400"
                      >
                        + Atribuir
                      </button>
                    ) : (
                      <span className="shrink-0 text-xs text-neutral-500">
                        Atribuído a todos os supervisionados
                      </span>
                    )}
                  </div>
                  {atribuidos.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-neutral-500">Atribuído a:</span>
                      {atribuidos.map((a) => (
                        <span
                          key={a.usuarioId}
                          className="flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-200"
                        >
                          {a.nome}
                          <button
                            type="button"
                            onClick={() => setConfirmando({ fluxo, atrib: a })}
                            aria-label={`Remover ${a.nome}`}
                            className="text-purple-300 hover:text-white"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {modalFluxo && (
        <div
          className="anim-fade fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setModalFluxo(null)}
        >
          <div
            className="anim-pop flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-neutral-800 px-5 py-3">
              <span className="min-w-0 truncate font-semibold text-neutral-100">
                Atribuir: {modalFluxo.titulo}
              </span>
              <button
                type="button"
                onClick={() => setModalFluxo(null)}
                aria-label="Fechar"
                className="text-neutral-400 hover:text-neutral-100"
              >
                ✕
              </button>
            </header>
            <div className="max-h-[60vh] overflow-y-auto p-3">
              {disponiveisParaModal.length === 0 ? (
                <p className="px-2 py-4 text-center text-sm text-neutral-500">
                  Todos os seus supervisionados já têm esse fluxo.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {disponiveisParaModal.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => atribuir(modalFluxo, s)}
                        className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-neutral-800"
                      >
                        <span className="text-neutral-100">{s.nome}</span>
                        <span className="text-xs text-neutral-500">{s.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmando && (
        <div
          className="anim-fade fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setConfirmando(null)}
        >
          <div
            className="anim-pop flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-neutral-100">Desvincular fluxo?</h2>
              <p className="text-sm text-neutral-400">
                Tem certeza que deseja desatribuir "{confirmando.fluxo.titulo}" de{' '}
                {confirmando.atrib.nome}?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmando(null)}
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  desvincular(confirmando.fluxo, confirmando.atrib)
                  setConfirmando(null)
                }}
                className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Desvincular
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={
            'anim-pop fixed bottom-4 right-4 z-30 rounded-xl border bg-neutral-900 px-4 py-3 text-sm shadow-lg ' +
            (toast.ok ? 'border-green-500/40 text-green-300' : 'border-red-500/40 text-red-300')
          }
        >
          {toast.ok ? '✓ ' : '⚠ '}
          {toast.texto}
        </div>
      )}
    </div>
  )
}
