import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { useSaida } from '../hooks/useSaida'
import { cx } from '../utils/cx'

// Substitui o calendário nativo do `<input type="date">` — no Chrome/Edge esse popup é desenhado
// pelo próprio navegador (fora do DOM da página), então nenhum CSS alcança ele; pra ter uma cara
// "carta de navegação" (navy + dourado) igual ao resto do Bússola, precisa ser um componente
// próprio, com o dropdown feito em HTML normal.

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

// `yyyy-MM-dd` -> Date local (meio-dia evitaria o problema, mas aqui é sempre meia-noite local
// mesmo — nunca passa por `new Date(iso)`, que interpretaria como UTC e viraria o dia anterior
// dependendo do fuso).
function paraData(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

function paraIso(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function CampoData({
  value,
  onChange,
  min,
  className,
}: {
  value: string
  onChange: (value: string) => void
  min?: string
  className?: string
}) {
  const [aberto, setAberto] = useState(false)
  const popover = useSaida(aberto)
  const [mesExibido, setMesExibido] = useState(() => {
    const d = paraData(value || paraIso(new Date()))
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    const d = paraData(value || paraIso(new Date()))
    setMesExibido(new Date(d.getFullYear(), d.getMonth(), 1))
  }, [aberto, value])

  useEffect(() => {
    if (!aberto) return
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('mousedown', aoClicarFora)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('mousedown', aoClicarFora)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  const minData = min ? paraData(min) : null
  const selecionado = value ? paraData(value) : null
  const hoje = new Date()

  function selecionar(data: Date) {
    if (minData && data < minData) return
    onChange(paraIso(data))
    setAberto(false)
  }

  const primeiroDiaDoMes = new Date(mesExibido.getFullYear(), mesExibido.getMonth(), 1)
  const inicioGrade = new Date(primeiroDiaDoMes)
  inicioGrade.setDate(inicioGrade.getDate() - primeiroDiaDoMes.getDay())
  const dias = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicioGrade)
    d.setDate(inicioGrade.getDate() + i)
    return d
  })

  return (
    <div ref={containerRef} className={cx('relative', className)}>
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-left text-neutral-100 outline-none transition-colors focus:border-gold-500"
      >
        {value ? paraData(value).toLocaleDateString('pt-BR') : 'Selecione'}
        <Icon name="calendar_month" className="text-base text-gold-400" />
      </button>

      {popover.montado && (
        <div
          className={cx(
            'absolute z-20 mt-2 w-72 rounded-2xl border border-gold-500/30 bg-navy-800 p-4 shadow-xl shadow-black/40',
            popover.saindo ? 'anim-pop-out' : 'anim-pop',
          )}
        >
          <div className="flex items-center justify-between pb-3">
            <button
              type="button"
              onClick={() => setMesExibido((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-navy-700 hover:text-gold-400"
            >
              <Icon name="chevron_left" />
            </button>
            <span className="text-sm font-medium text-neutral-100">
              {MESES[mesExibido.getMonth()]} de {mesExibido.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setMesExibido((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-navy-700 hover:text-gold-400"
            >
              <Icon name="chevron_right" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {DIAS_SEMANA.map((d, i) => (
              <span key={i} className="py-1 text-xs text-neutral-500">
                {d}
              </span>
            ))}
            {dias.map((d) => {
              const foraDoMes = d.getMonth() !== mesExibido.getMonth()
              const desabilitado = minData !== null && d < minData
              const isSelecionado = selecionado !== null && mesmoDia(d, selecionado)
              const isHoje = mesmoDia(d, hoje)
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={desabilitado}
                  onClick={() => selecionar(d)}
                  className={cx(
                    'rounded-full py-1.5 text-sm transition-colors',
                    foraDoMes && !isSelecionado ? 'text-neutral-600' : 'text-neutral-200',
                    desabilitado ? 'cursor-not-allowed opacity-30' : !isSelecionado && 'hover:bg-navy-700',
                    isSelecionado && 'bg-gold-500 text-white',
                    !isSelecionado && isHoje && 'border border-gold-500/60',
                  )}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={() => selecionar(hoje)}
              className="text-sm text-gold-400 transition-colors hover:text-gold-300"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
