import type { SkillArea } from '../onboarding/types'
import type { Squad } from '../nivelamento/types'

// Fase e Módulo são só nome+ordem — a mesma forma serve pros dois (ver SimpleEntityCrud).
export interface EntidadeSimples {
  id: string
  nome: string
  order: number
}

export type Fase = EntidadeSimples
export type Modulo = EntidadeSimples

// Um passo da Jornada como o admin edita (espelha PassoRequest/a projeção de GET /admin/passos).
export interface PassoAdmin {
  id: string
  order: number
  faseId: string
  title: string
  description: string
  isCompanySpecific: boolean
  skillArea: SkillArea
  conteudo: string
}

export type PassoAdminInput = Omit<PassoAdmin, 'id'>

// Um fluxo do Guia como o admin edita (espelha FluxoRequest/a projeção de GET /admin/fluxos).
export interface FluxoAdmin {
  id: string
  order: number
  moduloId: string
  squad: Squad | null
  categoria: string
  titulo: string
  descricao: string
  conteudo: string
  videoUrl: string
}

export type FluxoAdminInput = Omit<FluxoAdmin, 'id'>
