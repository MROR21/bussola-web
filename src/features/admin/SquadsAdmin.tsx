import { useEffect, useState } from 'react'
import { EstadoErro } from '../../components/EstadoErro'
import { Icon } from '../../components/Icon'
import { KebabMenu } from '../../components/KebabMenu'
import { Carregando, Spinner } from '../../components/Spinner'
import { useSaidaValor } from '../../hooks/useSaida'
import { cx } from '../../utils/cx'
import { apagarSquad, criarSquad, editarSquad, listarModulos, listarSquadsAdmin } from './adminService'
import type { EntidadeSimples, SquadAdmin } from './types'

interface Form {
  nome: string
  moduloNome: string
  // Só true enquanto o admin não mexeu no campo do módulo à mão — nome do módulo acompanha o do
  // squad automaticamente até esse ponto (sugestão, não obrigação: ele pode divergir, ver
  // POST/PUT /admin/squads).
  moduloAutoSync: boolean
  // Só usado na CRIAÇÃO (o PUT não relinka módulo, só renomeia o vínculo já existente): criar um
  // módulo novo pro squad, ou adotar um "padrão do sistema" já existente (ex.: um módulo que já
  // tinha fluxos soltos e passa a pertencer a esse squad).
  modoModulo: 'novo' | 'existente'
  moduloIdExistente: string
}

// CRUD de Squad — próprio (não reaproveita SimpleEntityCrud) porque squad tem uma particularidade
// que Fase/Módulo não têm: cada um nasce com um Módulo vinculado (mesmo nome por padrão, mas
// editável à parte) e não faz sentido ordenar squads manualmente (a lista só importa por nome).
export function SquadsAdmin() {
  const [squads, setSquads] = useState<SquadAdmin[]>([])
  const [contagemModulos, setContagemModulos] = useState<Record<string, number>>({})
  const [modulosPadrao, setModulosPadrao] = useState<EntidadeSimples[]>([])
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
      setModulosPadrao(modulos.filter((m) => m.squadId === null))
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
    // Começa em "vincular" quando existe algo pra vincular — é o caminho mais comum (adotar um
    // módulo "padrão do sistema" que já tinha fluxos soltos); só cai pra "criar novo" de saída
    // quando não há nenhum módulo padrão disponível.
    const temExistente = modulosPadrao.length > 0
    setForm({
      nome: '',
      moduloNome: '',
      moduloAutoSync: true,
      modoModulo: temExistente ? 'existente' : 'novo',
      moduloIdExistente: temExistente ? modulosPadrao[0].id : '',
    })
  }

  function abrirEdicao(squad: SquadAdmin) {
    setEditando(squad)
    setForm({
      nome: squad.nome,
      moduloNome: squad.moduloNome,
      moduloAutoSync: false,
      modoModulo: 'novo',
      moduloIdExistente: '',
    })
  }

  function formValido(form: Form, criando: boolean): boolean {
    if (!form.nome.trim()) return false
    if (!criando) return Boolean(form.moduloNome.trim())
    return form.modoModulo === 'existente' ? Boolean(form.moduloIdExistente) : Boolean(form.moduloNome.trim())
  }

  async function salvar() {
    if (!form) return
    const criando = editando === 'novo'
    if (!formValido(form, criando)) return
    setSalvando(true)
    try {
      if (criando) {
        const order = squads.length > 0 ? Math.max(...squads.map((s) => s.order)) + 1 : 1
        await criarSquad(
          form.nome.trim(),
          order,
          form.modoModulo === 'existente'
            ? { id: form.moduloIdExistente }
            : { nome: form.moduloNome.trim() },
        )
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
                  <span className="text-xs text-neutral-500">
                    Identifica o squad no sistema — é essa a opção que o colaborador escolhe no
                    nivelamento (ex.: "Mão de Obra", "Quiz Quality").
                  </span>
                </label>
                {editando === 'novo' && (
                  <div className="flex flex-col gap-1 text-sm text-neutral-400">
                    Módulo (Guia pelo sistema)
                    <div className="flex gap-1 rounded-lg border border-navy-600 bg-navy-900 p-1">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, modoModulo: 'existente' })}
                        disabled={modulosPadrao.length === 0}
                        className={cx(
                          'flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30',
                          form.modoModulo === 'existente'
                            ? 'bg-gold-500/20 text-gold-300'
                            : 'text-neutral-400 hover:text-neutral-200',
                        )}
                      >
                        Vincular módulo existente
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, modoModulo: 'novo' })}
                        className={cx(
                          'flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                          form.modoModulo === 'novo'
                            ? 'bg-gold-500/20 text-gold-300'
                            : 'text-neutral-400 hover:text-neutral-200',
                        )}
                      >
                        Criar módulo novo
                      </button>
                    </div>
                  </div>
                )}
                {form.modoModulo === 'existente' && editando === 'novo' ? (
                  <label className="flex flex-col gap-1 text-sm text-neutral-400">
                    Módulo já existente
                    <select
                      value={form.moduloIdExistente}
                      onChange={(e) => setForm({ ...form, moduloIdExistente: e.target.value })}
                      className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                    >
                      <option value="" disabled>
                        Escolha um módulo
                      </option>
                      {modulosPadrao.map((modulo) => (
                        <option key={modulo.id} value={modulo.id}>
                          {modulo.nome}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-neutral-500">
                      Adota um módulo "padrão do sistema" que já existe (ex.: um que já tinha
                      fluxos soltos) — ele passa a pertencer a esse squad, na tela de Guias.
                    </span>
                  </label>
                ) : (
                  <label className="flex flex-col gap-1 text-sm text-neutral-400">
                    Nome do módulo (Guia pelo sistema)
                    <input
                      value={form.moduloNome}
                      onChange={(e) => setForm({ ...form, moduloNome: e.target.value, moduloAutoSync: false })}
                      className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                    />
                    <span className="text-xs text-neutral-500">
                      Todo squad ganha um módulo próprio na tela de Guias, onde ficam os fluxos e a
                      documentação desse squad — este é o nome que o colaborador vê lá (pode ser
                      diferente do nome do squad, ex.: squad "Agilean", módulo "Agilean (desktop)").
                      Acompanha o nome do squad acima por padrão; só para de seguir se você editar
                      aqui.
                    </span>
                  </label>
                )}
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
                    disabled={!formValido(form, editando === 'novo') || salvando}
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
