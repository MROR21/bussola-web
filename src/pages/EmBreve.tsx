import { CompassRose } from '../components/CompassRose'
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
    <div className="anim-fade relative flex w-full max-w-md flex-col items-center">
      <CompassRose className="pointer-events-none absolute -right-10 -top-4 size-64 text-gold-500 opacity-[0.15]" />
      <MapIllustration className="pointer-events-none absolute -bottom-10 -left-8 w-56 text-gold-500 opacity-[0.06]" />
      <div className="relative flex flex-col items-center gap-3 p-10 text-center">
        <MapCorners tamanho={5} opacidade={25} />
        <Icon name={icone} className="text-4xl text-neutral-500" />
        <h2 className="text-xl font-semibold text-neutral-100">{titulo}</h2>
        <p className="text-sm text-neutral-400">{descricao}</p>
        <span className="rounded-full bg-navy-700 px-3 py-1 text-xs text-neutral-400">Em breve</span>
      </div>
    </div>
  )
}
