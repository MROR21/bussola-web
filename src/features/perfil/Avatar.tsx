import { cx } from '../../utils/cx'

// Iniciais do nome: 1ª letra do primeiro e do último nome (ou as 2 primeiras se for só um).
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

// Avatar do usuário: mostra a foto (data URI) quando há; senão, as iniciais num círculo.
// O tamanho/fonte vem por className do chamador (ex.: "size-9 text-sm").
export function Avatar({
  nome,
  foto,
  className,
}: {
  nome: string
  foto?: string
  className?: string
}) {
  const base = cx(
    'flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-purple-500/20 font-semibold text-purple-200',
    className,
  )
  if (foto) {
    return <img src={foto} alt={nome} className={cx(base, 'object-cover')} />
  }
  return <span className={base}>{iniciais(nome)}</span>
}
