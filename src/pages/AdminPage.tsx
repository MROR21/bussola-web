import { useState } from 'react'
import { FluxosAdmin } from '../features/admin/FluxosAdmin'
import { PassosAdmin } from '../features/admin/PassosAdmin'
import { SimpleEntityCrud } from '../features/admin/SimpleEntityCrud'
import {
  apagarFase,
  apagarModulo,
  criarFase,
  criarModulo,
  editarFase,
  editarModulo,
  listarFases,
  listarModulos,
} from '../features/admin/adminService'
import { cx } from '../utils/cx'

const ABAS = ['fases', 'modulos', 'passos', 'fluxos'] as const
type Aba = (typeof ABAS)[number]

const LABEL: Record<Aba, string> = {
  fases: 'Fases',
  modulos: 'Módulos',
  passos: 'Passos',
  fluxos: 'Fluxos',
}

// Shell de administração: CRUD completo do conteúdo da Jornada e do Guia, direto no sistema
// (sem depender de alteração de código pra editar texto, ordem ou estrutura).
export function AdminPage() {
  const [aba, setAba] = useState<Aba>('fases')

  return (
    <div className="flex w-full max-w-4xl flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-100">🛠️ Administração</h1>
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
                ? 'bg-purple-500/20 text-purple-200'
                : 'text-neutral-400 hover:text-neutral-200',
            )}
          >
            {LABEL[chave]}
          </button>
        ))}
      </div>

      {aba === 'fases' && (
        <SimpleEntityCrud
          titulo="Fases"
          emoji="🧭"
          singular="fase"
          listar={listarFases}
          criar={criarFase}
          editar={editarFase}
          apagar={apagarFase}
        />
      )}
      {aba === 'modulos' && (
        <SimpleEntityCrud
          titulo="Módulos"
          emoji="📦"
          singular="módulo"
          listar={listarModulos}
          criar={criarModulo}
          editar={editarModulo}
          apagar={apagarModulo}
        />
      )}
      {aba === 'passos' && <PassosAdmin />}
      {aba === 'fluxos' && <FluxosAdmin />}
    </div>
  )
}
