import type { ReactNode } from 'react'
import { cx } from '../utils/cx'
import { Icon } from './Icon'

// Dropdown controlado por state do React (não `<details>` nativo) — usado nos accordions do Admin
// (Guias/Passos). O `<details>` nativo com CSS puro (grid-rows + display override) não animava de
// forma confiável na prática (reportado ao vivo), então trocamos pra essa versão: quem abre/fecha é
// sempre um clique tratado em JS, e a altura anima via grid-rows (0fr → 1fr) igual ao menu lateral
// e aos drops do Supervisionado — a mesma técnica que já se provou funcionando nesses dois lugares.
export function Acordeao({
  titulo,
  contagem,
  aberto,
  onToggle,
  variante = 'card',
  className,
  children,
}: {
  titulo: ReactNode
  contagem?: number
  aberto: boolean
  onToggle: () => void
  variante?: 'card' | 'linha'
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cx(
        variante === 'card'
          ? 'rounded-2xl border border-navy-700 bg-navy-800 p-4'
          : 'py-3',
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cx(
          'flex w-full cursor-pointer items-center justify-between gap-2 text-left',
          variante === 'card'
            ? 'text-sm font-semibold uppercase tracking-wide text-neutral-300'
            : 'text-sm font-medium text-neutral-100',
        )}
      >
        <span>
          {titulo}
          {contagem !== undefined && (
            <span className="ml-1 text-xs font-normal normal-case text-neutral-500">
              ({contagem})
            </span>
          )}
        </span>
        <Icon
          name="expand_more"
          className={cx(
            'shrink-0 text-neutral-500 transition-transform duration-200',
            aberto && 'rotate-180',
          )}
        />
      </button>
      <div
        className={cx(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  )
}
