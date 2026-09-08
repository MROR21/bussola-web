import { useEffect, useState } from 'react'
import { Acordeao } from '../../components/Acordeao'
import { EstadoErro } from '../../components/EstadoErro'
import { Icon } from '../../components/Icon'
import { Carregando, Spinner } from '../../components/Spinner'
import { useSaidaValor } from '../../hooks/useSaida'
import { cx } from '../../utils/cx'
import type { Cargo } from '../nivelamento/types'
import { apagarAcesso, criarAcesso, editarAcesso, listarAcessosAdmin } from './adminService'
import type { AcessoAdmin, AcessoAdminInput } from './types'

const CARGOS: Cargo[] = ['Estagiario', 'Junior', 'Pleno']
const CARGO_LABEL: Record<Cargo, string> = {
  Estagiario: 'Estagiário',
  Junior: 'Júnior',
  Pleno: 'Pleno',
}
// Estagiário é o cargo mínimo do sistema (todo mundo que entra já é pelo menos Estagiário) — um
// acesso com `cargoMinimo: 'Estagiario'` vale pra TODO MUNDO, então o grupo dele lê melhor como
// "Todos" do que "A partir de Estagiário" (que soaria como se sobrasse alguém de fora).
const GRUPO_LABEL: Record<Cargo, string> = {
  Estagiario: 'Todos',
  Junior: 'A partir de Júnior',
  Pleno: 'A partir de Pleno',
}

export function AcessosAdmin() {
  const [acessos, setAcessos] = useState<AcessoAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState<AcessoAdmin | null>(null)
  const [form, setForm] = useState<AcessoAdminInput | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [apagando, setApagando] = useState<AcessoAdmin | null>(null)
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)
  const [gruposAbertos, setGruposAbertos] = useState<Record<string, boolean>>({})

  const modalForm = useSaidaValor(form)
  const modalApagar = useSaidaValor(apagando)
  const toastFeedback = useSaidaValor(feedback)

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      setAcessos([...(await listarAcessosAdmin())].sort((a, b) => a.order - b.order))
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
    setEditando(null)
    setForm({
      nome: '',
      link: '',
      cargoMinimo: 'Estagiario',
      order: acessos.length > 0 ? Math.max(...acessos.map((a) => a.order)) + 1 : 1,
    })
  }

  function abrirEdicao(acesso: AcessoAdmin) {
    setEditando(acesso)
    setForm({
      nome: acesso.nome,
      link: acesso.link,
      cargoMinimo: acesso.cargoMinimo,
      order: acesso.order,
    })
  }

  async function salvar() {
    if (!form || !form.nome.trim()) return
    const criando = !editando
    setSalvando(true)
    try {
      if (editando) {
        await editarAcesso(editando.id, form)
      } else {
        await criarAcesso(form)
      }
      setForm(null)
      setEditando(null)
      await carregar()
      setFeedback({ texto: criando ? 'Acesso criado.' : 'Acesso salvo.', ok: true })
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
      await apagarAcesso(alvo.id)
      await carregar()
      setFeedback({ texto: 'Acesso apagado.', ok: true })
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao apagar', ok: false })
    }
  }

  // Agrupa por Cargo mínimo — cumulativo por natureza (um acesso do Estagiário também vale pro
  // Júnior/Pleno), mas aqui cada um aparece só uma vez, sob o grupo onde foi introduzido.
  const porCargo = CARGOS.map((cargo) => [cargo, acessos.filter((a) => a.cargoMinimo === cargo)] as const)

  if (loading) return <Carregando texto="Carregando..." />
  if (error) return <EstadoErro onRetry={carregar} />

  return (
    <div className="anim-fade flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-100">
          <Icon name="key" className="text-xl text-gold-400" /> Acessos
        </h2>
        <button
          type="button"
          onClick={abrirNovo}
          className="rounded-lg bg-gold-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gold-400"
        >
          + Novo acesso
        </button>
      </div>

      <p className="text-sm text-neutral-500">
        "Cargo" aqui é o mínimo pra precisar desse acesso — cumulativo (quem tem esse cargo ou um
        acima também precisa dele).
      </p>

      {acessos.length === 0 && <p className="anim-fade text-sm text-neutral-500">Nenhum acesso cadastrado.</p>}

      <div className="flex flex-col gap-3">
        {porCargo.map(([cargo, itens]) =>
          itens.length === 0 ? null : (
            <Acordeao
              key={cargo}
              titulo={GRUPO_LABEL[cargo]}
              contagem={itens.length}
              aberto={gruposAbertos[cargo] ?? false}
              onToggle={() => setGruposAbertos((g) => ({ ...g, [cargo]: !g[cargo] }))}
            >
              <ul className="flex flex-col gap-2">
                {itens.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-navy-700 bg-navy-800 p-3"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-neutral-100">{a.nome}</span>
                      {a.link ? (
                        <span className="truncate text-xs text-neutral-500">{a.link}</span>
                      ) : (
                        <span className="text-xs text-neutral-600">Sem link</span>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-3">
                      <button
                        type="button"
                        onClick={() => abrirEdicao(a)}
                        className="text-sm text-gold-400 transition-colors hover:text-gold-300"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setApagando(a)}
                        className="text-sm text-red-400 transition-colors hover:text-red-300"
                      >
                        Apagar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </Acordeao>
          ),
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
              'flex w-full max-w-md flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6',
              modalForm.saindo ? 'anim-pop-out' : 'anim-pop',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {form && (
              <>
                <h3 className="text-lg font-semibold text-neutral-100">
                  {editando ? 'Editar acesso' : 'Novo acesso'}
                </h3>

                <label className="flex flex-col gap-1 text-sm text-neutral-400">
                  Nome
                  <input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex.: E-mail Agilean"
                    className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm text-neutral-400">
                  Link (opcional — leva direto pra página que libera esse acesso)
                  <input
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    placeholder="https://..."
                    className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-sm text-neutral-400">
                    Cargo mínimo
                    <select
                      value={form.cargoMinimo}
                      onChange={(e) => setForm({ ...form, cargoMinimo: e.target.value as Cargo })}
                      className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                    >
                      {CARGOS.map((c) => (
                        <option key={c} value={c}>
                          {CARGO_LABEL[c]}
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
                    disabled={!form.nome.trim() || salvando}
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
            <h3 className="text-lg font-semibold text-neutral-100">Apagar acesso?</h3>
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
