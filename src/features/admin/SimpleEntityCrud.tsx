import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Carregando, Spinner } from '../../components/Spinner'
import { useSaidaValor } from '../../hooks/useSaida'
import { cx } from '../../utils/cx'
import type { EntidadeSimples } from './types'

// CRUD de Fase ou Módulo — a mesma forma (nome+ordem) serve pros dois, só troca os services e os
// textos. Cria/edita num modal; apaga com confirmação (o back já bloqueia se houver vínculo).
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
}) {
  const [itens, setItens] = useState<EntidadeSimples[]>([])
  const [filhosPorId, setFilhosPorId] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState<EntidadeSimples | 'novo' | null>(null)
  const [nome, setNome] = useState('')
  const [order, setOrder] = useState(1)
  const [salvando, setSalvando] = useState(false)
  const [apagando, setApagando] = useState<EntidadeSimples | null>(null)
  const [movendo, setMovendo] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)

  const modalEdicao = useSaidaValor(editando)
  const modalApagar = useSaidaValor(apagando)
  const toastFeedback = useSaidaValor(feedback)

  // FLIP: guarda a posição de cada linha ANTES do reordenar (ainda na ordem antiga) pra, depois
  // que a lista chega na ordem nova, animar cada linha da posição antiga até a atual em vez de só
  // "pipocar" direto no lugar certo.
  const refsLinhas = useRef(new Map<string, HTMLLIElement>())
  const posicoesAntes = useRef<Map<string, DOMRect> | null>(null)

  useLayoutEffect(() => {
    const antes = posicoesAntes.current
    if (!antes) return
    posicoesAntes.current = null

    refsLinhas.current.forEach((linha, id) => {
      const rectAntes = antes.get(id)
      if (!rectAntes) return
      const deltaY = rectAntes.top - linha.getBoundingClientRect().top
      if (Math.abs(deltaY) < 1) return
      linha.style.transition = 'none'
      linha.style.transform = `translateY(${deltaY}px)`
      linha.getBoundingClientRect() // força o navegador a aplicar o transform acima antes da próxima linha
      requestAnimationFrame(() => {
        linha.style.transition = 'transform 220ms ease-out'
        linha.style.transform = ''
      })
    })
  }, [itens])

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

  // Troca a ordem com o vizinho (cima/baixo) — dois PUTs simples, sem endpoint de reordenar novo.
  async function mover(item: EntidadeSimples, direcao: -1 | 1) {
    const indice = itens.findIndex((i) => i.id === item.id)
    const vizinho = itens[indice + direcao]
    if (!vizinho) return

    const rects = new Map<string, DOMRect>()
    refsLinhas.current.forEach((linha, id) => rects.set(id, linha.getBoundingClientRect()))
    posicoesAntes.current = rects

    setMovendo(item.id)
    try {
      await Promise.all([
        editar(item.id, item.nome, vizinho.order),
        editar(vizinho.id, vizinho.nome, item.order),
      ])
      await carregar()
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao reordenar', ok: false })
    } finally {
      setMovendo(null)
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
  }

  function abrirEdicao(item: EntidadeSimples) {
    setNome(item.nome)
    setOrder(item.order)
    setEditando(item)
  }

  async function salvar() {
    if (!nome.trim()) return
    setSalvando(true)
    try {
      if (editando === 'novo') {
        await criar(nome.trim(), order)
      } else if (editando) {
        await editar(editando.id, nome.trim(), order)
      }
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
      await apagar(alvo.id)
      await carregar()
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao apagar', ok: false })
    }
  }

  if (loading) return <Carregando texto="Carregando..." />
  if (error) return <p className="text-red-400">Erro: {error}</p>

  return (
    <div className="anim-fade flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-100">
          <Icon name={icone} className="text-xl text-gold-400" /> {titulo}
        </h2>
        <button
          type="button"
          onClick={abrirNovo}
          className="rounded-lg bg-gold-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gold-400"
        >
          + Novo(a) {singular}
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {itens.map((item, indice) => (
          <li
            key={item.id}
            ref={(el) => {
              if (el) refsLinhas.current.set(item.id, el)
              else refsLinhas.current.delete(item.id)
            }}
            className={cx(
              'flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors',
              movendo === item.id ? 'border-gold-500/50 bg-navy-700' : 'border-navy-700 bg-navy-800',
            )}
          >
            <div className="flex items-center gap-3">
              {movendo === item.id ? (
                <Spinner className="text-gold-400" />
              ) : (
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => mover(item, -1)}
                    disabled={indice === 0 || movendo !== null}
                    className="leading-none text-neutral-500 transition-all hover:text-neutral-200 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Mover pra cima"
                  >
                    <Icon name="arrow_drop_up" className="text-lg" />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(item, 1)}
                    disabled={indice === itens.length - 1 || movendo !== null}
                    className="-mt-2 leading-none text-neutral-500 transition-all hover:text-neutral-200 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Mover pra baixo"
                  >
                    <Icon name="arrow_drop_down" className="text-lg" />
                  </button>
                </div>
              )}
              <span className="text-xs text-neutral-500">#{item.order}</span>
              <span className="text-neutral-100">{item.nome}</span>
              {contarFilhos && (
                <span className="rounded-full bg-navy-700 px-2 py-0.5 text-xs text-neutral-400">
                  {filhosPorId[item.id] ?? 0} {labelFilhos ?? 'itens'}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => abrirEdicao(item)}
                className="text-sm text-gold-400 transition-colors hover:text-gold-300"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setApagando(item)}
                className="text-sm text-red-400 transition-colors hover:text-red-300"
              >
                Apagar
              </button>
            </div>
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
          onClick={() => setEditando(null)}
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
            <label className="flex flex-col gap-1 text-sm text-neutral-400">
              Nome
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoFocus
                className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-neutral-400">
              Ordem
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvar}
                disabled={!nome.trim() || salvando}
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
