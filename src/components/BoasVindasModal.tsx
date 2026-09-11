import { CompassRose } from './CompassRose'
import { Icon } from './Icon'
import { MapCorners } from './MapCorners'
import { TrailDivider } from './TrailDivider'
import { useSaida } from '../hooks/useSaida'
import { cx } from '../utils/cx'

type Topico = { icone: string; titulo: string; texto: string }

const TOPICOS_COLABORADOR: Topico[] = [
  {
    icone: 'explore',
    titulo: 'Sua Jornada',
    texto: 'Uma trilha em fases, do clone ao primeiro card — você sempre sabe qual é o próximo passo.',
  },
  {
    icone: 'menu_book',
    titulo: 'Guia pelo sistema',
    texto: 'Fluxos e vídeos de qualquer área, para consultar sozinho(a) sempre que precisar, sem depender de ninguém.',
  },
  {
    icone: 'key',
    titulo: 'Acessos',
    texto: 'Acompanhe aqui os acessos que seu gestor vai liberando conforme você avança.',
  },
]

const TOPICOS_GESTOR: Topico[] = [
  {
    icone: 'group',
    titulo: 'Supervisionados',
    texto: 'Acompanhe o progresso de cada supervisionado, fase por fase, em tempo real.',
  },
  {
    icone: 'key',
    titulo: 'Acessos',
    texto: 'Marque os acessos liberados de cada supervisionado conforme ele avança.',
  },
  {
    icone: 'build',
    titulo: 'Admin',
    texto: 'Edite o conteúdo da Jornada e do Guia — fases, passos, módulos, fluxos e acessos.',
  },
]

// Duas versões do mesmo modal — conteúdo diferente pra cada sessão (colaborador vê a jornada dele,
// gestor vê o painel dele). Dois gatilhos possíveis, sempre controlados por quem usa: 1x sozinho
// na primeira visita à tela principal de cada sessão (Jornada/Supervisionados — ver `authStore`,
// `boasVindasVistas` por usuário), ou a qualquer momento pelo botão "Como funciona o Bússola?".
export function BoasVindasModal({
  aberto,
  onFechar,
  papel,
}: {
  aberto: boolean
  onFechar: () => void
  papel: 'colaborador' | 'gestor'
}) {
  const { montado, saindo } = useSaida(aberto)
  if (!montado) return null

  const topicos = papel === 'gestor' ? TOPICOS_GESTOR : TOPICOS_COLABORADOR
  const subtitulo =
    papel === 'gestor'
      ? 'Acompanhe o onboarding técnico dos seus supervisionados, do clone ao primeiro card deles.'
      : 'Seu guia de onboarding técnico na Agilean — do clone ao primeiro card.'

  return (
    <div
      className={cx(
        'fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4',
        saindo ? 'anim-fade-out' : 'anim-fade',
      )}
    >
      <div
        className={cx(
          'relative w-full max-w-md overflow-hidden rounded-3xl border border-navy-700 bg-navy-800 p-8 shadow-2xl shadow-black/40',
          saindo ? 'anim-pop-out' : 'anim-pop',
        )}
      >
        <MapCorners tamanho={6} opacidade={30} />
        <CompassRose className="pointer-events-none absolute -bottom-12 -right-12 size-56 text-gold-500 opacity-[0.15]" />

        <div className="relative flex flex-col items-center gap-2 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gold-500/10">
            <CompassRose className="size-8 text-gold-400" />
          </div>
          <h2 className="text-xl font-bold text-neutral-100">Bem-vindo(a) ao Bússola!</h2>
          <p className="text-sm text-neutral-400">{subtitulo}</p>
        </div>

        <TrailDivider className="relative my-6" />

        <ul className="relative flex flex-col gap-4">
          {topicos.map((t) => (
            <li key={t.titulo} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gold-500/40 bg-navy-900 text-gold-400">
                <Icon name={t.icone} className="text-base" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-neutral-100">{t.titulo}</span>
                <span className="text-xs text-neutral-400">{t.texto}</span>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onFechar}
          className="relative mt-7 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-400"
        >
          Vamos começar! <Icon name="arrow_forward" className="text-base" />
        </button>
      </div>
    </div>
  )
}
