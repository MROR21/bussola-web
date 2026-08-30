import { Icon } from '../components/Icon'
import { useTitulo } from '../hooks/useTitulo'

// Placeholder de seção ainda não construída — mantém a moldura navegável.
export function EmBreve({
  icone,
  titulo,
  descricao,
}: {
  icone: string
  titulo: string
  descricao: string
}) {
  useTitulo(titulo)

  return (
    <div className="flex max-w-md flex-col items-center gap-3 rounded-2xl border border-navy-700 bg-navy-800 p-10 text-center">
      <Icon name={icone} className="text-4xl text-neutral-500" />
      <h2 className="text-xl font-semibold text-neutral-100">{titulo}</h2>
      <p className="text-sm text-neutral-400">{descricao}</p>
      <span className="rounded-full bg-navy-700 px-3 py-1 text-xs text-neutral-400">Em breve</span>
    </div>
  )
}
