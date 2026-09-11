import { Link } from 'react-router-dom'
import { CompassRose } from '../components/CompassRose'
import { Icon } from '../components/Icon'
import { MapCorners } from '../components/MapCorners'
import { MapIllustration } from '../components/MapIllustration'
import { useAuthStore } from '../features/auth/authStore'
import { useTitulo } from '../hooks/useTitulo'

// Aterrissagem da árvore "Configurações" do menu lateral (mesmo padrão de Jornada/Guias, que
// também expandem pra mostrar os filhos) — escolhe entre Perfil e Chaves de API (essa última só
// pro gestor, gate igual o resto da tela — ver AppLayout.tsx/SessaoAutenticada.tsx).
export function ConfiguracoesPage() {
  useTitulo('Configurações')
  const isGestor = useAuthStore((s) => s.usuario?.isGestor ?? false)

  const opcoes = [
    {
      to: '/perfil',
      icone: 'account_circle',
      titulo: 'Perfil',
      descricao: 'Sua conta, foto e senha.',
    },
    ...(isGestor
      ? [
          {
            to: '/configuracoes/chaves',
            icone: 'key',
            titulo: 'Chaves de API',
            descricao: 'Tokens pra chamar o Bússola de fora, sem logar.',
          },
        ]
      : []),
  ]

  return (
    <div className="relative flex w-full max-w-2xl flex-col gap-6">
      <CompassRose className="pointer-events-none absolute -bottom-16 -right-12 size-72 text-gold-500 opacity-[0.15]" />
      <MapIllustration className="pointer-events-none absolute -top-6 -left-10 w-56 text-gold-500 opacity-[0.06]" />
      <header className="relative flex flex-col gap-1 self-start p-5">
        <MapCorners tamanho={5} opacidade={25} />
        <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-100">
          <Icon name="settings" className="text-2xl text-gold-400" /> Configurações
        </h1>
        <p className="text-sm text-neutral-400">O que você quer ajustar?</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {opcoes.map((opcao) => (
          <Link
            key={opcao.to}
            to={opcao.to}
            className="anim-pop flex flex-col gap-2 rounded-2xl border border-navy-700 bg-navy-800 p-6 transition-colors hover:border-gold-500/50"
          >
            <Icon name={opcao.icone} className="text-3xl text-gold-400" />
            <span className="text-lg font-semibold text-neutral-100">{opcao.titulo}</span>
            <span className="text-sm text-neutral-400">{opcao.descricao}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
