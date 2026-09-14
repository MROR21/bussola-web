import { useSaida } from '../hooks/useSaida'
import { cx } from '../utils/cx'
import { Icon } from './Icon'

// Confirmação de "vai perder o que digitou" — usado por cima de um modal de edição (z-40, acima
// do z-30 do modal em si) quando o clique-fora acontece com campos já alterados. Ver
// useConfirmarDescarte.ts.
export function ModalConfirmarDescarte({
  aberto,
  onDescartar,
  onCancelar,
}: {
  aberto: boolean
  onDescartar: () => void
  onCancelar: () => void
}) {
  const { montado, saindo } = useSaida(aberto)
  if (!montado) return null

  return (
    <div
      className={cx(
        'fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4',
        saindo ? 'anim-fade-out' : 'anim-fade',
      )}
      onClick={onCancelar}
    >
      <div
        className={cx(
          'flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6',
          saindo ? 'anim-pop-out' : 'anim-pop',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-100">
          <Icon name="warning" className="text-xl text-amber-400" /> Descartar alterações?
        </h3>
        <p className="text-sm text-neutral-400">
          Você tem mudanças que ainda não foram salvas — elas serão perdidas.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
          >
            Continuar editando
          </button>
          <button
            type="button"
            onClick={onDescartar}
            className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  )
}
