import { apiGet, apiPost, apiSend } from '../../services/api'
import type {
  EntidadeSimples,
  Fase,
  Modulo,
  SquadAdmin,
  FluxoAdmin,
  FluxoAdminInput,
  PassoAdmin,
  PassoAdminInput,
  UsuarioAdmin,
  EmailAutorizado,
  AcessoAdmin,
  AcessoAdminInput,
} from './types'

// Squads (sem reordenação exposta — order é gerido por conta própria dentro de SquadsAdmin.tsx).
// Criar e editar aceitam OU um nome de módulo novo OU o id de um módulo "padrão do sistema" já
// existente pra adotar (nunca os dois — ver SquadRequest no back). Editar normalmente só renomeia
// o vínculo já feito ({nome}); o formato de escolha ({id}) só entra quando o squad está sem módulo
// (estado quebrado — ver moduloNome null em SquadAdmin).
export const listarSquadsAdmin = () => apiGet<SquadAdmin[]>('/admin/squads')
export const criarSquad = (
  nome: string,
  order: number,
  modulo: { nome: string } | { id: string },
) =>
  apiPost<SquadAdmin>('/admin/squads', {
    nome,
    order,
    moduloNome: 'nome' in modulo ? modulo.nome : null,
    moduloId: 'id' in modulo ? modulo.id : null,
  })
export const editarSquad = (
  id: string,
  nome: string,
  order: number,
  modulo: { nome: string } | { id: string },
) =>
  apiSend('PUT', `/admin/squads/${id}`, {
    nome,
    order,
    moduloNome: 'nome' in modulo ? modulo.nome : null,
    moduloId: 'id' in modulo ? modulo.id : null,
  })
export const apagarSquad = (id: string) => apiSend('DELETE', `/admin/squads/${id}`)

// Fases
export const listarFases = () => apiGet<Fase[]>('/admin/fases')
export const criarFase = (nome: string, order: number) =>
  apiPost<EntidadeSimples>('/admin/fases', { nome, order })
export const editarFase = (id: string, nome: string, order: number) =>
  apiSend('PUT', `/admin/fases/${id}`, { nome, order })
export const apagarFase = (id: string) => apiSend('DELETE', `/admin/fases/${id}`)

// Módulos. `criarModulo` escolhe a categoria na hora (squadId ou null pra "padrão do sistema") —
// `editarModulo` continua só nome+ordem, o vínculo com squad não muda por ali (ver
// CriarModuloRequest no back). `mudarSquadModulo` é o jeito de corrigir/trocar/desfazer esse
// vínculo DEPOIS de criado (endpoint próprio, ver MudarSquadModuloRequest no back).
export const listarModulos = () => apiGet<Modulo[]>('/admin/modulos')
export const criarModulo = (nome: string, squadId: string | null, order: number) =>
  apiPost<EntidadeSimples>('/admin/modulos', { nome, squadId, order })
export const editarModulo = (id: string, nome: string, order: number) =>
  apiSend('PUT', `/admin/modulos/${id}`, { nome, order })
export const apagarModulo = (id: string) => apiSend('DELETE', `/admin/modulos/${id}`)
export const mudarSquadModulo = (id: string, squadId: string | null) =>
  apiSend('PUT', `/admin/modulos/${id}/squad`, { squadId })

// Passos
export const listarPassosAdmin = () => apiGet<PassoAdmin[]>('/admin/passos')
export const criarPasso = (req: PassoAdminInput) => apiPost<PassoAdmin>('/admin/passos', req)
export const editarPasso = (id: string, req: PassoAdminInput) =>
  apiSend('PUT', `/admin/passos/${id}`, req)
export const apagarPasso = (id: string) => apiSend('DELETE', `/admin/passos/${id}`)

// Fluxos
export const listarFluxosAdmin = () => apiGet<FluxoAdmin[]>('/admin/fluxos')
export const criarFluxo = (req: FluxoAdminInput) => apiPost<FluxoAdmin>('/admin/fluxos', req)
export const editarFluxo = (id: string, req: FluxoAdminInput) =>
  apiSend('PUT', `/admin/fluxos/${id}`, req)
export const apagarFluxo = (id: string) => apiSend('DELETE', `/admin/fluxos/${id}`)

// Usuários (promover/demover a gestor)
export const listarUsuariosAdmin = () => apiGet<UsuarioAdmin[]>('/admin/usuarios')
export const definirGestor = (id: string, isGestor: boolean) =>
  apiSend('PUT', `/admin/usuarios/${id}/gestor`, { isGestor })
export const definirAtivo = (id: string, ativo: boolean) =>
  apiSend('PUT', `/admin/usuarios/${id}/ativo`, { ativo })

// Acessos (ex.: "E-mail Agilean", "Teams") a liberar por Cargo mínimo
export const listarAcessosAdmin = () => apiGet<AcessoAdmin[]>('/admin/acessos')
export const criarAcesso = (req: AcessoAdminInput) => apiPost<AcessoAdmin>('/admin/acessos', req)
export const editarAcesso = (id: string, req: AcessoAdminInput) =>
  apiSend('PUT', `/admin/acessos/${id}`, req)
export const apagarAcesso = (id: string) => apiSend('DELETE', `/admin/acessos/${id}`)

// E-mails pré-autorizados a virar gestor no cadastro
export const listarEmailsAutorizados = () =>
  apiGet<EmailAutorizado[]>('/admin/emails-autorizados')
export const criarEmailAutorizado = (email: string) =>
  apiPost<EmailAutorizado>('/admin/emails-autorizados', { email })
export const apagarEmailAutorizado = (id: string) =>
  apiSend('DELETE', `/admin/emails-autorizados/${id}`)
