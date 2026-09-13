import { useState } from 'react'
import { CompassRose } from '../components/CompassRose'
import { Icon } from '../components/Icon'
import { MapCorners } from '../components/MapCorners'
import { MapIllustration } from '../components/MapIllustration'
import { useTitulo } from '../hooks/useTitulo'
import { AcessosAdmin } from '../features/admin/AcessosAdmin'
import { FluxosDoModulo } from '../features/admin/FluxosDoModulo'
import { PassosDaFase } from '../features/admin/PassosDaFase'
import { SimpleEntityCrud } from '../features/admin/SimpleEntityCrud'
import { SquadsAdmin } from '../features/admin/SquadsAdmin'
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

const ABAS = ['jornada', 'guias', 'squads', 'acessos', 'usuarios'] as const
type Aba = (typeof ABAS)[number]

const LABEL: Record<Aba, string> = {
  jornada: 'Jornada',
  guias: 'Guia',
  squads: 'Squads',
  acessos: 'Acessos',
  usuarios: 'Usuários',
}

// Shell de administração: CRUD completo do conteúdo da Jornada e do Guia, direto no sistema
// (sem depender de alteração de código pra editar texto, ordem ou estrutura).
export function AdminPage() {
  useTitulo('Admin')
  const [aba, setAba] = useState<Aba>('jornada')

  return (
    <div className="relative flex w-full max-w-4xl flex-col gap-5">
      <CompassRose className="pointer-events-none fixed right-8 top-20 size-72 text-gold-500 opacity-[0.15]" />
      <MapIllustration className="pointer-events-none fixed transition-[left] duration-200 left-[calc(var(--sidebar-w)+1rem)] bottom-8 w-64 text-gold-500 opacity-[0.25]" />
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

      {/* Uma aba só, com o mesmo comportamento de sempre (lista + reorder por setas + CRUD em
          modal) — o dropdown de cada fase (renderFilhos) é onde os passos dela aparecem, em vez
          de uma aba separada. Antes eram 2 abas com rótulo/componente trocados de propósito
          (histórico); unificado a pedido do Miguel pra melhorar a coerência. */}
      {aba === 'jornada' && (
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
            renderFilhos={(fase) => <PassosDaFase faseId={fase.id} />}
          />
        </div>
      )}
      {/* Mesma ideia da Jornada: módulos com reorder + CRUD, dropdown de cada um mostrando seu
          conteúdo (Fluxos/Documentação). UMA identidade "Módulos" só (ícone/título únicos, como já
          era antigamente) — Squads/Padrões do sistema são sub-divisões por baixo, não duas seções
          repetindo "Módulos". A categorização usa o campo real (Modulo.squadId), sem dicionário de
          nome hardcoded. */}
      {aba === 'guias' && (
        <div className="anim-page flex flex-col gap-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-100">
            <Icon name="inventory_2" className="text-xl text-gold-400" /> Módulos
          </h2>
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Squads</h3>
            <SimpleEntityCrud
              titulo="Módulos"
              icone="inventory_2"
              ocultarTitulo
              singular="módulo"
              labelFilhos="itens"
              listar={async () => (await listarModulos()).filter((m) => m.squadId !== null)}
              criar={criarModulo}
              editar={editarModulo}
              apagar={apagarModulo}
              contarFilhos={async () => contarPor(await listarFluxosAdmin(), (f) => f.moduloId)}
              renderFilhos={(modulo) => <FluxosDoModulo moduloId={modulo.id} />}
            />
          </section>
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Padrões do sistema
            </h3>
            <SimpleEntityCrud
              titulo="Módulos"
              icone="inventory_2"
              ocultarTitulo
              singular="módulo"
              labelFilhos="itens"
              listar={async () => (await listarModulos()).filter((m) => m.squadId === null)}
              criar={criarModulo}
              editar={editarModulo}
              apagar={apagarModulo}
              contarFilhos={async () => contarPor(await listarFluxosAdmin(), (f) => f.moduloId)}
              renderFilhos={(modulo) => <FluxosDoModulo moduloId={modulo.id} />}
            />
          </section>
        </div>
      )}
      {aba === 'squads' && (
        <div className="anim-page">
          <SquadsAdmin />
        </div>
      )}
      {aba === 'acessos' && (
        <div className="anim-page">
          <AcessosAdmin />
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
