import { useEffect, useState } from 'react'
import { listarSquads } from '../squads/squadsService'
import type { Cargo, Perfil } from './types'
import { perfilPadrao } from './types'

const CARGOS: { value: Cargo; label: string }[] = [
  { value: 'Estagiario', label: 'Estagiário' },
  { value: 'Junior', label: 'Júnior' },
  { value: 'Pleno', label: 'Pleno' },
]

// Grupo de botões de opção (segmented). Genérico pra reusar em cargo/nível.
function OptionGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={
            'rounded-lg border px-3 py-1.5 text-sm transition-colors ' +
            (value === option.value
              ? 'border-gold-400 bg-gold-500/20 text-gold-300'
              : 'border-navy-600 text-neutral-300 hover:border-navy-500')
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

// Escolha de squad e cargo no primeiro acesso — guarda o cargo (recomendação do 1º card, futuro).
export function NivelamentoForm({
  onSubmit,
}: {
  onSubmit: (perfil: Perfil, squadId: string) => void
}) {
  const [squads, setSquads] = useState<{ value: string; label: string }[]>([])
  const [carregandoSquads, setCarregandoSquads] = useState(true)
  const [squadId, setSquadId] = useState('')
  const [cargo, setCargo] = useState<Cargo>('Estagiario')

  useEffect(() => {
    listarSquads()
      .then((lista) => {
        const opcoes = lista.map((s) => ({ value: s.id, label: s.nome }))
        setSquads(opcoes)
        setSquadId((atual) => atual || opcoes[0]?.value || '')
      })
      .finally(() => setCarregandoSquads(false))
  }, [])

  return (
    <div className="flex w-full max-w-lg flex-col gap-6 rounded-xl border border-navy-700 bg-navy-800 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Antes de começar</h2>
        <p className="text-sm text-neutral-400">Só precisamos saber seu squad e seu cargo.</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-300">Seu squad</span>
        {carregandoSquads ? (
          <p className="text-sm text-neutral-500">Carregando...</p>
        ) : (
          <OptionGroup options={squads} value={squadId} onChange={setSquadId} />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-300">Seu cargo</span>
        <OptionGroup options={CARGOS} value={cargo} onChange={setCargo} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onSubmit({ ...perfilPadrao, cargo }, squadId)}
          disabled={!squadId}
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ver minha jornada
        </button>
      </div>
    </div>
  )
}
