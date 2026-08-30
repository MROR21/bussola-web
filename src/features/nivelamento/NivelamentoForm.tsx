import { useState } from 'react'
import type { Cargo, Perfil, SkillLevel, Squad } from './types'
import { perfilPadrao } from './types'

const CARGOS: { value: Cargo; label: string }[] = [
  { value: 'Estagiario', label: 'Estagiário' },
  { value: 'Junior', label: 'Júnior' },
  { value: 'Pleno', label: 'Pleno' },
]

const SQUADS: { value: Squad; label: string }[] = [
  { value: 'MaoDeObra', label: 'Mão de Obra' },
  { value: 'QuizQuality', label: 'Quiz Quality' },
  { value: 'Agilean', label: 'Agilean (desktop)' },
]

const NIVEIS: { value: SkillLevel; label: string }[] = [
  { value: 'Nenhum', label: 'Nenhum' },
  { value: 'Basico', label: 'Básico' },
  { value: 'Confortavel', label: 'Confortável' },
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

// Questionário de nivelamento. Hoje afina o Git (único que muda a trilha) + guarda o cargo
// (recomendação do 1º card, futuro). Pulável: "Pular" usa o perfil padrão (trilha completa essencial).
export function NivelamentoForm({
  onSubmit,
  onSkip,
}: {
  onSubmit: (perfil: Perfil, squad: Squad) => void
  onSkip: (squad: Squad) => void
}) {
  const [squad, setSquad] = useState<Squad>('MaoDeObra')
  const [cargo, setCargo] = useState<Cargo>('Estagiario')
  const [git, setGit] = useState<SkillLevel>('Nenhum')

  return (
    <div className="flex w-full max-w-lg flex-col gap-6 rounded-xl border border-navy-700 bg-navy-800 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Vamos personalizar sua trilha</h2>
        <p className="text-sm text-neutral-400">
          Rápido — só ajusta a profundidade do que você já domina. O específico da
          Agilean aparece sempre.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-300">Seu squad</span>
        <OptionGroup options={SQUADS} value={squad} onChange={setSquad} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-300">Seu cargo</span>
        <OptionGroup options={CARGOS} value={cargo} onChange={setCargo} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-300">
          Quão confortável você é com Git?
        </span>
        <OptionGroup options={NIVEIS} value={git} onChange={setGit} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onSubmit({ ...perfilPadrao, cargo, git }, squad)}
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-400"
        >
          Ver minha trilha
        </button>
        <button
          type="button"
          onClick={() => onSkip(squad)}
          className="text-sm text-neutral-400 hover:text-neutral-200"
        >
          Pular (trilha completa)
        </button>
      </div>
    </div>
  )
}
