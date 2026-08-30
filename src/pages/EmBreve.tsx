import { Icon } from '../components/Icon'
import { MapCorners } from '../components/MapCorners'
import { MapIllustration } from '../components/MapIllustration'
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
    <div className="relative flex max-w-md flex-col items-center gap-3 overflow-hidden rounded-2xl border border-navy-700 bg-navy-800 p-10 text-center">
      <MapCorners tamanho={5} opacidade={25} />
      <MapIllustration className="pointer-events-none absolute -bottom-4 -right-6 -z-10 w-40 text-gold-500 opacity-[0.06]" />
      <Icon name={icone} className="text-4xl text-neutral-500" />
      <h2 className="text-xl font-semibold text-neutral-100">{titulo}</h2>
      <p className="text-sm text-neutral-400">{descricao}</p>
      <span className="rounded-full bg-navy-700 px-3 py-1 text-xs text-neutral-400">Em breve</span>
    </div>
  )
}
