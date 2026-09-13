import type { SkillArea } from '../onboarding/types'
import type { Cargo } from '../nivelamento/types'
import type { TipoConteudo } from '../fluxos/types'

// Fase e Módulo são só nome+ordem — a mesma forma serve pros dois (ver SimpleEntityCrud).
export interface EntidadeSimples {
  id: string
  nome: string
  order: number
}

export type Fase = EntidadeSimples

// Squad como o admin edita — `moduloNome` é o nome do módulo vinculado (nasceu junto do squad,
// mas pode ter nome diferente, ver POST/PUT /admin/squads). Sem `order` exposto pro admin editar
// (squads não têm reordenação — a lista só mostra na ordem de criação).
export interface SquadAdmin {
  id: string
  nome: string
  order: number
  moduloNome: string
}

// Módulo já vem com o vínculo de squad (nullable — null = "padrão do sistema", ex. "Básico do
// dev", criado à mão; preenchido = nasceu junto de um squad, ver POST /admin/squads).
export interface Modulo extends EntidadeSimples {
  squadId: string | null
}

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
  videoUrl: string
}

export type PassoAdminInput = Omit<PassoAdmin, 'id'>

// Um fluxo do Guia como o admin edita (espelha FluxoRequest/a projeção de GET /admin/fluxos).
// `squad` já vem com o nome pronto (denormalizado pelo back) — só exibição; quem edita usa `squadId`.
export interface FluxoAdmin {
  id: string
  order: number
  moduloId: string
  squadId: string | null
  squad: string | null
  tipo: TipoConteudo
  categoria: string
  titulo: string
  descricao: string
  conteudo: string
  videoUrl: string
}

export type FluxoAdminInput = Omit<FluxoAdmin, 'id' | 'squad'>

// Um usuário como a tela "Usuários" do admin lista (espelha GET /admin/usuarios).
export interface UsuarioAdmin {
  id: string
  nome: string
  email: string
  cargo: Cargo
  squadId: string
  squad: string
  isGestor: boolean
  ativo: boolean
  gestorId: string | null
}

// Um e-mail pré-autorizado a virar gestor no cadastro (espelha GET /admin/emails-autorizados).
export interface EmailAutorizado {
  id: string
  email: string
}

// Um acesso a liberar (ex.: "E-mail Agilean") como o admin edita (espelha AcessoRequest/a
// projeção de GET /admin/acessos). `cargoMinimo` é cumulativo — ver Acesso.cs no back.
export interface AcessoAdmin {
  id: string
  nome: string
  link: string
  cargoMinimo: Cargo
  order: number
}

export type AcessoAdminInput = Omit<AcessoAdmin, 'id'>
