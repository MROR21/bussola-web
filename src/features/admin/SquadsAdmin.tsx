import { useEffect, useState } from 'react'
import { EstadoErro } from '../../components/EstadoErro'
import { Icon } from '../../components/Icon'
import { KebabMenu } from '../../components/KebabMenu'
import { Carregando, Spinner } from '../../components/Spinner'
import { useSaidaValor } from '../../hooks/useSaida'
import { cx } from '../../utils/cx'
import { apagarSquad, criarSquad, editarSquad, listarModulos, listarSquadsAdmin } from './adminService'
import type { SquadAdmin } from './types'

interface Form {
  nome: string
  moduloNome: string
  // Só true enquanto o admin não mexeu no campo do módulo à mão — nome do módulo acompanha o do
  // squad automaticamente até esse ponto (sugestão, não obrigação: ele pode divergir, ver
  // POST/PUT /admin/squads).
  moduloAutoSync: boolean
}

// CRUD de Squad — próprio (não reaproveita SimpleEntityCrud) porque squad tem uma particularidade
// que Fase/Módulo não têm: cada um nasce com um Módulo vinculado (mesmo nome por padrão, mas
// editável à parte) e não faz sentido ordenar squads manualmente (a lista só importa por nome).
export function SquadsAdmin() {
  const [squads, setSquads] = useState<SquadAdmin[]>([])
  const [contagemModulos, setContagemModulos] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState<SquadAdmin | 'novo' | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [apagando, setApagando] = useState<SquadAdmin | null>(null)
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)

  const modalForm = useSaidaValor(form)
  const modalApagar = useSaidaValor(apagando)
  const toastFeedback = useSaidaValor(feedback)

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      const [sqs, modulos] = await Promise.all([listarSquadsAdmin(), listarModulos()])
      setSquads(sqs)
      const contagem: Record<string, number> = {}
      for (const m of modulos) {
        if (m.squadId) contagem[m.squadId] = (contagem[m.squadId] ?? 0) + 1
      }
      setContagemModulos(contagem)
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
    setEditando('novo')
    setForm({ nome: '', moduloNome: '', moduloAutoSync: true })
  }

  function abrirEdicao(squad: SquadAdmin) {
    setEditando(squad)
    setForm({ nome: squad.nome, moduloNome: squad.moduloNome, moduloAutoSync: false })
  }

  async function salvar() {
    if (!form || !form.nome.trim() || !form.moduloNome.trim()) return
    const criando = editando === 'novo'
    setSalvando(true)
    try {
      if (criando) {
        const order = squads.length > 0 ? Math.max(...squads.map((s) => s.order)) + 1 : 1
        await criarSquad(form.nome.trim(), form.moduloNome.trim(), order)
      } else if (editando) {
        await editarSquad(editando.id, form.nome.trim(), form.moduloNome.trim(), editando.order)
      }
      setForm(null)
      setEditando(null)
      await carregar()
      setFeedback({ texto: criando ? 'Squad criado.' : 'Squad salvo.', ok: true })
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
      await apagarSquad(alvo.id)
      await carregar()
      setFeedback({ texto: 'Squad apagado.', ok: true })
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao apagar', ok: false })
    }
  }

  if (loading) return <Carregando texto="Carregando..." />
  if (error) return <EstadoErro onRetry={carregar} />

  return (
    <div className="anim-fade flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-100">
          <Icon name="groups" className="text-xl text-gold-400" /> Squads
        </h2>
        <button
          type="button"
          onClick={abrirNovo}
          className="rounded-lg bg-gold-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gold-400"
        >
          + Novo squad
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {squads.map((squad) => (
          <li
            key={squad.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-navy-700 bg-navy-800 p-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-neutral-100">{squad.nome}</span>
              <span className="rounded-full bg-navy-700 px-2 py-0.5 text-xs text-neutral-400">
                {contagemModulos[squad.id] ?? 0} módulos
              </span>
            </div>
            <KebabMenu
              acoes={[
                { label: 'Editar', onClick: () => abrirEdicao(squad) },
                { label: 'Apagar', onClick: () => setApagando(squad), tone: 'perigo' },
              ]}
            />
          </li>
        ))}
        {squads.length === 0 && <p className="anim-fade text-sm text-neutral-500">Nenhum squad cadastrado.</p>}
      </ul>

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
              'flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6',
              modalForm.saindo ? 'anim-pop-out' : 'anim-pop',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {form && (
              <>
                <h3 className="text-lg font-semibold text-neutral-100">
                  {editando === 'novo' ? 'Novo squad' : 'Editar squad'}
                </h3>
                <label className="flex flex-col gap-1 text-sm text-neutral-400">
                  Nome do squad
                  <input
                    value={form.nome}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        nome: e.target.value,
                        moduloNome: form.moduloAutoSync ? e.target.value : form.moduloNome,
                      })
                    }
                    autoFocus
                    className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-400">
                  Nome do módulo (Guia pelo sistema)
                  <input
                    value={form.moduloNome}
                    onChange={(e) => setForm({ ...form, moduloNome: e.target.value, moduloAutoSync: false })}
                    className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                  />
                  <span className="text-xs text-neutral-500">
                    Acompanha o nome do squad por padrão — só muda se você editar aqui.
                  </span>
                </label>
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
                    disabled={!form.nome.trim() || !form.moduloNome.trim() || salvando}
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
            <h3 className="text-lg font-semibold text-neutral-100">Apagar squad?</h3>
            <p className="text-sm text-neutral-400">
              Tem certeza que deseja apagar "{modalApagar.valor.nome}"?
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
    </div>
  )
}
