import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { MarkdownEditor } from '../../components/MarkdownEditor'
import { Carregando, Spinner } from '../../components/Spinner'
import type { Squad } from '../nivelamento/types'
import {
  apagarFluxo,
  criarFluxo,
  editarFluxo,
  listarFluxosAdmin,
  listarModulos,
} from './adminService'
import type { FluxoAdmin, FluxoAdminInput, Modulo } from './types'

const SQUADS: Squad[] = ['MaoDeObra', 'QuizQuality', 'Agilean']

export function FluxosAdmin() {
  const [fluxos, setFluxos] = useState<FluxoAdmin[]>([])
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState<FluxoAdmin | null>(null)
  const [form, setForm] = useState<FluxoAdminInput | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [apagando, setApagando] = useState<FluxoAdmin | null>(null)
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      const [fs, ms] = await Promise.all([listarFluxosAdmin(), listarModulos()])
      setFluxos([...fs].sort((a, b) => a.order - b.order))
      setModulos([...ms].sort((a, b) => a.order - b.order))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(t)
  }, [feedback])

  function abrirNovo() {
    if (modulos.length === 0) {
      setFeedback({ texto: 'Crie um módulo antes de criar um fluxo.', ok: false })
      return
    }
    setEditando(null)
    setForm({
      order: fluxos.length > 0 ? Math.max(...fluxos.map((f) => f.order)) + 1 : 1,
      moduloId: modulos[0].id,
      squad: null,
      categoria: '',
      titulo: '',
      descricao: '',
      conteudo: '',
      videoUrl: '',
    })
  }

  function abrirEdicao(fluxo: FluxoAdmin) {
    setEditando(fluxo)
    setForm({
      order: fluxo.order,
      moduloId: fluxo.moduloId,
      squad: fluxo.squad,
      categoria: fluxo.categoria,
      titulo: fluxo.titulo,
      descricao: fluxo.descricao,
      conteudo: fluxo.conteudo,
      videoUrl: fluxo.videoUrl,
    })
  }

  async function salvar() {
    if (!form || !form.titulo.trim()) return
    setSalvando(true)
    try {
      if (editando) {
        await editarFluxo(editando.id, form)
      } else {
        await criarFluxo(form)
      }
      setForm(null)
      setEditando(null)
      await carregar()
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao salvar', ok: false })
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarApagar() {
    if (!apagando) return
    const alvo = apagando
    setApagando(null)
    try {
      await apagarFluxo(alvo.id)
      await carregar()
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao apagar', ok: false })
    }
  }

  const nomeDoModulo = (moduloId: string) => modulos.find((m) => m.id === moduloId)?.nome ?? '?'

  if (loading) return <Carregando texto="Carregando..." />
  if (error) return <p className="text-red-400">Erro: {error}</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-100">
          <Icon name="menu_book" className="text-xl text-purple-300" /> Fluxos
        </h2>
        <button
          type="button"
          onClick={abrirNovo}
          className="rounded-lg bg-purple-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-400"
        >
          + Novo fluxo
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {fluxos.map((f) => (
          <li
            key={f.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3"
          >
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-neutral-100">
                #{f.order} · {f.titulo}
              </span>
              <span className="text-xs text-neutral-500">
                {nomeDoModulo(f.moduloId)}
                {f.squad ? ` · ${f.squad}` : ' · todos os squads'}
              </span>
            </div>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => abrirEdicao(f)}
                className="text-sm text-purple-300 hover:text-purple-200"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setApagando(f)}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Apagar
              </button>
            </div>
          </li>
        ))}
        {fluxos.length === 0 && <p className="text-sm text-neutral-500">Nenhum fluxo cadastrado.</p>}
      </ul>

      {form && (
        <div
          className="anim-fade fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setForm(null)}
        >
          <div
            className="anim-pop flex max-h-[90vh] w-full max-w-3xl flex-col gap-4 overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-100">
              {editando ? 'Editar fluxo' : 'Novo fluxo'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm text-neutral-400">
                Módulo
                <select
                  value={form.moduloId}
                  onChange={(e) => setForm({ ...form, moduloId: e.target.value })}
                  className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
                >
                  {modulos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-neutral-400">
                Ordem
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm text-neutral-400">
                Squad
                <select
                  value={form.squad ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, squad: e.target.value ? (e.target.value as Squad) : null })
                  }
                  className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
                >
                  <option value="">Todos os squads</option>
                  {SQUADS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-neutral-400">
                Categoria
                <input
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-sm text-neutral-400">
              Título
              <input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-neutral-400">
              Descrição (resumo de uma linha)
              <input
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-neutral-400">
              URL do vídeo (opcional)
              <input
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://..."
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
              />
            </label>

            <div className="flex flex-col gap-1 text-sm text-neutral-400">
              Conteúdo
              <MarkdownEditor
                value={form.conteudo}
                onChange={(v) => setForm({ ...form, conteudo: v })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setForm(null)}
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvar}
                disabled={!form.titulo.trim() || salvando}
                className="flex items-center gap-1.5 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {salvando ? (
                  <>
                    <Spinner /> Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {apagando && (
        <div
          className="anim-fade fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setApagando(null)}
        >
          <div
            className="anim-pop flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-100">Apagar fluxo?</h3>
            <p className="text-sm text-neutral-400">
              Tem certeza que deseja apagar "{apagando.titulo}"?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApagando(null)}
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarApagar}
                className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={
            'anim-pop fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-xl border bg-neutral-900 px-4 py-3 text-sm shadow-lg ' +
            (feedback.ok ? 'border-green-500/40 text-green-300' : 'border-red-500/40 text-red-300')
          }
        >
          <Icon name={feedback.ok ? 'check_circle' : 'warning'} className="text-base" />
          {feedback.texto}
        </div>
      )}
    </div>
  )
}
