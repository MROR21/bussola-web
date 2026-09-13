import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Spinner } from '../../components/Spinner'
import { useSaidaValor } from '../../hooks/useSaida'
import { listarSquads } from '../squads/squadsService'
import type { Squad } from '../squads/types'
import { cx } from '../../utils/cx'
import { mudarSquadModulo } from './adminService'
import type { EntidadeSimples } from './types'

type Categoria = 'padrao' | 'squad'

// Modal de "Mudar categoria" de um módulo já existente — o jeito de corrigir/desfazer um vínculo
// com squad feito na criação (seja pelo NovoModuloButton, seja pelo "vincular módulo existente" do
// SquadsAdmin). Antes disso não existia NENHUM jeito de reverter esse vínculo pela tela.
export function TrocarSquadModuloModal({
  modulo,
  squadIdAtual,
  onFechar,
  onSalvo,
}: {
  modulo: EntidadeSimples | null
  squadIdAtual: string | null
  onFechar: () => void
  onSalvo: () => void
}) {
  const [squads, setSquads] = useState<Squad[]>([])
  const [categoria, setCategoria] = useState<Categoria>('padrao')
  const [squadId, setSquadId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const modal = useSaidaValor(modulo)

  useEffect(() => {
    if (!modulo) return
    setErro(null)
    setCategoria(squadIdAtual ? 'squad' : 'padrao')
    setSquadId(squadIdAtual ?? '')
    listarSquads()
      .then(setSquads)
      .catch(() => {})
  }, [modulo, squadIdAtual])

  async function salvar() {
    if (!modulo) return
    if (categoria === 'squad' && !squadId) return
    setSalvando(true)
    setErro(null)
    try {
      await mudarSquadModulo(modulo.id, categoria === 'squad' ? squadId : null)
      onSalvo()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao mudar a categoria')
    } finally {
      setSalvando(false)
    }
  }

  if (!modal.montado) return null

  return (
    <div
      className={cx(
        'fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4',
        modal.saindo ? 'anim-fade-out' : 'anim-fade',
      )}
      onClick={onFechar}
    >
      <div
        className={cx(
          'flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6',
          modal.saindo ? 'anim-pop-out' : 'anim-pop',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {modal.valor && (
          <>
            <h3 className="text-lg font-semibold text-neutral-100">
              Mudar categoria de "{modal.valor.nome}"
            </h3>
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
            </label>
            {categoria === 'squad' && (
              <label className="flex flex-col gap-1 text-sm text-neutral-400">
                Squad
                <select
                  value={squadId}
                  onChange={(e) => setSquadId(e.target.value)}
                  className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
                >
                  <option value="" disabled>
                    Escolha um squad
                  </option>
                  {squads.map((squad) => (
                    <option key={squad.id} value={squad.id}>
                      {squad.nome}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {erro && (
              <p className="flex items-center gap-1.5 text-sm text-red-300">
                <Icon name="warning" className="text-base" /> {erro}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onFechar}
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvar}
                disabled={(categoria === 'squad' && !squadId) || salvando}
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
  )
}
