import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { MapCorners } from '../../components/MapCorners'
import { cx } from '../../utils/cx'
import type { FluxoProgresso } from './types'

const MODULO_ICONE: Record<string, string> = {
  'Mão de Obra': 'engineering',
  'Básico do dev': 'handyman',
  'Quiz Quality': 'quiz',
  'Agilean (desktop)': 'desktop_windows',
}
const iconeDoModulo = (m: string) => MODULO_ICONE[m] ?? 'extension'

// Versão em cards (por Módulo) do progresso de Guia de um supervisionado, no lugar da lista
// item-por-item que tinha antes — mesmo padrão visual da GuiasPage (card + barra de progresso),
// clicando expande a lista de fluxos daquele módulo em vez de mostrar tudo de cara.
export function GuiaModulosLeitura({ fluxos }: { fluxos: FluxoProgresso[] }) {
  const [moduloExpandido, setModuloExpandido] = useState<string | null>(null)

  const porModulo = useMemo(() => {
    const grupos = new Map<string, FluxoProgresso[]>()
    for (const f of fluxos) {
      const lista = grupos.get(f.modulo) ?? []
      lista.push(f)
      grupos.set(f.modulo, lista)
    }
    return [...grupos.entries()]
  }, [fluxos])

  if (fluxos.length === 0) return <p className="text-neutral-500">Nenhum fluxo por aqui.</p>

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {porModulo.map(([modulo, itens]) => {
          const feitos = itens.filter((f) => f.concluido).length
          const pct = itens.length > 0 ? Math.round((feitos / itens.length) * 100) : 0
          const expandido = moduloExpandido === modulo
          return (
            <button
              key={modulo}
              type="button"
              onClick={() => setModuloExpandido(expandido ? null : modulo)}
              className={cx(
                'relative flex flex-col gap-2 rounded-2xl border bg-navy-800 p-4 text-left transition-all duration-200 hover:-translate-y-0.5',
                expandido ? 'border-gold-500/60' : 'border-navy-700 hover:border-gold-500/50',
              )}
            >
              <MapCorners tamanho={3} opacidade={20} />
              <div className="flex items-center justify-between">
                <Icon name={iconeDoModulo(modulo)} className="text-xl text-gold-400" />
                <Icon
                  name={expandido ? 'expand_less' : 'expand_more'}
                  className="text-neutral-600"
                />
              </div>
              <h3 className="text-sm font-semibold text-neutral-100">{modulo}</h3>
              <span className="text-xs text-neutral-500">
                {feitos} de {itens.length} concluídos
              </span>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-700">
                <div
                  className="h-full rounded-full bg-gold-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {moduloExpandido && (
        <section className="anim-fade flex flex-col gap-2 rounded-2xl border border-navy-700 bg-navy-800 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {moduloExpandido}
          </h4>
          <ul className="flex flex-col gap-1.5">
            {porModulo
              .find(([m]) => m === moduloExpandido)?.[1]
              .map((f) => (
                <li key={f.id} className="flex items-center gap-2 text-sm">
                  <Icon
                    name={f.concluido ? 'check_circle' : 'radio_button_unchecked'}
                    className={cx('text-base', f.concluido ? 'text-gold-400' : 'text-neutral-600')}
                    fill={f.concluido}
                  />
                  <span className={f.concluido ? 'text-neutral-300' : 'text-neutral-500'}>
                    {f.titulo}
                  </span>
                  {f.doSquad && (
                    <span
                      title="Faz parte da jornada dele"
                      className="rounded-full bg-gold-500/20 px-1.5 py-0.5 text-[10px] text-gold-400"
                    >
                      do squad
                    </span>
                  )}
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  )
}
