import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { KebabMenu } from '../../components/KebabMenu'
import { MarkdownEditor } from '../../components/MarkdownEditor'
import { Spinner } from '../../components/Spinner'
import { useSaidaValor } from '../../hooks/useSaida'
import { cx } from '../../utils/cx'
import { listarSquads } from '../squads/squadsService'
import type { Squad } from '../squads/types'
import { apagarFluxo, criarFluxo, editarFluxo, listarFluxosAdmin, listarModulos } from './adminService'
import type { FluxoAdmin, FluxoAdminInput, Modulo } from './types'

const ABAS: { value: FluxoAdmin['tipo']; label: string }[] = [
  { value: 'Fluxo', label: 'Fluxos' },
  { value: 'Documentacao', label: 'Documentação' },
]

// Conteúdo de UM módulo específico — o CONTEÚDO do dropdown daquele módulo no SimpleEntityCrud de
// Guias (o próprio SimpleEntityCrud controla o abrir/fechar da linha, aqui só o miolo: sub-abas +
// lista + criar/editar). Duas sub-abas (Fluxos/Documentação) filtram o mesmo registro Fluxo pelo
// campo Tipo — não são listas/entidades diferentes.
export function FluxosDoModulo({ moduloId }: { moduloId: string }) {
  const [aba, setAba] = useState<FluxoAdmin['tipo']>('Fluxo')
  const [fluxos, setFluxos] = useState<FluxoAdmin[]>([])
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [squads, setSquads] = useState<Squad[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<FluxoAdmin | null>(null)
  const [form, setForm] = useState<FluxoAdminInput | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [apagando, setApagando] = useState<FluxoAdmin | null>(null)
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)

  const modalForm = useSaidaValor(form)
  const modalApagar = useSaidaValor(apagando)
  const toastFeedback = useSaidaValor(feedback)

  async function carregar() {
    setLoading(true)
    try {
      const [fs, ms, sqs] = await Promise.all([listarFluxosAdmin(), listarModulos(), listarSquads()])
      setFluxos(fs.filter((f) => f.moduloId === moduloId).sort((a, b) => a.order - b.order))
      setModulos([...ms].sort((a, b) => a.order - b.order))
      setSquads(sqs)
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao carregar', ok: false })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduloId])

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(t)
  }, [feedback])

  const itensDaAba = fluxos.filter((f) => f.tipo === aba)

  function abrirNovo() {
    setEditando(null)
    setForm({
      order: fluxos.length > 0 ? Math.max(...fluxos.map((f) => f.order)) + 1 : 1,
      moduloId,
      squadId: null,
      tipo: aba,
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
      squadId: fluxo.squadId,
      tipo: fluxo.tipo,
      categoria: fluxo.categoria,
      titulo: fluxo.titulo,
      descricao: fluxo.descricao,
      conteudo: fluxo.conteudo,
      videoUrl: fluxo.videoUrl,
    })
  }

  async function salvar() {
    if (!form || !form.titulo.trim()) return
    const criando = !editando
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
      setFeedback({
        texto: criando
          ? form.tipo === 'Fluxo'
            ? 'Fluxo criado.'
            : 'Documento criado.'
          : form.tipo === 'Fluxo'
            ? 'Fluxo salvo.'
            : 'Documento salvo.',
        ok: true,
      })
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
      setFeedback({ texto: alvo.tipo === 'Fluxo' ? 'Fluxo apagado.' : 'Documento apagado.', ok: true })
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao apagar', ok: false })
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {ABAS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setAba(a.value)}
                className={cx(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  aba === a.value
                    ? 'bg-gold-500/20 text-gold-300'
                    : 'text-neutral-400 hover:text-neutral-200',
                )}
              >
                {a.label} ({fluxos.filter((f) => f.tipo === a.value).length})
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={abrirNovo}
            className="shrink-0 rounded-lg bg-gold-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gold-400"
          >
            + Novo {aba === 'Fluxo' ? 'fluxo' : 'documento'}
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">Carregando...</p>
        ) : itensDaAba.length === 0 ? (
          <p className="text-sm text-neutral-500">
            {aba === 'Fluxo' ? 'Nenhum fluxo' : 'Nenhum documento'} nesse módulo ainda.
          </p>
        ) : (
          <ul className="flex max-h-[19rem] flex-col gap-2 overflow-y-auto pr-1">
            {itensDaAba.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-navy-700 bg-navy-800 p-3"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-neutral-100">{f.titulo}</span>
                  <span className="text-xs text-neutral-500">{f.squad ?? 'Todos os squads'}</span>
                </div>
                <KebabMenu
                  acoes={[
                    { label: 'Editar', onClick: () => abrirEdicao(f) },
                    { label: 'Apagar', onClick: () => setApagando(f), tone: 'perigo' },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalForm.montado && (
        <div
          className={cx(
            'fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4',
            modalForm.saindo ? 'anim-fade-out' : 'anim-fade',
          )}
          onClick={() => setForm(null)}
        >
          <div
            className={cx(
              'flex max-h-[90vh] w-full max-w-3xl flex-col gap-4 overflow-y-auto rounded-2xl border border-navy-700 bg-navy-800 p-6',
              modalForm.saindo ? 'anim-pop-out' : 'anim-pop',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {form && (
              <>
                <h3 className="text-lg font-semibold text-neutral-100">
                  {editando
                    ? `Editar ${editando.tipo === 'Fluxo' ? 'fluxo' : 'documento'}`
                    : `Novo ${form.tipo === 'Fluxo' ? 'fluxo' : 'documento'}`}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-sm text-neutral-400">
                    Módulo
                    <select
                      value={form.moduloId}
                      onChange={(e) => setForm({ ...form, moduloId: e.target.value })}
                      className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
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
                      min={1}
                      value={form.order}
                      onChange={(e) => setForm({ ...form, order: Math.max(1, Number(e.target.value)) })}
                      className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1 text-sm text-neutral-400">
                    Squad
                    <select
                      value={form.squadId ?? ''}
                      onChange={(e) => setForm({ ...form, squadId: e.target.value || null })}
                      className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                    >
                      <option value="">Todos os squads</option>
                      {squads.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-neutral-400">
                    Tipo
                    <select
                      value={form.tipo}
                      onChange={(e) => setForm({ ...form, tipo: e.target.value as FluxoAdmin['tipo'] })}
                      className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                    >
                      {ABAS.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-neutral-400">
                    Categoria
                    <input
                      value={form.categoria}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1 text-sm text-neutral-400">
                  Título
                  <input
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm text-neutral-400">
                  Descrição (resumo de uma linha)
                  <input
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm text-neutral-400">
                  URL do vídeo (opcional)
                  <input
                    value={form.videoUrl}
                    onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                    placeholder="https://..."
                    className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                  />
                </label>

                <div className="flex flex-col gap-1 text-sm text-neutral-400">
                  Conteúdo
                  <MarkdownEditor value={form.conteudo} onChange={(v) => setForm({ ...form, conteudo: v })} />
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
                    disabled={!form.titulo.trim() || salvando}
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
              </>
            )}
          </div>
        </div>
      )}

      {modalApagar.montado && modalApagar.valor && (
        <div
          className={cx(
            'fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4',
            modalApagar.saindo ? 'anim-fade-out' : 'anim-fade',
          )}
          onClick={() => setApagando(null)}
        >
          <div
            className={cx(
              'flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6',
              modalApagar.saindo ? 'anim-pop-out' : 'anim-pop',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-100">
              Apagar {modalApagar.valor.tipo === 'Fluxo' ? 'fluxo' : 'documento'}?
            </h3>
            <p className="text-sm text-neutral-400">
              Tem certeza que deseja apagar "{modalApagar.valor.titulo}"?
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

      {toastFeedback.montado && toastFeedback.valor && (
        <div
          className={cx(
            'fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-xl border bg-navy-800 px-4 py-3 text-sm shadow-lg',
            toastFeedback.saindo ? 'anim-pop-out' : 'anim-pop',
            toastFeedback.valor.ok ? 'border-green-500/40 text-green-300' : 'border-red-500/40 text-red-300',
          )}
        >
          <Icon name={toastFeedback.valor.ok ? 'check_circle' : 'warning'} className="text-base" />
          {toastFeedback.valor.texto}
        </div>
      )}
    </>
  )
}
