import { useState } from 'react'
import { CompassRose } from '../components/CompassRose'
import { Icon } from '../components/Icon'
import { MapCorners } from '../components/MapCorners'
import { MapIllustration } from '../components/MapIllustration'
import { useTitulo } from '../hooks/useTitulo'
import { GuiasAdmin } from '../features/admin/GuiasAdmin'
import { PassosAdmin } from '../features/admin/PassosAdmin'
import { SimpleEntityCrud } from '../features/admin/SimpleEntityCrud'
import { UsuariosAdmin } from '../features/admin/UsuariosAdmin'
import {
  apagarFase,
  apagarModulo,
  criarFase,
  criarModulo,
  editarFase,
  editarModulo,
  listarFases,
  listarFluxosAdmin,
  listarModulos,
  listarPassosAdmin,
} from '../features/admin/adminService'
import { cx } from '../utils/cx'

// Conta quantos itens de `lista` apontam pra cada valor retornado por `chaveDe` — usado pra
// mostrar "N passos"/"N fluxos" ao lado de cada Fase/Módulo, sem precisar de endpoint novo.
function contarPor<T>(lista: T[], chaveDe: (item: T) => string): Record<string, number> {
  const contagem: Record<string, number> = {}
  for (const item of lista) {
    const valor = chaveDe(item)
    contagem[valor] = (contagem[valor] ?? 0) + 1
  }
  return contagem
}

const ABAS = ['fases', 'modulos', 'passos', 'guias', 'usuarios'] as const
type Aba = (typeof ABAS)[number]

const LABEL: Record<Aba, string> = {
  fases: 'Fases',
  modulos: 'Módulos',
  passos: 'Passos',
  guias: 'Guias',
  usuarios: 'Usuários',
}

// Shell de administração: CRUD completo do conteúdo da Jornada e do Guia, direto no sistema
// (sem depender de alteração de código pra editar texto, ordem ou estrutura).
export function AdminPage() {
  useTitulo('Admin')
  const [aba, setAba] = useState<Aba>('fases')

  return (
    <div className="relative flex w-full max-w-4xl flex-col gap-5">
      <CompassRose className="pointer-events-none absolute -right-10 -top-8 size-72 text-gold-500 opacity-[0.06]" />
      <MapIllustration className="pointer-events-none absolute -bottom-6 -left-10 w-64 text-gold-500 opacity-[0.06]" />
      <div className="relative flex flex-col gap-1 self-start p-5">
        <MapCorners tamanho={5} opacidade={25} />
        <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-100">
          <Icon name="build" className="text-2xl text-gold-400" /> Administração
        </h1>
        <p className="text-sm text-neutral-500">
          Edite o conteúdo da Jornada e do Guia pelo sistema.
        </p>
      </div>

      <div className="flex gap-2">
        {ABAS.map((chave) => (
          <button
            key={chave}
            type="button"
            onClick={() => setAba(chave)}
            className={cx(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              aba === chave
                ? 'bg-gold-500/20 text-gold-300'
                : 'text-neutral-400 hover:text-neutral-200',
            )}
          >
            {LABEL[chave]}
          </button>
        ))}
      </div>

      {aba === 'fases' && (
        <div className="anim-page">
          <SimpleEntityCrud
            titulo="Fases"
            icone="route"
            singular="fase"
            labelFilhos="passos"
            listar={listarFases}
            criar={criarFase}
            editar={editarFase}
            apagar={apagarFase}
            contarFilhos={async () => contarPor(await listarPassosAdmin(), (p) => p.faseId)}
          />
        </div>
      )}
      {aba === 'modulos' && (
        <div className="anim-page">
          <SimpleEntityCrud
            titulo="Módulos"
            icone="inventory_2"
            singular="módulo"
            labelFilhos="fluxos"
            listar={listarModulos}
            criar={criarModulo}
            editar={editarModulo}
            apagar={apagarModulo}
            contarFilhos={async () => contarPor(await listarFluxosAdmin(), (f) => f.moduloId)}
          />
        </div>
      )}
      {aba === 'passos' && (
        <div className="anim-page">
          <PassosAdmin />
        </div>
      )}
      {aba === 'guias' && (
        <div className="anim-page">
          <GuiasAdmin />
        </div>
      )}
      {aba === 'usuarios' && (
        <div className="anim-page">
          <UsuariosAdmin />
        </div>
      )}
    </div>
  )
}
