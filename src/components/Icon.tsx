// Ícone via Material Symbols (fonte com ligature — o texto vira o glifo). Substitui os emojis do
// app por algo que não parece "genérico"/copiado de outro sistema (pedido do gestor). `fill` deixa
// o traço preenchido (equivalente ao estado "ativo"/selecionado em vez do outline padrão).
export function Icon({
  name,
  className = '',
  fill = false,
  title,
}: {
  name: string
  className?: string
  fill?: boolean
  title?: string
}) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
      title={title}
      aria-hidden={title ? undefined : true}
    >
      {name}
    </span>
  )
}
