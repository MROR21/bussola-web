import { Icon } from './Icon'
import { MODULO_ICONES } from '../utils/moduloIcones'
import { cx } from '../utils/cx'

// Grade de ícones selecionáveis (lista curada, ver moduloIcones.ts) — usado na criação/edição de
// Módulo, tanto no NovoModuloButton quanto no SimpleEntityCrud (via prop iconePicker).
export function IconePicker({ valor, onChange }: { valor: string; onChange: (icone: string) => void }) {
  return (
    <div className="grid grid-cols-8 gap-1.5 rounded-lg border border-navy-600 bg-navy-900 p-2">
      {MODULO_ICONES.map((icone) => (
        <button
          key={icone}
          type="button"
          onClick={() => onChange(icone)}
          title={icone}
          aria-label={icone}
          className={cx(
            'flex size-8 items-center justify-center rounded-lg transition-colors',
            valor === icone
              ? 'bg-gold-500/20 text-gold-300 ring-1 ring-gold-500/50'
              : 'text-neutral-400 hover:bg-navy-700 hover:text-neutral-200',
          )}
        >
          <Icon name={icone} className="text-lg" />
        </button>
      ))}
    </div>
  )
}
