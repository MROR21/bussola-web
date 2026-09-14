import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { IconePicker } from '../../components/IconePicker'
import { Spinner } from '../../components/Spinner'
import { useSaidaValor } from '../../hooks/useSaida'
import { ICONE_MODULO_PADRAO } from '../../utils/moduloIcones'
import { listarSquads } from '../squads/squadsService'
import type { Squad } from '../squads/types'
import { cx } from '../../utils/cx'
import { criarModulo, listarModulos } from './adminService'

// Botão único de criação de módulo (substitui os dois "+ Novo(a) módulo" que existiam antes, um
// por seção) — a categoria (squad dono, ou nenhum pra "padrão do sistema") é escolhida aqui, na
// criação, em vez de depender de qual seção o admin clicou (ver CriarModuloRequest no back: antes
// nenhum dos dois botões passava squadId nenhum, então TODO módulo novo caía em "padrão do
// sistema" por acidente, não por escolha).
type Categoria = 'padrao' | 'squad'

export function NovoModuloButton({ onCriado }: { onCriado: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [squads, setSquads] = useState<Squad[]>([])
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<Categoria>('padrao')
  const [squadId, setSquadId] = useState<string>('')
  const [icone, setIcone] = useState(ICONE_MODULO_PADRAO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)

  const modal = useSaidaValor(aberto ? true : null)
  const toastFeedback = useSaidaValor(feedback)

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(t)
  }, [feedback])

  async function abrir() {
    setNome('')
    setCategoria('padrao')
    setSquadId('')
    setIcone(ICONE_MODULO_PADRAO)
    setErro(null)
    setAberto(true)
    try {
      const lista = await listarSquads()
      setSquads(lista)
      if (lista.length > 0) setSquadId(lista[0].id)
    } catch {
      // sem squads carregados a categoria "Squad" fica sem opção pra escolher — não trava a criação
    }
  }

  async function salvar() {
    if (!nome.trim()) return
    if (categoria === 'squad' && !squadId) return
    setSalvando(true)
    setErro(null)
    try {
      const modulos = await listarModulos()
      const order = modulos.length > 0 ? Math.max(...modulos.map((m) => m.order)) + 1 : 1
      await criarModulo(nome.trim(), categoria === 'squad' ? squadId : null, order, icone)
      setAberto(false)
      onCriado()
      setFeedback({ texto: 'Módulo criado.', ok: true })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar módulo')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="rounded-lg bg-gold-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gold-400"
      >
        + Novo módulo
      </button>

      {modal.montado && (
        <div
          className={cx(
            'fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4',
            modal.saindo ? 'anim-fade-out' : 'anim-fade',
          )}
          onClick={() => setAberto(false)}
        >
          <div
            className={cx(
              'flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6',
              modal.saindo ? 'anim-pop-out' : 'anim-pop',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-100">Novo módulo</h3>
            <label className="flex flex-col gap-1 text-sm text-neutral-400">
              Nome do módulo
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoFocus
                className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-neutral-400">
              Categoria
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as Categoria)}
                className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
              >
                <option value="padrao">Padrão do sistema</option>
                <option value="squad">Squad</option>
              </select>
              <span className="text-xs text-neutral-500">
                Define onde o módulo aparece na tela de Guias: dentro de um squad, ou em "Padrões
                do sistema" se for um módulo geral (ex.: "Básico do dev"), sem dono específico.
              </span>
            </label>
            {categoria === 'squad' && (
              <label className="flex flex-col gap-1 text-sm text-neutral-400">
                Squad
                <select
                  value={squadId}
                  onChange={(e) => setSquadId(e.target.value)}
                  className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                >
                  {squads.length === 0 && <option value="">Nenhum squad cadastrado</option>}
                  {squads.map((squad) => (
                    <option key={squad.id} value={squad.id}>
                      {squad.nome}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1 text-sm text-neutral-400">
              Ícone
              <IconePicker valor={icone} onChange={setIcone} />
            </label>
            {erro && (
              <p className="flex items-center gap-1.5 text-sm text-red-300">
                <Icon name="warning" className="text-base" /> {erro}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvar}
                disabled={!nome.trim() || (categoria === 'squad' && !squadId) || salvando}
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
