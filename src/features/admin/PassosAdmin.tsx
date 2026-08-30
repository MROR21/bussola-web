import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { MarkdownEditor } from '../../components/MarkdownEditor'
import { Carregando, Spinner } from '../../components/Spinner'
import type { SkillArea } from '../onboarding/types'
import {
  apagarPasso,
  criarPasso,
  editarPasso,
  listarFases,
  listarPassosAdmin,
} from './adminService'
import type { Fase, PassoAdmin, PassoAdminInput } from './types'

const SKILL_AREAS: SkillArea[] = ['None', 'Frontend', 'Backend', 'Git', 'Sql', 'Jira']

export function PassosAdmin() {
  const [passos, setPassos] = useState<PassoAdmin[]>([])
  const [fases, setFases] = useState<Fase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState<PassoAdmin | null>(null)
  const [form, setForm] = useState<PassoAdminInput | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [apagando, setApagando] = useState<PassoAdmin | null>(null)
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      const [ps, fs] = await Promise.all([listarPassosAdmin(), listarFases()])
      setPassos([...ps].sort((a, b) => a.order - b.order))
      setFases([...fs].sort((a, b) => a.order - b.order))
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
    if (fases.length === 0) {
      setFeedback({ texto: 'Crie uma fase antes de criar um passo.', ok: false })
      return
    }
    setEditando(null)
    setForm({
      order: passos.length > 0 ? Math.max(...passos.map((p) => p.order)) + 1 : 1,
      faseId: fases[0].id,
      title: '',
      description: '',
      isCompanySpecific: true,
      skillArea: 'None',
      conteudo: '',
    })
  }

  function abrirEdicao(passo: PassoAdmin) {
    setEditando(passo)
    setForm({
      order: passo.order,
      faseId: passo.faseId,
      title: passo.title,
      description: passo.description,
      isCompanySpecific: passo.isCompanySpecific,
      skillArea: passo.skillArea,
      conteudo: passo.conteudo,
    })
  }

  async function salvar() {
    if (!form || !form.title.trim()) return
    setSalvando(true)
    try {
      if (editando) {
        await editarPasso(editando.id, form)
      } else {
        await criarPasso(form)
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
      await apagarPasso(alvo.id)
      await carregar()
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao apagar', ok: false })
    }
  }

  const nomeDaFase = (faseId: string) => fases.find((f) => f.id === faseId)?.nome ?? '?'

  if (loading) return <Carregando texto="Carregando..." />
  if (error) return <p className="text-red-400">Erro: {error}</p>

  return (
    <div className="anim-fade flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-100">
          <Icon name="route" className="text-xl text-gold-400" /> Passos
        </h2>
        <button
          type="button"
          onClick={abrirNovo}
          className="rounded-lg bg-gold-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gold-400"
        >
          + Novo passo
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {passos.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-navy-700 bg-navy-800 p-3"
          >
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-neutral-100">
                #{p.order} · {p.title}
              </span>
              <span className="text-xs text-neutral-500">{nomeDaFase(p.faseId)}</span>
            </div>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => abrirEdicao(p)}
                className="text-sm text-gold-400 transition-colors hover:text-gold-300"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setApagando(p)}
                className="text-sm text-red-400 transition-colors hover:text-red-300"
              >
                Apagar
              </button>
            </div>
          </li>
        ))}
        {passos.length === 0 && <p className="anim-fade text-sm text-neutral-500">Nenhum passo cadastrado.</p>}
      </ul>

      {form && (
        <div
          className="anim-fade fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setForm(null)}
        >
          <div
            className="anim-pop flex max-h-[90vh] w-full max-w-3xl flex-col gap-4 overflow-y-auto rounded-2xl border border-navy-700 bg-navy-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-100">
              {editando ? 'Editar passo' : 'Novo passo'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm text-neutral-400">
                Fase
                <select
                  value={form.faseId}
                  onChange={(e) => setForm({ ...form, faseId: e.target.value })}
                  className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                >
                  {fases.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
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
                  className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-sm text-neutral-400">
              Título
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-neutral-400">
              Descrição (resumo de uma linha)
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm text-neutral-400">
                Área (nivelamento)
                <select
                  value={form.skillArea}
                  onChange={(e) => setForm({ ...form, skillArea: e.target.value as SkillArea })}
                  className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                >
                  {SKILL_AREAS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-6 flex items-center gap-2 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  checked={form.isCompanySpecific}
                  onChange={(e) => setForm({ ...form, isCompanySpecific: e.target.checked })}
                />
                Específico da Agilean (sempre essencial)
              </label>
            </div>

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
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvar}
                disabled={!form.title.trim() || salvando}
                className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
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
            className="anim-pop flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-100">Apagar passo?</h3>
            <p className="text-sm text-neutral-400">
              Tem certeza que deseja apagar "{apagando.title}"?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApagando(null)}
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarApagar}
                className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
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
            'anim-pop fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-xl border bg-navy-800 px-4 py-3 text-sm shadow-lg ' +
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
