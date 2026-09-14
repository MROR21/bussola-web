import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { EstadoErro } from '../../components/EstadoErro'
import { Icon } from '../../components/Icon'
import { IconePicker } from '../../components/IconePicker'
import { KebabMenu } from '../../components/KebabMenu'
import { ModalConfirmarDescarte } from '../../components/ModalConfirmarDescarte'
import { Carregando, Spinner } from '../../components/Spinner'
import { useConfirmarDescarte } from '../../hooks/useConfirmarDescarte'
import { useSaidaValor } from '../../hooks/useSaida'
import { cx } from '../../utils/cx'
import type { Squad } from '../squads/types'
import type { EntidadeSimples } from './types'

// CRUD de Fase ou Módulo — a mesma forma (nome+ordem) serve pros dois, só troca os services e os
// textos. Cria/edita num modal; apaga com confirmação (o back já bloqueia se houver vínculo).
function comMaiuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
export function SimpleEntityCrud({
  titulo,
  icone,
  singular,
  labelFilhos,
  listar,
  criar,
  editar,
  apagar,
  contarFilhos,
  renderFilhos,
  ocultarTitulo,
  ocultarNovo,
  squadPicker,
  iconePicker,
}: {
  titulo: string
  icone: string
  singular: string
  labelFilhos?: string
  listar: () => Promise<EntidadeSimples[]>
  criar: (nome: string, order: number) => Promise<EntidadeSimples>
  editar: (id: string, nome: string, order: number) => Promise<void>
  apagar: (id: string) => Promise<void>
  contarFilhos?: () => Promise<Record<string, number>>
  // Conteúdo extra por linha (ex.: os passos daquela fase, os fluxos daquele módulo) — dropdown
  // próprio, cada item cuida do seu próprio fetch/estado de aberto-fechado. Opcional: sem isso a
  // linha fica exatamente como sempre foi (nome + editar/apagar). Segundo argumento
  // (`aoMudar`) é o jeito do filho avisar "mudei uma criança sua" — sem isso a badge "N itens" só
  // atualiza quando O PRÓPRIO SimpleEntityCrud recarrega (editar/apagar/reordenar A FASE/MÓDULO
  // em si), então criar/apagar um passo/fluxo por dentro do dropdown deixava a contagem visível
  // desatualizada até a próxima ação na linha de fora.
  renderFilhos?: (item: EntidadeSimples, aoMudar: () => void) => ReactNode
  // Esconde o ícone+título internos (mantém só o botão "+ Novo(a)") — usado quando o chamador já
  // mostra um cabeçalho próprio por fora (ex.: duas instâncias lado a lado que representam a MESMA
  // entidade, só filtradas diferente — não faz sentido repetir "Módulos" duas vezes).
  ocultarTitulo?: boolean
  // Esconde o botão "+ Novo(a)" — usado quando a criação é centralizada em outro lugar (ex.: os
  // módulos têm categoria pra escolher na criação, então isso mora num botão único por fora,
  // fora das duas instâncias filtradas por categoria).
  ocultarNovo?: boolean
  // Dá ao modal de EDIÇÃO um campo extra de categoria (squad vinculado, ou nenhum pra "padrão do
  // sistema") — só faz sentido pra Módulo (Fase não tem squad), então é opcional. Não aparece na
  // criação de propósito: a criação de módulo é centralizada no NovoModuloButton (ver ocultarNovo),
  // que já escolhe a categoria lá.
  squadPicker?: {
    squads: Squad[]
    squadIdAtual: (item: EntidadeSimples) => string | null
    salvar: (id: string, squadId: string | null) => Promise<void>
  }
  // Mesma ideia do squadPicker, mas pro ícone do módulo (ver IconePicker.tsx) — troca depois de
  // criado passa pelo endpoint próprio (.../icone), nunca pelo PUT genérico de nome/ordem.
  iconePicker?: {
    iconeAtual: (item: EntidadeSimples) => string
    salvar: (id: string, icone: string) => Promise<void>
  }
}) {
  const [itens, setItens] = useState<EntidadeSimples[]>([])
  const [filhosPorId, setFilhosPorId] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState<EntidadeSimples | 'novo' | null>(null)
  const [nome, setNome] = useState('')
  const [order, setOrder] = useState(1)
  const [categoria, setCategoria] = useState<'padrao' | 'squad'>('padrao')
  const [squadId, setSquadId] = useState('')
  const [iconeEscolhido, setIconeEscolhido] = useState('')
  // Vira true no onChange de qualquer campo do modal de edição — usado só pra saber se pede
  // confirmação antes de descartar num clique fora (ver useConfirmarDescarte.ts).
  const [sujo, setSujo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [apagando, setApagando] = useState<EntidadeSimples | null>(null)
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)
  // Abrir/fechar do dropdown de cada linha (renderFilhos) — o chevron mora na própria linha, sem
  // um sub-título repetindo a badge que já mostra a contagem.
  const [abertos, setAbertos] = useState<Record<string, boolean>>({})

  const modalEdicao = useSaidaValor(editando)
  const modalApagar = useSaidaValor(apagando)
  const toastFeedback = useSaidaValor(feedback)

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      const [dados, filhos] = await Promise.all([
        listar(),
        contarFilhos ? contarFilhos() : Promise.resolve({}),
      ])
      setItens([...dados].sort((a, b) => a.order - b.order))
      setFilhosPorId(filhos)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  // Só recalcula a contagem (sem re-listar itens nem piscar loading) — chamado pelo filho via
  // `aoMudar` quando ele cria/edita/apaga algo por dentro do próprio dropdown.
  async function atualizarContagem() {
    if (!contarFilhos) return
    try {
      setFilhosPorId(await contarFilhos())
    } catch {
      // silencioso — a próxima carga completa (editar/apagar/reordenar a linha de fora) corrige
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(t)
  }, [feedback])

  function abrirNovo() {
    setNome('')
    setOrder(itens.length > 0 ? Math.max(...itens.map((i) => i.order)) + 1 : 1)
    setEditando('novo')
    setSujo(false)
  }

  function abrirEdicao(item: EntidadeSimples) {
    setNome(item.nome)
    setOrder(item.order)
    setEditando(item)
    if (squadPicker) {
      const atual = squadPicker.squadIdAtual(item)
      setCategoria(atual ? 'squad' : 'padrao')
      setSquadId(atual ?? '')
    }
    if (iconePicker) setIconeEscolhido(iconePicker.iconeAtual(item))
    setSujo(false)
  }

  const fecharModalEdicao = () => setEditando(null)
  const { confirmando, aoTentarFechar, confirmarDescarte, cancelarDescarte } = useConfirmarDescarte(
    sujo,
    fecharModalEdicao,
  )

  async function salvar() {
    if (!nome.trim()) return
    const criando = editando === 'novo'
    setSalvando(true)
    try {
      if (criando) {
        await criar(nome.trim(), order)
      } else if (editando) {
        await editar(editando.id, nome.trim(), order)
        if (squadPicker) {
          const squadIdNovo = categoria === 'squad' ? squadId : null
          if (squadIdNovo !== squadPicker.squadIdAtual(editando)) {
            await squadPicker.salvar(editando.id, squadIdNovo)
          }
        }
        if (iconePicker && iconeEscolhido !== iconePicker.iconeAtual(editando)) {
          await iconePicker.salvar(editando.id, iconeEscolhido)
        }
      }
      setEditando(null)
      await carregar()
      setFeedback({
        texto: criando ? `${comMaiuscula(singular)} criado(a).` : `${comMaiuscula(singular)} salvo(a).`,
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
      await apagar(alvo.id)
      await carregar()
      setFeedback({ texto: `${comMaiuscula(singular)} apagado(a).`, ok: true })
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao apagar', ok: false })
    }
  }

  if (loading) return <Carregando texto="Carregando..." />
  if (error) return <EstadoErro onRetry={carregar} />

  return (
    <div className="anim-fade flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {ocultarTitulo ? (
          <span />
        ) : (
          <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-100">
            <Icon name={icone} className="text-xl text-gold-400" /> {titulo}
          </h2>
        )}
        {!ocultarNovo && (
          <button
            type="button"
            onClick={abrirNovo}
            className="rounded-lg bg-gold-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gold-400"
          >
            + Novo(a) {singular}
          </button>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {itens.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-2 rounded-xl border border-navy-700 bg-navy-800 p-3 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {renderFilhos ? (
                  <button
                    type="button"
                    onClick={() => setAbertos((a) => ({ ...a, [item.id]: !a[item.id] }))}
                    aria-expanded={Boolean(abertos[item.id])}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <Icon
                      name="expand_more"
                      className={cx(
                        'shrink-0 text-neutral-500 transition-transform duration-200',
                        abertos[item.id] && 'rotate-180',
                      )}
                    />
                    <span className="truncate text-neutral-100">{item.nome}</span>
                    {contarFilhos && (
                      <span className="shrink-0 rounded-full bg-navy-700 px-2 py-0.5 text-xs text-neutral-400">
                        {filhosPorId[item.id] ?? 0} {labelFilhos ?? 'itens'}
                      </span>
                    )}
                  </button>
                ) : (
                  <>
                    <span className="text-neutral-100">{item.nome}</span>
                    {contarFilhos && (
                      <span className="rounded-full bg-navy-700 px-2 py-0.5 text-xs text-neutral-400">
                        {filhosPorId[item.id] ?? 0} {labelFilhos ?? 'itens'}
                      </span>
                    )}
                  </>
                )}
              </div>
              <KebabMenu
                acoes={[
                  { label: 'Editar', onClick: () => abrirEdicao(item) },
                  { label: 'Apagar', onClick: () => setApagando(item), tone: 'perigo' },
                ]}
              />
            </div>
            {renderFilhos && (
              <div
                className={cx(
                  'grid transition-[grid-template-rows] duration-200 ease-out',
                  abertos[item.id] ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className="overflow-hidden">
                  <div className="pt-1">{renderFilhos(item, atualizarContagem)}</div>
                </div>
              </div>
            )}
          </li>
        ))}
        {itens.length === 0 && <p className="anim-fade text-sm text-neutral-500">Nada cadastrado ainda.</p>}
      </ul>

      {modalEdicao.montado && (
        <div
          className={cx(
            'fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4',
            modalEdicao.saindo ? 'anim-fade-out' : 'anim-fade',
          )}
          onClick={aoTentarFechar}
        >
          <div
            className={cx(
              'flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6',
              modalEdicao.saindo ? 'anim-pop-out' : 'anim-pop',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-100">
              {modalEdicao.valor === 'novo' ? `Novo(a) ${singular}` : `Editar ${singular}`}
            </h3>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                salvar()
              }}
            >
            <label className="flex flex-col gap-1 text-sm text-neutral-400">
              Nome
              <input
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value)
                  setSujo(true)
                }}
                autoFocus
                className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-neutral-400">
              Ordem
              <input
                type="number"
                min={1}
                value={order}
                onChange={(e) => {
                  setOrder(Math.max(1, Number(e.target.value)))
                  setSujo(true)
                }}
                className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
              />
            </label>
            {squadPicker && modalEdicao.valor !== 'novo' && (
              <>
                <label className="flex flex-col gap-1 text-sm text-neutral-400">
                  Categoria
                  <select
                    value={categoria}
                    onChange={(e) => {
                      setCategoria(e.target.value as 'padrao' | 'squad')
                      setSujo(true)
                    }}
                    className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                  >
                    <option value="padrao">Padrão do sistema</option>
                    <option value="squad">Squad</option>
                  </select>
                </label>
                {categoria === 'squad' && (
                  <label className="flex flex-col gap-1 text-sm text-neutral-400">
                    Squad
                    <select
                      value={squadId}
                      onChange={(e) => {
                        setSquadId(e.target.value)
                        setSujo(true)
                      }}
                      className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                    >
                      <option value="" disabled>
                        Escolha um squad
                      </option>
                      {squadPicker.squads.map((squad) => (
                        <option key={squad.id} value={squad.id}>
                          {squad.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            )}
            {iconePicker && modalEdicao.valor !== 'novo' && (
              <label className="flex flex-col gap-1 text-sm text-neutral-400">
                Ícone
                <IconePicker
                  valor={iconeEscolhido}
                  onChange={(v) => {
                    setIconeEscolhido(v)
                    setSujo(true)
                  }}
                />
              </label>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!nome.trim() || (Boolean(squadPicker) && categoria === 'squad' && !squadId) || salvando}
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
            </form>
          </div>
        </div>
      )}

      <ModalConfirmarDescarte
        aberto={confirmando}
        onDescartar={confirmarDescarte}
        onCancelar={cancelarDescarte}
      />

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
            <h3 className="text-lg font-semibold text-neutral-100">Apagar {singular}?</h3>
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
