import { useEffect, useRef, useState } from 'react'
import { useSaida } from '../hooks/useSaida'
import { cx } from '../utils/cx'
import { Icon } from './Icon'

export interface AcaoKebab {
  label: string
  onClick: () => void
  // 'perigo' (vermelho) pras ações destrutivas (Apagar, Revogar); sem tone = dourado (padrão,
  // ações normais tipo Editar); 'sucesso' (verde) pra reverter algo destrutivo (Reativar).
  tone?: 'perigo' | 'sucesso'
  disabled?: boolean
  title?: string
}

// Menu de "mais ações" (3 pontinhos) — substitui deixar 2+ ações expostas lado a lado numa linha
// de lista (Editar/Apagar, Tornar supervisor/Revogar acesso etc.), mesmo padrão de dropdown do
// sino de notificações (useSaida + clique fora fecha).
export function KebabMenu({ acoes }: { acoes: AcaoKebab[] }) {
  const [aberto, setAberto] = useState(false)
  const { montado, saindo } = useSaida(aberto)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    function aoClicarFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [aberto])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-label="Mais ações"
        className="flex size-7 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-navy-700 hover:text-neutral-200"
      >
        <Icon name="more_vert" className="text-lg" />
      </button>
      {montado && (
        <div
          className={cx(
            'absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-navy-700 bg-navy-800 py-1 shadow-lg',
            saindo ? 'anim-pop-out' : 'anim-pop',
          )}
        >
          {acoes.map((acao) => (
            <button
              key={acao.label}
              type="button"
              disabled={acao.disabled}
              title={acao.title}
              onClick={() => {
                setAberto(false)
                acao.onClick()
              }}
              className={cx(
                'block w-full px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                acao.tone === 'perigo'
                  ? 'text-red-400 hover:bg-navy-700 hover:text-red-300'
                  : acao.tone === 'sucesso'
                    ? 'text-green-400 hover:bg-navy-700 hover:text-green-300'
                    : 'text-gold-400 hover:bg-navy-700 hover:text-gold-300',
              )}
            >
              {acao.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
