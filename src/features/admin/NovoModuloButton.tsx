import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { Spinner } from '../../components/Spinner'
import { useSaidaValor } from '../../hooks/useSaida'
import { listarSquads } from '../squads/squadsService'
import type { Squad } from '../squads/types'
import { cx } from '../../utils/cx'
import { criarModulo, listarModulos } from './adminService'

// Botão único de criação de módulo (substitui os dois "+ Novo(a) módulo" que existiam antes, um
// por seção) — a categoria (squad dono, ou nenhum pra "padrão do sistema") é escolhida aqui, na
// criação, em vez de depender de qual seção o admin clicou (ver CriarModuloRequest no back: antes
// nenhum dos dois botões passava squadId nenhum, então TODO módulo novo caía em "padrão do
// sistema" por acidente, não por escolha).
export function NovoModuloButton({ onCriado }: { onCriado: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [squads, setSquads] = useState<Squad[]>([])
  const [nome, setNome] = useState('')
  const [squadId, setSquadId] = useState<string>('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const modal = useSaidaValor(aberto ? true : null)

  async function abrir() {
    setNome('')
    setSquadId('')
    setErro(null)
    setAberto(true)
    try {
      setSquads(await listarSquads())
    } catch {
      // sem squads carregados o select só fica com "Padrão do sistema" — não trava a criação
    }
  }

  async function salvar() {
    if (!nome.trim()) return
    setSalvando(true)
    setErro(null)
    try {
      const modulos = await listarModulos()
      const order = modulos.length > 0 ? Math.max(...modulos.map((m) => m.order)) + 1 : 1
      await criarModulo(nome.trim(), squadId || null, order)
      setAberto(false)
      onCriado()
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
                value={squadId}
                onChange={(e) => setSquadId(e.target.value)}
                className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
              >
                <option value="">Padrão do sistema</option>
                {squads.map((squad) => (
                  <option key={squad.id} value={squad.id}>
                    {squad.nome}
                  </option>
                ))}
              </select>
              <span className="text-xs text-neutral-500">
                Define onde o módulo aparece na tela de Guias: dentro do squad escolhido, ou em
                "Padrões do sistema" se for um módulo geral (ex.: "Básico do dev"), sem dono
                específico.
              </span>
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
    </>
  )
}
